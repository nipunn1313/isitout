import os
import subprocess
from datetime import datetime

from dotenv import load_dotenv

from convex import ConvexClient

if os.environ.get("PROD"):
    load_dotenv(".env")
else:
    load_dotenv(".env.local")

SECRET = os.environ["ISITOUT_SECRET"]
assert SECRET

CONVEX_URL = os.environ["CONVEX_URL"]
convex_client = ConvexClient(CONVEX_URL)
convex_client.set_debug(True)

service = "convex-backend"
result = subprocess.run(
    ["poetry", "run", "current-version", service],
    cwd=os.path.expanduser("~/src/convex/ops/builder"),
    capture_output=True,
    check=True,
)

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

now = datetime.now().timestamp()
print(now)
convex_client.mutation("last_sync:update", {"time": now, "secret": SECRET})

print("Completed successfully")
