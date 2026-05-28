import asyncio

from fastapi.testclient import TestClient

from app.main import _run_async_job, app, job_store


def setup_function():
    job_store.reset()


def test_async_probe_job_completes_and_reports_webhook(monkeypatch):
    client = TestClient(app)
    delivered = []

    async def fake_deliver(webhook_url, payload):
        delivered.append((webhook_url, payload))

    monkeypatch.setattr("app.main.probe_audio", lambda path: {"codec": "pcm_s16le", "path": str(path)})
    monkeypatch.setattr("app.main._deliver_webhook", fake_deliver)

    response = client.post(
        "/v1/probe",
        data={
            "sample_id": "podcast-demo",
            "async_mode": "true",
            "webhook_url": "https://example.com/webhook",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "queued"

    job = client.get(f"/v1/jobs/{payload['job_id']}").json()
    assert job["status"] == "completed"
    assert job["progress"] == 100
    assert delivered[-1][0] == "https://example.com/webhook"
    assert delivered[-1][1]["status"] == "completed"


def test_cancelled_async_job_does_not_complete(monkeypatch):
    delivered = []

    async def fake_deliver(webhook_url, payload):
        delivered.append((webhook_url, payload))

    monkeypatch.setattr("app.main._deliver_webhook", fake_deliver)

    job = job_store.create("probe")
    job_store.cancel(job.id)

    asyncio.run(
        _run_async_job(
            job_id=job.id,
            webhook_url="https://example.com/cancelled",
            runner=lambda: {"ignored": True},
        )
    )

    cancelled = job_store.get(job.id)
    assert cancelled.status == "cancelled"
    assert cancelled.result is None
    assert delivered[-1][1]["status"] == "cancelled"
