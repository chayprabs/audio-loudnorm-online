import shutil

import pytest
from fastapi.testclient import TestClient

from app.main import app, job_store


def setup_function():
    job_store.reset()


def _require_binary(name: str) -> None:
    if shutil.which(name) is None:
        pytest.skip(f"{name} is not available on PATH")


def test_fingerprint_compare_mode_requires_second_input():
    client = TestClient(app, raise_server_exceptions=False)
    response = client.post(
        "/v1/fingerprint",
        data={"sample_id": "near-duplicate-a", "compare_mode": "true"},
    )
    assert response.status_code == 400
    assert "Compare mode requires" in response.json()["detail"]
    assert job_store.list_active() == []


def test_fingerprint_compare_mode_scores_near_duplicates():
    _require_binary("fpcalc")
    client = TestClient(app)
    response = client.post(
        "/v1/fingerprint",
        data={
            "sample_id": "near-duplicate-a",
            "sample_id_b": "near-duplicate-b",
            "compare_mode": "true",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["score"] >= 0.95
    assert "fingerprint" not in payload


def test_fingerprint_single_mode_generates_fingerprint():
    _require_binary("fpcalc")
    client = TestClient(app)
    response = client.post(
        "/v1/fingerprint",
        data={"sample_id": "near-duplicate-a", "compare_mode": "false"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["algorithm"] == "chromaprint"
    assert payload["fingerprint"]
    assert "score" not in payload


def test_silence_detects_ranges_and_exports_json():
    _require_binary("ffmpeg")
    client = TestClient(app)
    response = client.post(
        "/v1/silence",
        data={
            "sample_id": "voiceover-demo",
            "threshold_db": "-38",
            "min_duration_sec": "0.5",
            "trim": "true",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["ranges"]) >= 2
    assert payload["ranges_artifact_url"].endswith("silence-ranges.json")
    assert payload["trimmed_artifact_url"] is not None

    artifact = client.get(payload["ranges_artifact_url"])
    assert artifact.status_code == 200
    assert artifact.json() == {"ranges": payload["ranges"]}


def test_silence_trim_false_omits_trimmed_artifact():
    _require_binary("ffmpeg")
    client = TestClient(app)
    response = client.post(
        "/v1/silence",
        data={
            "sample_id": "voiceover-demo",
            "threshold_db": "-38",
            "min_duration_sec": "0.5",
            "trim": "false",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["trimmed_artifact_url"] is None
    assert payload["ranges_artifact_url"].endswith("silence-ranges.json")
