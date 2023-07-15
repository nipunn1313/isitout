import os
import subprocess
from datetime import datetime

from dotenv import load_dotenv

from convex import ConvexClient

if os.environ.get("PROD"):
    load_dotenv(".env")
else:
    load_dotenv(".env.local")
CONVEX_URL = os.environ["CONVEX_URL"]
convex_client = ConvexClient(CONVEX_URL)
convex_client.set_debug(True)

result = subprocess.run(
    ["big-brain-tool", "backend-version-history", "-n", "100"],
    capture_output=True,
    check=True,
)

rows = []
for line in result.stdout.decode("utf-8").strip().split("\n"):
    parts = line.split("\t")
    assert len(parts) == 4
    assert parts[2] == ""
    rows.append(
        {
            "pushDate": parts[0],
            "version": parts[1],
            "url": parts[3],
        }
    )
convex_client.mutation("backend_version_history:upload", {"rows": rows})

now = datetime.now().timestamp()
print(now)
convex_client.mutation("last_sync:update", {"time": now})

print("Completed successfully")
