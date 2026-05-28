from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import httpx
from fastapi import HTTPException, UploadFile

from .media import (
    FFMPEG_PARALLEL_ARGS,
    cosine_like_similarity,
    decode_fingerprint,
    downsample_levels,
    extract_last_json_block,
    ffprobe_json,
    fpcalc_json,
    loudnorm_measure,
    parse_loudnorm_stats,
    parse_silencedetect_ranges,
    pcm_f32le_to_samples,
    render_waveform_png,
    run_command,
)
from .sample_catalog import get_sample_path
from .settings import settings

PRESETS = {
    "spotify": {"I": -14.0, "LRA": 11.0, "TP": -1.5},
    "apple": {"I": -16.0, "LRA": 11.0, "TP": -1.0},
    "youtube": {"I": -14.0, "LRA": 11.0, "TP": -1.5},
    "ebu": {"I": -23.0, "LRA": 7.0, "TP": -1.0},
}

FORMAT_ARGS = {
    "wav": ["-c:a", "pcm_s24le"],
    "mp3": ["-c:a", "libmp3lame", "-q:a", "2"],
    "aac": ["-c:a", "aac", "-b:a", "192k"],
    "opus": ["-c:a", "libopus", "-b:a", "160k"],
    "flac": ["-c:a", "flac"],
}

EXTENSIONS = {
    "wav": ".wav",
    "mp3": ".mp3",
    "aac": ".m4a",
    "opus": ".opus",
    "flac": ".flac",
}

CHANNEL_MAP = {
    "mono": 1,
    "stereo": 2,
    "5.1": 6,
}

LOUDNORM_VERIFY_THRESHOLD_SEC = 5 * 60


def create_job_dir(job_id: str) -> Path:
    job_dir = settings.job_root / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    return job_dir


def artifact_url(job_id: str, file_name: str) -> str:
    return f"/artifacts/{job_id}/{file_name}"


def _safe_name(path_or_name: str) -> str:
    return Path(path_or_name).name or "input.bin"


async def stage_input(
    *,
    job_dir: Path,
    upload: UploadFile | None,
    source_url: str | None,
    sample_id: str | None,
) -> Path:
    job_dir.mkdir(parents=True, exist_ok=True)
    if not any([upload, source_url, sample_id]):
        raise HTTPException(status_code=400, detail="Provide a file, source_url, or sample_id.")

    if sample_id:
        sample_path = get_sample_path(sample_id)
        if sample_path is None or not sample_path.exists():
            raise HTTPException(status_code=404, detail="Sample not found.")
        target = job_dir / sample_path.name
        shutil.copy2(sample_path, target)
        return target

    if source_url:
        parsed = urlparse(source_url)
        file_name = _safe_name(parsed.path) or "downloaded-media"
        target = job_dir / file_name
        async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
            async with client.stream("GET", source_url) as response:
                response.raise_for_status()
                total = 0
                with target.open("wb") as handle:
                    async for chunk in response.aiter_bytes():
                        total += len(chunk)
                        if total > settings.max_download_bytes:
                            raise HTTPException(status_code=413, detail="Remote file is too large.")
                        handle.write(chunk)
        return target

    assert upload is not None
    target = job_dir / _safe_name(upload.filename or "upload.bin")
    with target.open("wb") as handle:
        while True:
            chunk = await upload.read(1024 * 1024)
            if not chunk:
                break
            handle.write(chunk)
    await upload.close()
    return target


