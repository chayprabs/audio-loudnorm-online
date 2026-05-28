from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.responses import JSONResponse

from .job_store import job_store
from .media import CommandError, run_command
from .operations import (
    artifact_url,
    compare_fingerprints,
    create_job_dir,
    detect_silence,
    extract_audio,
    fingerprint_audio,
    generate_peaks,
    loudnorm_audio,
    probe_audio,
    stage_input,
)
from .sample_catalog import list_samples
from .schemas import (
    AsyncJobAccepted,
    ExtractResponse,
    FingerprintCompareResponse,
    FingerprintResponse,
    JobStatusResponse,
    LoudnormResponse,
    PeaksResponse,
    ProbeResponse,
    SilenceResponse,
)
from .settings import settings

logger = logging.getLogger("audio-suite.worker")
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.job_root.mkdir(parents=True, exist_ok=True)
    for command in (["ffmpeg", "-version"], ["fpcalc", "-version"]):
        try:
            version = run_command(command).stdout.splitlines()[0]
        except Exception as exc:
            version = f"unavailable ({exc})"
        logger.info("%s", version)
    yield


app = FastAPI(title="AudioSuite Worker", version="0.1.0", lifespan=lifespan)


def _job_status(job_id: str) -> JobStatusResponse:
    job = job_store.get(job_id)
    return JobStatusResponse(
        id=job.id,
        feature=job.feature,
        status=job.status,
        progress=job.progress,
        result=job.result,
        error=job.error,
        expires_at=job.expires_at.isoformat(),
    )


async def _deliver_webhook(webhook_url: str | None, payload: dict) -> None:
    if not webhook_url:
        return
    async with httpx.AsyncClient(timeout=30.0) as client:
        await client.post(webhook_url, json=payload)


async def _run_async_job(
    *,
    job_id: str,
    webhook_url: str | None,
    runner,
) -> None:
    try:
        if not job_store.exists(job_id):
            raise RuntimeError(f"Unknown job id {job_id}")
        if job_store.get(job_id).cancelled:
            await _deliver_webhook(webhook_url, {"job_id": job_id, "status": "cancelled"})
            return

        job_store.update_progress(job_id, 10, status="running")
        job_store.update_progress(job_id, 40)
        result = await asyncio.to_thread(runner)
        if job_store.get(job_id).cancelled:
            await _deliver_webhook(webhook_url, {"job_id": job_id, "status": "cancelled"})
            return
        job_store.update_progress(job_id, 90)
        job_store.complete(job_id, result)
        await _deliver_webhook(
            webhook_url,
            {"job_id": job_id, "status": "completed", "result": result},
        )
    except Exception as exc:
        job_store.fail(job_id, str(exc))
        await _deliver_webhook(webhook_url, {"job_id": job_id, "status": "failed", "error": str(exc)})


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/v1/samples")
async def samples() -> list[dict]:
    return list_samples()


@app.get("/v1/jobs/{job_id}", response_model=JobStatusResponse)
async def get_job(job_id: str) -> JobStatusResponse:
    return _job_status(job_id)


@app.post("/v1/jobs/{job_id}/cancel", response_model=JobStatusResponse)
async def cancel_job(job_id: str) -> JobStatusResponse:
    job_store.cancel(job_id)
    return _job_status(job_id)


@app.get("/artifacts/{job_id}/{file_name}")
async def get_artifact(job_id: str, file_name: str) -> FileResponse:
    target = (settings.job_root / job_id / file_name).resolve()
    if not str(target).startswith(str(settings.job_root.resolve())):
        raise HTTPException(status_code=403, detail="Forbidden artifact path.")
    if not target.exists():
        raise HTTPException(status_code=404, detail="Artifact not found.")
    return FileResponse(target)


