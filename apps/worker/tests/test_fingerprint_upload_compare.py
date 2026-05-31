import shutil
from io import BytesIO
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app, job_store

REPO_ROOT = Path(__file__).resolve().parents[3]


def setup_function():
    job_store.reset()


def _require_binary(name: str) -> None:
    if shutil.which(name) is None:
        pytest.skip(f"{name} is not available on PATH")


def test_fingerprint_compare_two_uploads():
    _require_binary("fpcalc")
    client = TestClient(app)
    sample_a = (REPO_ROOT / "samples" / "near-duplicate-a.wav").read_bytes()
    sample_b = (REPO_ROOT / "samples" / "near-duplicate-b.wav").read_bytes()

    response = client.post(
        "/v1/fingerprint",
        data={"compare_mode": "true"},
        files={
            "file": ("a.wav", BytesIO(sample_a), "audio/wav"),
            "file_b": ("b.wav", BytesIO(sample_b), "audio/wav"),
        },
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["score"] >= 0.95
