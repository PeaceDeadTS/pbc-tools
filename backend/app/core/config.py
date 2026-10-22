from pathlib import Path

# backend/app/core/config.py -> repository root is four levels up.
REPO_ROOT = Path(__file__).resolve().parents[3]
MANIFEST_PATH = REPO_ROOT / "shared" / "tools.json"
