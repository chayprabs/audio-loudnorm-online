from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint_reports_runtime_status():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] in {"ok", "degraded"}
    assert isinstance(payload["ffmpeg"], bool)
    assert isinstance(payload["fpcalc"], bool)
    assert payload["artifact_ttl_seconds"] == 3600
