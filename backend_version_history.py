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
convex_client.set_debug(True)

services = [
    "convex-backend",
    "big-brain",
    "searchlight",
    "funrun",
    "load-generator",
    "db-verifier",
]

last_error = None
for service in services:
    try:
        result = subprocess.run(
            [
                os.path.expanduser("~/.local/bin/poetry"),
                "run",
                "current-version",
                service,
            ],
            cwd=os.path.expanduser("~/src/convex/ops/builder"),
            capture_output=True,
            check=True,
        )
    except subprocess.CalledProcessError as e:
        sys.stdout.buffer.write(e.stdout)
        sys.stdout.buffer.write(e.stderr)
        last_error = e
        continue

    line = result.stdout.decode("utf-8").strip()
    version = line.split(" ")[0]

    convex_client.mutation(
        "version_history:addRow",
        {
            "version": version,
            "service": service,
            "secret": SECRET,
        },
    )

if last_error:
    raise last_error

now = datetime.now().timestamp()
print(now)
convex_client.mutation("last_sync:update", {"time": now, "secret": SECRET})

print("Completed successfully")
