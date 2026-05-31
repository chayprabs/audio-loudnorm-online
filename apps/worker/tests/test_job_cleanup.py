from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.job_cleanup import purge_expired_jobs
from app.job_store import job_store
from app.settings import settings


def setup_function():
    job_store.reset()


def test_purge_expired_jobs_removes_record_and_directory(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "job_root", tmp_path)
    job = job_store.create("probe")
    job_dir = tmp_path / job.id
    job_dir.mkdir(parents=True)
    (job_dir / "artifact.wav").write_bytes(b"demo")

    expired = job_store.get(job.id)
    expired.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)

    removed = purge_expired_jobs()
    assert removed >= 1
    assert not job_dir.exists()
    assert not job_store.exists(job.id)
