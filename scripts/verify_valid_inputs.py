#!/usr/bin/env python3
"""Smoke all valid-input API paths against a running worker on localhost:8000."""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import httpx

BASE = "http://127.0.0.1:8000"
ROOT = Path(__file__).resolve().parents[1]
SAMPLES = json.loads((ROOT / "samples" / "manifest.json").read_text())


def check(name: str, ok: bool, detail: str = "") -> None:
    status = "PASS" if ok else "FAIL"
    print(f"[{status}] {name}" + (f" — {detail}" if detail else ""))
    if not ok:
        sys.exit(1)


def main() -> None:
    client = httpx.Client(base_url=BASE, timeout=120.0)
    try:
        health = client.get("/health").json()
        check("health", health.get("status") in ("ok", "degraded"), str(health))
        check("health booleans", isinstance(health.get("ffmpeg"), bool), str(type(health.get("ffmpeg"))))
    except httpx.HTTPError as exc:
        print(f"Worker not reachable at {BASE}: {exc}")
        sys.exit(2)

    for sample_id in [item["id"] for item in SAMPLES]:
        probe = client.post("/v1/probe", data={"sample_id": sample_id}).json()
        check(f"probe {sample_id}", "duration_sec" in probe, f"{probe.get('duration_sec')}s")

    for fmt in ("wav", "mp3", "aac", "opus", "flac"):
        extract = client.post(
            "/v1/extract",
            data={"sample_id": "music-demo", "output_format": fmt},
        ).json()
        check(f"extract {fmt}", extract.get("artifact_url", "").startswith("/artifacts/"))

    for preset in ("spotify", "apple", "youtube", "ebu"):
        loud = client.post(
            "/v1/loudnorm",
            data={"sample_id": "podcast-demo", "preset": preset, "mode": "two-pass"},
        ).json()
        check(f"loudnorm {preset}", "after" in loud and "before" in loud)

    peaks = client.post("/v1/peaks", data={"sample_id": "music-demo"}).json()
    check("peaks", len(peaks.get("levels", [])) >= 3)

    fp = client.post(
        "/v1/fingerprint",
        data={
            "sample_id": "near-duplicate-a",
            "sample_id_b": "near-duplicate-b",
            "compare_mode": "true",
        },
    ).json()
    check("fingerprint compare", fp.get("score", 0) >= 0.95, f"score={fp.get('score')}")

    silence = client.post(
        "/v1/silence",
        data={"sample_id": "voiceover-demo", "threshold_db": "-38", "min_duration_sec": "0.5", "trim": "true"},
    ).json()
    check("silence", len(silence.get("ranges", [])) >= 1)

    queued = client.post(
        "/v1/loudnorm",
        data={"sample_id": "podcast-demo", "async_mode": "true"},
    ).json()
    job_id = queued["job_id"]
    for _ in range(60):
        job = client.get(f"/v1/jobs/{job_id}").json()
        if job["status"] == "completed":
            check("async loudnorm", "after" in job["result"])
            break
        time.sleep(0.5)
    else:
        check("async loudnorm", False, "timeout")

    print("\nAll valid-input smoke checks passed.")


if __name__ == "__main__":
    main()