@app.post("/v1/probe", response_model=ProbeResponse | AsyncJobAccepted)
async def probe(
    background_tasks: BackgroundTasks,
    file: UploadFile | None = File(default=None),
    source_url: str | None = Form(default=None),
    sample_id: str | None = Form(default=None),
    async_mode: bool = Form(default=False),
    webhook_url: str | None = Form(default=None),
):
    job = job_store.create("probe")
    job_dir = create_job_dir(job.id)
    staged_path = await stage_input(job_dir=job_dir, upload=file, source_url=source_url, sample_id=sample_id)

    def runner():
        return probe_audio(staged_path)

    if async_mode:
        background_tasks.add_task(_run_async_job, job_id=job.id, webhook_url=webhook_url, runner=runner)
        return AsyncJobAccepted(job_id=job.id, status="queued")
    result = runner()
    job_store.complete(job.id, result)
    return result


@app.post("/v1/extract", response_model=ExtractResponse | AsyncJobAccepted)
async def extract(
    background_tasks: BackgroundTasks,
    file: UploadFile | None = File(default=None),
    source_url: str | None = Form(default=None),
    sample_id: str | None = Form(default=None),
    output_format: str = Form(default="wav"),
    sample_rate: int | None = Form(default=None),
    channels: int | None = Form(default=None),
    bit_depth: int | None = Form(default=None),
    downmix: str = Form(default="keep"),
    async_mode: bool = Form(default=False),
    webhook_url: str | None = Form(default=None),
):
    job = job_store.create("extract")
    job_dir = create_job_dir(job.id)
    staged_path = await stage_input(job_dir=job_dir, upload=file, source_url=source_url, sample_id=sample_id)

    def runner():
        result = extract_audio(
            input_path=staged_path,
            output_format=output_format,
            sample_rate=sample_rate,
            channels=channels,
            bit_depth=bit_depth,
            downmix=downmix,
            output_dir=job_dir,
        )
        return {
            **{key: value for key, value in result.items() if key != "output_path"},
            "artifact_url": artifact_url(job.id, Path(result["output_path"]).name),
        }

    if async_mode:
        background_tasks.add_task(_run_async_job, job_id=job.id, webhook_url=webhook_url, runner=runner)
        return AsyncJobAccepted(job_id=job.id, status="queued")
    result = runner()
    job_store.complete(job.id, result)
    return result


@app.post("/v1/loudnorm", response_model=LoudnormResponse | AsyncJobAccepted)
async def loudnorm(
    background_tasks: BackgroundTasks,
    file: UploadFile | None = File(default=None),
    source_url: str | None = Form(default=None),
    sample_id: str | None = Form(default=None),
    preset: str = Form(default="spotify"),
    mode: str = Form(default="two-pass"),
    target_i: float | None = Form(default=None),
    target_lra: float | None = Form(default=None),
    target_tp: float | None = Form(default=None),
    async_mode: bool = Form(default=False),
    webhook_url: str | None = Form(default=None),
):
    job = job_store.create("loudnorm")
    job_dir = create_job_dir(job.id)
    staged_path = await stage_input(job_dir=job_dir, upload=file, source_url=source_url, sample_id=sample_id)

    def runner():
        result = loudnorm_audio(
            input_path=staged_path,
            output_dir=job_dir,
            preset=preset,
            mode=mode,
            target_i=target_i,
            target_lra=target_lra,
            target_tp=target_tp,
        )
        return {
            **{key: value for key, value in result.items() if key != "output_path"},
            "artifact_url": artifact_url(job.id, Path(result["output_path"]).name),
        }

    if async_mode:
        background_tasks.add_task(_run_async_job, job_id=job.id, webhook_url=webhook_url, runner=runner)
        return AsyncJobAccepted(job_id=job.id, status="queued")
    result = runner()
    job_store.complete(job.id, result)
    return result


