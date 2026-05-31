"""Live HTTP integration tests for /v1/probe and /v1/extract against a running worker."""

from __future__ import annotations

import json
import time
from pathlib import Path

import httpx
import pytest
from pydantic import ValidationError

from app.schemas import ExtractResponse, ProbeResponse

BASE_URL = "http://127.0.0.1:8000"
REPO_ROOT = Path(__file__).resolve().parents[3]
SAMPLES_DIR = REPO_ROOT / "samples"
MANIFEST_PATH = SAMPLES_DIR / "manifest.json"
SOURCE_URL = (
    "https://raw.githubusercontent.com/chayprabs/audio-loudnorm-online/main/samples/podcast-demo.wav"
)

SAMPLE_IDS = [item["id"] for item in json.loads(MANIFEST_PATH.read_text())]
OUTPUT_FORMATS = ["wav", "mp3", "aac", "opus", "flac"]
DOWNMIX_MODES = ["keep", "mono", "stereo", "5.1"]
SAMPLE_RATES = [44100, 48000, 22050]
BIT_DEPTHS = [16, 24, 32]


def _worker_available() -> bool:
    try:
        response = httpx.get(f"{BASE_URL}/health", timeout=2.0)
        return response.status_code == 200 and response.json().get("status") in ("ok", "degraded")
    except httpx.HTTPError:
        return False


pytestmark = pytest.mark.skipif(not _worker_available(), reason="Worker not running on 127.0.0.1:8000")


def _validate_probe(payload: dict) -> ProbeResponse:
    return ProbeResponse.model_validate(payload)


def _validate_extract(payload: dict) -> ExtractResponse:
    return ExtractResponse.model_validate(payload)


def _download_artifact(artifact_url: str) -> httpx.Response:
    response = httpx.get(f"{BASE_URL}{artifact_url}", timeout=60.0)
    assert response.status_code == 200, response.text
    assert len(response.content) > 0
    return response


@pytest.mark.parametrize("sample_id", SAMPLE_IDS)
def test_probe_sample_id(sample_id: str):
    response = httpx.post(f"{BASE_URL}/v1/probe", data={"sample_id": sample_id}, timeout=120.0)
    assert response.status_code == 200, response.text
    probe = _validate_probe(response.json())
    assert probe.duration_sec > 0
    assert probe.codec != "unknown"


def test_probe_file_upload():
    sample_path = SAMPLES_DIR / "music-demo.wav"
    with sample_path.open("rb") as handle:
        response = httpx.post(
            f"{BASE_URL}/v1/probe",
            files={"file": ("music-demo.wav", handle, "audio/wav")},
            timeout=120.0,
        )
    assert response.status_code == 200, response.text
    probe = _validate_probe(response.json())
    assert probe.channels >= 1


def test_probe_source_url():
    response = httpx.post(
        f"{BASE_URL}/v1/probe",
        data={"source_url": SOURCE_URL},
        timeout=120.0,
    )
    assert response.status_code == 200, response.text
    probe = _validate_probe(response.json())
    assert probe.sample_rate > 0


@pytest.mark.parametrize("sample_id", SAMPLE_IDS)
def test_extract_sample_id(sample_id: str):
    response = httpx.post(
        f"{BASE_URL}/v1/extract",
        data={"sample_id": sample_id, "output_format": "wav"},
        timeout=120.0,
    )
    assert response.status_code == 200, response.text
    extract = _validate_extract(response.json())
    assert extract.format == "wav"
    _download_artifact(extract.artifact_url)


def test_extract_file_upload():
    sample_path = SAMPLES_DIR / "podcast-demo.wav"
    with sample_path.open("rb") as handle:
        response = httpx.post(
            f"{BASE_URL}/v1/extract",
            files={"file": ("podcast-demo.wav", handle, "audio/wav")},
            data={"output_format": "mp3"},
            timeout=120.0,
        )
    assert response.status_code == 200, response.text
    extract = _validate_extract(response.json())
    assert extract.format == "mp3"
    _download_artifact(extract.artifact_url)


def test_extract_source_url():
    response = httpx.post(
        f"{BASE_URL}/v1/extract",
        data={"source_url": SOURCE_URL, "output_format": "flac"},
        timeout=120.0,
    )
    assert response.status_code == 200, response.text
    extract = _validate_extract(response.json())
    assert extract.format == "flac"
    _download_artifact(extract.artifact_url)


def test_extract_channels_with_keep_downmix():
    response = httpx.post(
        f"{BASE_URL}/v1/extract",
        data={"sample_id": "music-demo", "downmix": "keep", "channels": "1"},
        timeout=120.0,
    )
    assert response.status_code == 200, response.text
    extract = _validate_extract(response.json())
    assert extract.channels == 1
    _download_artifact(extract.artifact_url)