def probe_audio(input_path: Path) -> dict[str, Any]:
    ffprobe = ffprobe_json(input_path)
    audio_streams = [item for item in ffprobe.get("streams", []) if item.get("codec_type") == "audio"]
    primary = audio_streams[0] if audio_streams else {}
    duration_sec = float(ffprobe.get("format", {}).get("duration", primary.get("duration", 0)) or 0)

    integrated_lufs = None
    try:
        loudnorm = loudnorm_measure(input_path, -16.0, 11.0, -1.5)
        integrated_lufs = float(loudnorm["input_i"])
    except Exception:
        integrated_lufs = None

    return {
        "container": ffprobe.get("format", {}).get("format_name", "unknown"),
        "streams": [
            {
                "index": item.get("index", 0),
                "codec_type": item.get("codec_type", "unknown"),
                "codec_name": item.get("codec_name"),
                "channels": item.get("channels"),
                "sample_rate": int(item["sample_rate"]) if item.get("sample_rate") else None,
                "bit_depth": item.get("bits_per_sample") or item.get("bits_per_raw_sample"),
            }
            for item in ffprobe.get("streams", [])
        ],
        "codec": primary.get("codec_name", "unknown"),
        "channels": primary.get("channels", 0),
        "sample_rate": int(primary["sample_rate"]) if primary.get("sample_rate") else 0,
        "bit_depth": primary.get("bits_per_sample") or primary.get("bits_per_raw_sample"),
        "duration_sec": duration_sec,
        "integrated_lufs": integrated_lufs,
    }


def extract_audio(
    *,
    input_path: Path,
    output_format: str,
    sample_rate: int | None,
    channels: int | None,
    bit_depth: int | None,
    downmix: str,
    output_dir: Path,
) -> dict[str, Any]:
    output_path = output_dir / f"extract{EXTENSIONS[output_format]}"
    args = ["ffmpeg", "-hide_banner", "-y", "-i", str(input_path)]
    if sample_rate:
        args += ["-ar", str(sample_rate)]
    if downmix != "keep":
        args += ["-ac", str(CHANNEL_MAP[downmix])]
    elif channels:
        args += ["-ac", str(channels)]
    if output_format == "wav" and bit_depth:
        pcm_codec = {16: "pcm_s16le", 24: "pcm_s24le", 32: "pcm_s32le"}.get(bit_depth, "pcm_s24le")
        args += ["-c:a", pcm_codec]
    else:
        args += FORMAT_ARGS[output_format]
    args.append(str(output_path))
    run_command(args)
    return {
        "format": output_format,
        "sample_rate": sample_rate,
        "channels": channels,
        "bit_depth": bit_depth,
        "downmix": downmix,
        "output_path": output_path,
    }


def loudnorm_audio(
    *,
    input_path: Path,
    output_dir: Path,
    preset: str,
    mode: str,
    target_i: float | None,
    target_lra: float | None,
    target_tp: float | None,
) -> dict[str, Any]:
    if preset == "custom":
        if target_i is None or target_lra is None or target_tp is None:
            raise HTTPException(status_code=400, detail="Custom loudnorm requires I, LRA, and TP targets.")
        target = {"I": target_i, "LRA": target_lra, "TP": target_tp}
    else:
        target = PRESETS[preset]

    first_pass = loudnorm_measure(input_path, target["I"], target["LRA"], target["TP"])
    input_duration_sec = float(ffprobe_json(input_path).get("format", {}).get("duration", 0) or 0)
    output_path = output_dir / "loudnorm.wav"
    if mode == "two-pass":
        filter_args = (
            "loudnorm="
            f"I={target['I']}:LRA={target['LRA']}:TP={target['TP']}:"
            f"measured_I={first_pass['input_i']}:"
            f"measured_LRA={first_pass['input_lra']}:"
            f"measured_TP={first_pass['input_tp']}:"
            f"measured_thresh={first_pass['input_thresh']}:"
            f"offset={first_pass['target_offset']}:linear=true:print_format=json"
        )
    else:
        filter_args = f"loudnorm=I={target['I']}:LRA={target['LRA']}:TP={target['TP']}:print_format=json"

    ffmpeg_args = [
        "ffmpeg",
        "-hide_banner",
        *FFMPEG_PARALLEL_ARGS,
        "-y",
        "-i",
        str(input_path),
        "-af",
        filter_args,
        str(output_path),
    ]
    second_pass = extract_last_json_block(run_command(ffmpeg_args).stderr)
    if input_duration_sec <= LOUDNORM_VERIFY_THRESHOLD_SEC:
        after = parse_loudnorm_stats(loudnorm_measure(output_path, target["I"], target["LRA"], target["TP"]), "input")
    else:
        after = parse_loudnorm_stats(second_pass, "output")
    return {
        "mode": mode,
        "preset": preset,
        "before": parse_loudnorm_stats(first_pass, "input"),
        "after": after,
        "target": target,
        "output_path": output_path,
        "ffmpeg_args": ffmpeg_args,
    }