@app.post("/v1/peaks", response_model=PeaksResponse | AsyncJobAccepted)
async def peaks(
    background_tasks: BackgroundTasks,
    file: UploadFile | None = File(default=None),
    source_url: str | None = Form(default=None),
    sample_id: str | None = Form(default=None),
    async_mode: bool = Form(default=False),
    webhook_url: str | None = Form(default=None),
):
    job = job_store.create("peaks")
    job_dir = create_job_dir(job.id)
    staged_path = await stage_input(job_dir=job_dir, upload=file, source_url=source_url, sample_id=sample_id)

    def runner():
        result = generate_peaks(input_path=staged_path, output_dir=job_dir)
        return {
            "duration_sec": result["duration_sec"],
            "levels": result["levels"],
            "json_artifact_url": artifact_url(job.id, Path(result["peaks_path"]).name),
            "waveform_png_url": artifact_url(job.id, Path(result["waveform_path"]).name),
        }

    if async_mode:
        background_tasks.add_task(_run_async_job, job_id=job.id, webhook_url=webhook_url, runner=runner)
        return AsyncJobAccepted(job_id=job.id, status="queued")
    result = runner()
    job_store.complete(job.id, result)
    return result


@app.post("/v1/fingerprint", response_model=FingerprintResponse | FingerprintCompareResponse | AsyncJobAccepted)
async def fingerprint(
    background_tasks: BackgroundTasks,
    file: UploadFile | None = File(default=None),
    file_b: UploadFile | None = File(default=None),
    source_url: str | None = Form(default=None),
    source_url_b: str | None = Form(default=None),
    sample_id: str | None = Form(default=None),
    sample_id_b: str | None = Form(default=None),
    compare_mode: bool = Form(default=False),
    async_mode: bool = Form(default=False),
    webhook_url: str | None = Form(default=None),
):
    job = job_store.create("fingerprint")
    job_dir = create_job_dir(job.id)
    left_path = await stage_input(job_dir=job_dir / "a", upload=file, source_url=source_url, sample_id=sample_id)
    if compare_mode:
        right_path = await stage_input(
            job_dir=job_dir / "b",
            upload=file_b,
            source_url=source_url_b,
            sample_id=sample_id_b,
        )
    else:
        right_path = None

    def runner():
        if compare_mode and right_path is not None:
            return compare_fingerprints(left_path=left_path, right_path=right_path)
        return fingerprint_audio(input_path=left_path)

    if async_mode:
        background_tasks.add_task(_run_async_job, job_id=job.id, webhook_url=webhook_url, runner=runner)
        return AsyncJobAccepted(job_id=job.id, status="queued")
    result = runner()
    job_store.complete(job.id, result)
    return result


@app.post("/v1/silence", response_model=SilenceResponse | AsyncJobAccepted)
async def silence(
    background_tasks: BackgroundTasks,
    file: UploadFile | None = File(default=None),
    source_url: str | None = Form(default=None),
    sample_id: str | None = Form(default=None),
    threshold_db: float = Form(default=-40.0),
    min_duration_sec: float = Form(default=0.5),
    trim: bool = Form(default=True),
    async_mode: bool = Form(default=False),
    webhook_url: str | None = Form(default=None),
):
    job = job_store.create("silence")
    job_dir = create_job_dir(job.id)
    staged_path = await stage_input(job_dir=job_dir, upload=file, source_url=source_url, sample_id=sample_id)

    def runner():
        result = detect_silence(
            input_path=staged_path,
            output_dir=job_dir,
            threshold_db=threshold_db,
            min_duration_sec=min_duration_sec,
            trim=trim,
        )
        response = {
            "threshold_db": result["threshold_db"],
            "min_duration_sec": result["min_duration_sec"],
            "ranges": result["ranges"],
            "ranges_artifact_url": artifact_url(job.id, Path(result["ranges_path"]).name),
            "trimmed_artifact_url": (
                artifact_url(job.id, Path(result["trimmed_path"]).name)
                if result["trimmed_path"]
                else None
            ),
        }
        return response

    if async_mode:
        background_tasks.add_task(_run_async_job, job_id=job.id, webhook_url=webhook_url, runner=runner)
        return AsyncJobAccepted(job_id=job.id, status="queued")
    result = runner()
    job_store.complete(job.id, result)
    return result


@app.exception_handler(CommandError)
async def command_error_handler(_, exc: CommandError):
    return JSONResponse(status_code=500, content={"detail": str(exc)})
