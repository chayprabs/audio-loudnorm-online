from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Any
from uuid import uuid4

from .settings import settings


@dataclass
class JobRecord:
    id: str
    feature: str
    status: str = "queued"
    progress: int = 0
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc)
        + timedelta(seconds=settings.artifact_ttl_seconds)
    )
    payload: dict[str, Any] = field(default_factory=dict)
    result: dict[str, Any] | None = None
    error: str | None = None
    cancelled: bool = False


class JobStore:
    def __init__(self) -> None:
        self._items: dict[str, JobRecord] = {}
        self._lock = Lock()

    def create(self, feature: str, payload: dict[str, Any] | None = None) -> JobRecord:
        job = JobRecord(id=uuid4().hex, feature=feature, payload=payload or {})
        with self._lock:
            self._items[job.id] = job
        return job

    def list_active(self) -> list[JobRecord]:
        with self._lock:
            return list(self._items.values())

    def get(self, job_id: str) -> JobRecord:
        with self._lock:
            return self._items[job_id]

    def update_progress(self, job_id: str, progress: int, status: str | None = None) -> JobRecord:
        with self._lock:
            job = self._items[job_id]
            job.progress = max(0, min(progress, 100))
            if status:
                job.status = status
            job.updated_at = datetime.now(timezone.utc)
            return job

    def complete(self, job_id: str, result: dict[str, Any]) -> JobRecord:
        with self._lock:
            job = self._items[job_id]
            job.result = result
            job.progress = 100
            job.status = "completed"
            job.updated_at = datetime.now(timezone.utc)
            return job

    def fail(self, job_id: str, error: str) -> JobRecord:
        with self._lock:
            job = self._items[job_id]
            job.error = error
            job.status = "failed"
            job.updated_at = datetime.now(timezone.utc)
            return job

    def cancel(self, job_id: str) -> JobRecord:
        with self._lock:
            job = self._items[job_id]
            job.cancelled = True
            job.status = "cancelled"
            job.updated_at = datetime.now(timezone.utc)
            return job


job_store = JobStore()