def generate_peaks(*, input_path: Path, output_dir: Path) -> dict[str, Any]:
    raw_path = output_dir / "peaks.f32le"
    run_command(
        [
            "ffmpeg",
            "-hide_banner",
            "-y",
            "-i",
            str(input_path),
            "-ac",
            "1",
            "-ar",
            "16000",
            "-f",
            "f32le",
            str(raw_path),
        ]
    )
    samples = pcm_f32le_to_samples(raw_path.read_bytes())
    levels = downsample_levels(samples, zoom_sizes=[256, 1024, 4096])
    peaks_path = output_dir / "peaks.json"
    peaks_path.write_text(json.dumps({"duration_sec": len(samples) / 16000, "levels": levels}, indent=2))

    waveform_path = output_dir / "waveform.png"
    preview_samples = levels[0]["samples"] if levels else []
    render_waveform_png(preview_samples, waveform_path)
    return {
        "duration_sec": len(samples) / 16000,
        "levels": levels,
        "peaks_path": peaks_path,
        "waveform_path": waveform_path,
    }


def fingerprint_audio(*, input_path: Path) -> dict[str, Any]:
    fingerprint = fpcalc_json(input_path)
    return {
        "algorithm": "chromaprint",
        "duration_sec": float(fingerprint.get("duration", 0)),
        "fingerprint": str(fingerprint.get("fingerprint", "")),
    }


def compare_fingerprints(*, left_path: Path, right_path: Path) -> dict[str, Any]:
    left = fpcalc_json(left_path, raw=True)
    right = fpcalc_json(right_path, raw=True)
    score = cosine_like_similarity(
        decode_fingerprint(left["fingerprint"]),
        decode_fingerprint(right["fingerprint"]),
    )
    return {
        "algorithm": "chromaprint",
        "score": score,
        "left_duration_sec": float(left.get("duration", 0)),
        "right_duration_sec": float(right.get("duration", 0)),
    }


def detect_silence(
    *,
    input_path: Path,
    output_dir: Path,
    threshold_db: float,
    min_duration_sec: float,
    trim: bool,
) -> dict[str, Any]:
    detect = run_command(
        [
            "ffmpeg",
            "-hide_banner",
            "-i",
            str(input_path),
            "-af",
            f"silencedetect=noise={threshold_db}dB:d={min_duration_sec}",
            "-f",
            "null",
            "-",
        ]
    )
    ranges = parse_silencedetect_ranges(detect.stderr)
    ranges_path = output_dir / "silence-ranges.json"
    ranges_path.write_text(json.dumps({"ranges": ranges}, indent=2))

    trimmed_path = None
    if trim:
        trimmed_path = output_dir / "trimmed.wav"
        run_command(
            [
                "ffmpeg",
                "-hide_banner",
                "-y",
                "-i",
                str(input_path),
                "-af",
                f"silenceremove=start_periods=1:start_silence=0:start_threshold={threshold_db}dB:"
                f"stop_periods=1:stop_silence=0:stop_threshold={threshold_db}dB",
                str(trimmed_path),
            ]
        )

    return {
        "threshold_db": threshold_db,
        "min_duration_sec": min_duration_sec,
        "ranges": ranges,
        "ranges_path": ranges_path,
        "trimmed_path": trimmed_path,
    }
