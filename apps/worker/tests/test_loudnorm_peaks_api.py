import io
import shutil
import time
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app, job_store
from app.operations import PRESETS
from app.sample_catalog import list_samples


REPO_ROOT = Path(__file__).resolve().parents[3]
SAMPLES_DIR = REPO_ROOT / "samples"
PEAK_ZOOMS = [256, 1024, 4096]
LOUDNORM_SAMPLE_IDS = ["podcast-demo", "music-demo", "voiceover-demo"]


def setup_function():
    job_store.reset()


def _require_binary(name: str) -> None:
    if shutil.which(name) is None:
        pytest.skip(f"{name} is not available on PATH")


def _assert_loudnorm_stats(stats: dict, *, label: str) -> None:
    assert "I" in stats and "LRA" in stats and "TP" in stats, label
    assert -70 <= float(stats["I"]) <= 0, f"{label} integrated loudness out of range"
    assert 0 <= float(stats["LRA"]) <= 30, f"{label} LRA out of range"
    assert -20 <= float(stats["TP"]) <= 3, f"{label} true peak out of range"


def _assert_after_near_target(after: dict, target: dict, *, tolerance_i: float = 2.0) -> None:
    assert abs(float(after["I"]) - float(target["I"])) <= tolerance_i


def _assert_peak_levels(levels: list[dict]) -> None:
    zooms = {level["zoom"]: level for level in levels}
    assert set(zooms) == set(PEAK_ZOOMS)
    for zoom in PEAK_ZOOMS:
        samples = zooms[zoom]["samples"]
        assert samples, f"zoom {zoom} returned no samples"
        assert len(samples) <= zoom, f"zoom {zoom} returned too many buckets"


@pytest.mark.parametrize("preset", list(PRESETS))
@pytest.mark.parametrize("mode", ["single-pass", "two-pass"])
@pytest.mark.parametrize("sample_id", LOUDNORM_SAMPLE_IDS)
def test_loudnorm_valid_sample_id_returns_stats_and_artifact(preset, mode, sample_id):
    _require_binary("ffmpeg")
    client = TestClient(app)
    response = client.post(
        "/v1/loudnorm",
        data={"sample_id": sample_id, "preset": preset, "mode": mode},
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["preset"] == preset
    assert payload["mode"] == mode
    _assert_loudnorm_stats(payload["before"], label="before")
    _assert_loudnorm_stats(payload["after"], label="after")
    _assert_after_near_target(payload["after"], payload["target"])
    artifact = client.get(payload["artifact_url"])
    assert artifact.status_code == 200
    assert len(artifact.content) > 100


@pytest.mark.parametrize("mode", ["single-pass", "two-pass"])
def test_loudnorm_valid_upload_returns_stats_and_artifact(mode):
    _require_binary("ffmpeg")
    client = TestClient(app)
    sample_path = SAMPLES_DIR / "podcast-demo.wav"
    with sample_path.open("rb") as handle:
        response = client.post(
            "/v1/loudnorm",
            data={"preset": "spotify", "mode": mode},
            files={"file": ("podcast-demo.wav", handle, "audio/wav")},
        )
    assert response.status_code == 200, response.text
    payload = response.json()
    _assert_loudnorm_stats(payload["before"], label="before")
    _assert_loudnorm_stats(payload["after"], label="after")
    _assert_after_near_target(payload["after"], payload["target"])


@pytest.mark.parametrize("sample_id", [item["id"] for item in list_samples()])
def test_peaks_valid_sample_id_returns_multi_zoom_json_and_png(sample_id):
    _require_binary("ffmpeg")
    client = TestClient(app)
    response = client.post("/v1/peaks", data={"sample_id": sample_id})
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["duration_sec"] > 0
    _assert_peak_levels(payload["levels"])

    json_artifact = client.get(payload["json_artifact_url"])
    assert json_artifact.status_code == 200
    artifact_payload = json_artifact.json()
    _assert_peak_levels(artifact_payload["levels"])

    png_response = client.get(payload["waveform_png_url"])
    assert png_response.status_code == 200
    image = Image.open(io.BytesIO(png_response.content))
    assert image.format == "PNG"
    assert image.size == (1200, 320)
    image.verify()


def test_peaks_valid_upload_returns_multi_zoom_json_and_png():
    _require_binary("ffmpeg")
    client = TestClient(app)
    sample_path = SAMPLES_DIR / "music-demo.wav"
    with sample_path.open("rb") as handle:
        response = client.post(
            "/v1/peaks",
            files={"file": ("music-demo.wav", handle, "audio/wav")},
        )
    assert response.status_code == 200, response.text
    _assert_peak_levels(response.json()["levels"])


def test_loudnorm_async_job_completes_with_valid_result():
    _require_binary("ffmpeg")
    client = TestClient(app)
    response = client.post(
        "/v1/loudnorm",
        data={
            "sample_id": "podcast-demo",
            "preset": "apple",
            "mode": "two-pass",
            "async_mode": "true",
        },
    )
    assert response.status_code == 200
    job_id = response.json()["job_id"]

    job = None
    for _ in range(100):
        job = client.get(f"/v1/jobs/{job_id}").json()
        if job["status"] in {"completed", "failed", "cancelled"}:
            break
        time.sleep(0.1)

    assert job is not None
    assert job["status"] == "completed", job.get("error")
    result = job["result"]
    _assert_loudnorm_stats(result["after"], label="after")
    _assert_after_near_target(result["after"], result["target"])


def test_peaks_async_job_completes_with_valid_result():
    _require_binary("ffmpeg")
    client = TestClient(app)
    response = client.post(
        "/v1/peaks",
        data={"sample_id": "music-demo", "async_mode": "true"},
    )
    assert response.status_code == 200
    job_id = response.json()["job_id"]

    job = None
    for _ in range(100):
        job = client.get(f"/v1/jobs/{job_id}").json()
        if job["status"] in {"completed", "failed", "cancelled"}:
            break
        time.sleep(0.1)

    assert job is not None
    assert job["status"] == "completed", job.get("error")
    _assert_peak_levels(job["result"]["levels"])
