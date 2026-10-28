"""Load and return saved evaluation results."""
import json
import os
from pathlib import Path

ARTIFACTS_DIR = Path(os.getenv("MODEL_ARTIFACTS_DIR", "./artifacts"))


def load_evaluation_results() -> list[dict]:
    path = ARTIFACTS_DIR / "evaluation_results.json"
    if not path.exists():
        return []
    with open(path) as f:
        return json.load(f)
