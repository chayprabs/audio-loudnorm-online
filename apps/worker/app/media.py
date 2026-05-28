from __future__ import annotations

import json
import math
import re
import struct
import subprocess
from pathlib import Path
from typing import Any, Iterable

from PIL import Image, ImageDraw


class CommandError(RuntimeError):
    pass


def run_command(args: list[str], cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
    process = subprocess.run(
        args,
        cwd=cwd,
        text=True,
        capture_output=True,
        check=False,
    )
    if process.returncode != 0:
        raise CommandError(process.stderr.strip() or process.stdout.strip() or "Command failed")
    return process


def ffprobe_json(input_path: Path) -> dict[str, Any]:
    completed = run_command(
        [
            "ffprobe",
            "-v",
            "error",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
            str(input_path),
        ]
    )
    return json.loads(completed.stdout)


def extract_last_json_block(raw_text: str) -> dict[str, Any]:
    matches = re.findall(r"\{[\s\S]*?\}", raw_text)
    for candidate in reversed(matches):
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            continue
    raise ValueError("No JSON block found")


def loudnorm_measure(input_path: Path, target_i: float, target_lra: float, target_tp: float) -> dict[str, Any]:
    completed = run_command(
        [
            "ffmpeg",
            "-hide_banner",
            "-i",
            str(input_path),
            "-af",
            f"loudnorm=I={target_i}:LRA={target_lra}:TP={target_tp}:print_format=json",
            "-f",
            "null",
            "-",
        ]
    )
    return extract_last_json_block(completed.stderr)


def parse_loudnorm_stats(payload: dict[str, Any], prefix: str) -> dict[str, float]:
    return {
        "I": float(payload[f"{prefix}_i"]),
        "LRA": float(payload[f"{prefix}_lra"]),
        "TP": float(payload[f"{prefix}_tp"]),
    }


def render_waveform_png(levels: list[float], output_path: Path, width: int = 1200, height: int = 320) -> None:
    image = Image.new("RGB", (width, height), color="#08111f")
    draw = ImageDraw.Draw(image)
    center_y = height / 2
    line_color = "#5eead4"
    if not levels:
        image.save(output_path)
        return

    chunk_size = max(1, math.ceil(len(levels) / width))
    for x in range(width):
        chunk = levels[x * chunk_size : (x + 1) * chunk_size]
        if not chunk:
            continue
        magnitude = max(abs(sample) for sample in chunk)
        scaled = magnitude * (height * 0.45)
        draw.line((x, center_y - scaled, x, center_y + scaled), fill=line_color, width=1)
    image.save(output_path)


def pcm_f32le_to_samples(payload: bytes) -> list[float]:
    if not payload:
        return []
    count = len(payload) // 4
    return list(struct.unpack(f"<{count}f", payload[: count * 4]))


def downsample_levels(samples: list[float], zoom_sizes: Iterable[int]) -> list[dict[str, Any]]:
    levels: list[dict[str, Any]] = []
    for zoom in zoom_sizes:
        bucket = max(1, math.ceil(len(samples) / zoom))
        downsampled = []
        for index in range(0, len(samples), bucket):
            window = samples[index : index + bucket]
            if not window:
                continue
            downsampled.append(round(max(abs(item) for item in window), 6))
        levels.append({"zoom": zoom, "samples": downsampled})
    return levels


def fpcalc_json(input_path: Path, *, raw: bool = False) -> dict[str, Any]:
    args = ["fpcalc"]
    if raw:
        args.append("-raw")
    args.extend(["-json", str(input_path)])
    completed = run_command(args)
    return json.loads(completed.stdout)


def decode_fingerprint(fingerprint: str | list[int]) -> list[int]:
    if isinstance(fingerprint, list):
        return [int(part) for part in fingerprint]
    return [int(part) for part in fingerprint.split(",") if part]


def cosine_like_similarity(left: list[int], right: list[int]) -> float:
    size = min(len(left), len(right))
    if size == 0:
        return 0.0
    left_slice = left[:size]
    right_slice = right[:size]
    numerator = sum(a * b for a, b in zip(left_slice, right_slice))
    left_norm = math.sqrt(sum(a * a for a in left_slice))
    right_norm = math.sqrt(sum(b * b for b in right_slice))
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return round(numerator / (left_norm * right_norm), 6)


def parse_silencedetect_ranges(stderr: str) -> list[dict[str, float]]:
    ranges: list[dict[str, float]] = []
    starts: list[float] = []
    for line in stderr.splitlines():
        start_match = re.search(r"silence_start:\s*([0-9.]+)", line)
        end_match = re.search(r"silence_end:\s*([0-9.]+)", line)
        if start_match:
            starts.append(float(start_match.group(1)))
        elif end_match and starts:
            ranges.append(
                {
                    "start_sec": starts.pop(0),
                    "end_sec": float(end_match.group(1)),
                }
            )
    return ranges
