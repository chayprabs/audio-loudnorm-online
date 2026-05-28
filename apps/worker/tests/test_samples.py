from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app
from app.sample_catalog import get_sample, get_sample_path, list_samples


def test_sample_manifest_is_available():
    samples = list_samples()
    assert len(samples) >= 5
    assert get_sample("podcast-demo")["fileName"] == "podcast-demo.wav"


def test_sample_path_resolves_inside_samples_directory():
    sample_path = get_sample_path("voiceover-demo")
    assert sample_path is not None
    assert sample_path.name == "voiceover-with-silence.wav"
    assert sample_path.exists()


def test_samples_endpoint_returns_manifest():
    client = TestClient(app)
    response = client.get("/v1/samples")
    assert response.status_code == 200
    payload = response.json()
    assert any(item["id"] == "music-demo" for item in payload)


def test_probe_uses_sample_fixture(monkeypatch):
    client = TestClient(app)
    captured = {}

    def fake_probe_audio(path: Path):
        captured["path"] = path
        return {
            "container": "wav",
            "streams": [],
            "codec": "pcm_s16le",
            "channels": 1,
            "sample_rate": 48000,
            "bit_depth": 16,
            "duration_sec": 1.0,
            "integrated_lufs": -18.5,
        }

    monkeypatch.setattr("app.main.probe_audio", fake_probe_audio)
    response = client.post("/v1/probe", data={"sample_id": "podcast-demo"})

    assert response.status_code == 200
    assert response.json()["codec"] == "pcm_s16le"
    assert captured["path"].name == "podcast-demo.wav"
    assert captured["path"].exists()