@pytest.mark.parametrize("output_format", OUTPUT_FORMATS)
def test_extract_output_format(output_format: str):
    response = httpx.post(
        f"{BASE_URL}/v1/extract",
        data={"sample_id": "music-demo", "output_format": output_format},
        timeout=120.0,
    )
    assert response.status_code == 200, response.text
    extract = _validate_extract(response.json())
    assert extract.format == output_format
    _download_artifact(extract.artifact_url)


@pytest.mark.parametrize("downmix", DOWNMIX_MODES)
def test_extract_downmix(downmix: str):
    response = httpx.post(
        f"{BASE_URL}/v1/extract",
        data={"sample_id": "music-demo", "downmix": downmix},
        timeout=120.0,
    )
    assert response.status_code == 200, response.text
    extract = _validate_extract(response.json())
    assert extract.downmix == downmix
    if downmix == "mono":
        assert extract.channels == 1
    elif downmix == "stereo":
        assert extract.channels == 2
    elif downmix == "5.1":
        assert extract.channels == 6
    _download_artifact(extract.artifact_url)


@pytest.mark.parametrize("sample_rate", SAMPLE_RATES)
def test_extract_sample_rate(sample_rate: int):
    response = httpx.post(
        f"{BASE_URL}/v1/extract",
        data={"sample_id": "music-demo", "sample_rate": str(sample_rate)},
        timeout=120.0,
    )
    assert response.status_code == 200, response.text
    extract = _validate_extract(response.json())
    assert extract.sample_rate == sample_rate
    _download_artifact(extract.artifact_url)


@pytest.mark.parametrize("bit_depth", BIT_DEPTHS)
def test_extract_bit_depth_wav(bit_depth: int):
    response = httpx.post(
        f"{BASE_URL}/v1/extract",
        data={
            "sample_id": "music-demo",
            "output_format": "wav",
            "bit_depth": str(bit_depth),
        },
        timeout=120.0,
    )
    assert response.status_code == 200, response.text
    extract = _validate_extract(response.json())
    assert extract.bit_depth == bit_depth
    _download_artifact(extract.artifact_url)


def test_extract_defaults():
    response = httpx.post(
        f"{BASE_URL}/v1/extract",
        data={"sample_id": "podcast-demo"},
        timeout=120.0,
    )
    assert response.status_code == 200, response.text
    extract = _validate_extract(response.json())
    assert extract.format == "wav"
    assert extract.downmix == "keep"
    _download_artifact(extract.artifact_url)


def test_extract_downmix_overrides_channels():
    response = httpx.post(
        f"{BASE_URL}/v1/extract",
        data={"sample_id": "music-demo", "downmix": "mono", "channels": "2"},
        timeout=120.0,
    )
    assert response.status_code == 200, response.text
    extract = _validate_extract(response.json())
    assert extract.channels == 1
    _download_artifact(extract.artifact_url)


def test_probe_returns_audio_streams():
    response = httpx.post(
        f"{BASE_URL}/v1/probe",
        data={"sample_id": "voiceover-demo"},
        timeout=120.0,
    )
    assert response.status_code == 200, response.text
    probe = _validate_probe(response.json())
    assert len(probe.streams) >= 1
    assert any(stream.codec_type == "audio" for stream in probe.streams)


def test_extract_combined_format_and_processing():
    response = httpx.post(
        f"{BASE_URL}/v1/extract",
        data={
            "sample_id": "music-demo",
            "output_format": "mp3",
            "downmix": "mono",
            "sample_rate": "22050",
        },
        timeout=120.0,
    )
    assert response.status_code == 200, response.text
    extract = _validate_extract(response.json())
    assert extract.format == "mp3"
    assert extract.downmix == "mono"
    assert extract.sample_rate == 22050
    assert extract.channels == 1
    _download_artifact(extract.artifact_url)


def _wait_for_job(job_id: str, timeout_sec: float = 30.0) -> dict:
    deadline = time.monotonic() + timeout_sec
    while time.monotonic() < deadline:
        response = httpx.get(f"{BASE_URL}/v1/jobs/{job_id}", timeout=10.0)
        job = response.json()
        if job["status"] == "completed":
            return job
        if job["status"] == "failed":
            raise AssertionError(job.get("error"))
        time.sleep(0.5)
    raise AssertionError(f"Job {job_id} did not complete within {timeout_sec}s")


def test_probe_async_completes():
    response = httpx.post(
        f"{BASE_URL}/v1/probe",
        data={"sample_id": "podcast-demo", "async_mode": "true"},
        timeout=120.0,
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["status"] == "queued"
    job = _wait_for_job(payload["job_id"])
    _validate_probe(job["result"])


def test_extract_async_completes():
    response = httpx.post(
        f"{BASE_URL}/v1/extract",
        data={"sample_id": "podcast-demo", "output_format": "flac", "async_mode": "true"},
        timeout=120.0,
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["status"] == "queued"
    job = _wait_for_job(payload["job_id"])
    extract = _validate_extract(job["result"])
    _download_artifact(extract.artifact_url)
