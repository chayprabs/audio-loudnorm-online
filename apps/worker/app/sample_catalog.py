from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any


SAMPLES_DIR = Path(__file__).resolve().parents[3] / "samples"
MANIFEST_PATH = SAMPLES_DIR / "manifest.json"


@lru_cache(maxsize=1)
def load_sample_manifest() -> list[dict[str, Any]]:
    return json.loads(MANIFEST_PATH.read_text())


def list_samples() -> list[dict[str, Any]]:
    return load_sample_manifest()


def get_sample(sample_id: str) -> dict[str, Any] | None:
    return next((item for item in load_sample_manifest() if item["id"] == sample_id), None)


def get_sample_path(sample_id: str) -> Path | None:
    item = get_sample(sample_id)
    if not item:
        return None
    target = (SAMPLES_DIR / item["fileName"]).resolve()
    if not str(target).startswith(str(SAMPLES_DIR.resolve())):
        return None
    return target
