from fastapi.testclient import TestClient

from app.main import app, job_store


def setup_function():
    job_store.reset()


def test_extract_rejects_invalid_output_format():
    client = TestClient(app, raise_server_exceptions=False)
    response = client.post(
        "/v1/extract",
        data={"sample_id": "podcast-demo", "output_format": "invalid"},
    )
    assert response.status_code == 400
    assert "Unsupported output format" in response.json()["detail"]
    assert job_store.list_active() == []


def test_extract_rejects_invalid_downmix():
    client = TestClient(app, raise_server_exceptions=False)
    response = client.post(
        "/v1/extract",
        data={"sample_id": "podcast-demo", "downmix": "invalid"},
    )
    assert response.status_code == 400
    assert "Unsupported downmix mode" in response.json()["detail"]
    assert job_store.list_active() == []


def test_extract_reports_effective_channels_for_downmix():
    client = TestClient(app)
    response = client.post(
        "/v1/extract",
        data={"sample_id": "podcast-demo", "downmix": "mono"},
    )
    assert response.status_code == 200
    assert response.json()["channels"] == 1


def test_loudnorm_rejects_invalid_preset():
    client = TestClient(app, raise_server_exceptions=False)
    response = client.post(
        "/v1/loudnorm",
        data={"sample_id": "podcast-demo", "preset": "invalid"},
    )
    assert response.status_code == 400
    assert "Unknown loudnorm preset" in response.json()["detail"]
    assert job_store.list_active() == []


def test_loudnorm_rejects_invalid_mode():
    client = TestClient(app, raise_server_exceptions=False)
    response = client.post(
        "/v1/loudnorm",
        data={"sample_id": "podcast-demo", "mode": "invalid"},
    )
    assert response.status_code == 400
    assert "Unsupported loudnorm mode" in response.json()["detail"]
    assert job_store.list_active() == []


def test_loudnorm_custom_requires_all_targets():
    client = TestClient(app, raise_server_exceptions=False)
    response = client.post(
        "/v1/loudnorm",
        data={"sample_id": "podcast-demo", "preset": "custom", "target_i": "-14"},
    )
    assert response.status_code == 400
    assert "Custom loudnorm requires" in response.json()["detail"]
    assert job_store.list_active() == []
