import subprocess

from dotenv import load_dotenv

load_dotenv(".env.local")
result = subprocess.run(
    ["big-brain-tool", "backend-version-history", "-n", "100"],
    capture_output=True,
    check=True,
)

lines = []
for line in result.stdout.decode("utf-8").strip().split("\n"):
    parts = line.split("\t")
    assert len(parts) == 4
    lines.append(parts)

print(lines)
