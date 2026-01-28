import json
import os
import subprocess
import sys
from datetime import datetime

from dotenv import load_dotenv

from convex import ConvexClient

if os.environ.get("PROD"):
    load_dotenv(".env")
else:
    load_dotenv(".env.local")

os.environ["PATH"] = os.environ["PATH"] + ":" + "/usr/local/bin"

SECRET = os.environ["ISITOUT_SECRET"]
assert SECRET

CONVEX_URL = os.environ["CONVEX_URL"]
convex_client = ConvexClient(CONVEX_URL)

last_error = None

try:
    result = subprocess.run(
        [
            os.path.expanduser("~/.local/bin/poetry"),
            "run",
            "services",
        ],
        cwd=os.path.expanduser("~/src/convex/ops/builder"),
        capture_output=True,
        check=True,
    )
except subprocess.CalledProcessError as e:
    sys.stdout.buffer.write(e.stdout)
    sys.stdout.buffer.write(e.stderr)

builder_services = result.stdout.decode("utf-8").splitlines()

for service in builder_services:
    try:
        result = subprocess.run(
            [
                os.path.expanduser("~/.local/bin/poetry"),
                "run",
                "current-version",
                service,
                "--all-tags",
                "--json",
            ],
            cwd=os.path.expanduser("~/src/convex/ops/builder"),
            capture_output=True,
            check=True,
        )
    except subprocess.CalledProcessError as e:
        if e.stdout.decode("utf-8").strip() == "unknown":
            continue
        sys.stdout.buffer.write(e.stdout)
        sys.stdout.buffer.write(e.stderr)
        last_error = e
        continue

    output = result.stdout.decode("utf-8").strip()
    if not output or output == "unknown":
        continue

    try:
        tags_data = json.loads(output)
    except json.JSONDecodeError:
        print(f"Failed to parse JSON for service {service}: {output}")
        continue

    for release_tag, tag_info in tags_data.items():
        version = tag_info.get("version")
        if not version or version == "unknown":
            continue

        convex_client.mutation(
            "version_history:addRow",
            {
                "version": version,
                "service": service,
                "release_tag": release_tag,
                "secret": SECRET,
            },
        )

if last_error:
    raise last_error

now = datetime.now().timestamp()
print(now)
convex_client.mutation("last_sync:update", {"time": now, "secret": SECRET})

print("Completed successfully")
