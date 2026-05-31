import pytest
from fastapi.testclient import TestClient

from app.main import app, job_store


@pytest.mark.parametrize("output_format", ["wav", "mp3", "aac", "opus", "flac"])
def test_extract_outputs_supported_formats(output_format: str):
    job_store.reset()
    client = TestClient(app)
    response = client.post(
        "/v1/extract",
        data={
            "sample_id": "music-demo",
            "output_format": output_format,
            "async_mode": "false",
        },
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["format"] == output_format
    assert payload["artifact_url"].startswith("/artifacts/")
