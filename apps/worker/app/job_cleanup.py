from __future__ import annotations

import logging
import shutil
from datetime import datetime, timezone
from pathlib import Path

from .job_store import job_store
from .settings import settings

logger = logging.getLogger("audio-suite.worker")


def purge_expired_jobs() -> int:
    """Remove expired job records and their on-disk artifact directories."""
    now = datetime.now(timezone.utc)
    removed = 0

    for job in job_store.list_active():
        if job.expires_at > now:
            continue

        job_dir = settings.job_root / job.id
        if job_dir.exists():
            shutil.rmtree(job_dir, ignore_errors=True)
        job_store.remove(job.id)
        removed += 1

    removed += _purge_orphan_job_dirs(now)
    if removed:
        logger.info("Purged %s expired audio job(s).", removed)
    return removed


def _purge_orphan_job_dirs(now: datetime) -> int:
    """Delete artifact folders with no matching in-memory job past TTL age."""
    if not settings.job_root.exists():
        return 0

    removed = 0
    ttl_seconds = settings.artifact_ttl_seconds

    for entry in settings.job_root.iterdir():
        if not entry.is_dir():
            continue
        if job_store.exists(entry.name):
            continue

        age_seconds = now.timestamp() - entry.stat().st_mtime
        if age_seconds < ttl_seconds:
            continue

        shutil.rmtree(entry, ignore_errors=True)
        removed += 1

    return removed
