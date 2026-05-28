import json
import shutil
import subprocess
from pathlib import Path

import pytest

from app.media import extract_last_json_block
from app.operations import compare_fingerprints, loudnorm_audio


REPO_ROOT = Path(__file__).resolve().parents[3]
SAMPLES_DIR = REPO_ROOT / "samples"


def _require_binary(name: str) -> None:
    if shutil.which(name) is None:
        pytest.skip(f"{name} is not available on PATH")


def _measure_integrated_lufs(path: Path, target_i: float = -16.0, target_lra: float = 11.0, target_tp: float = -1.0) -> float:
    completed = subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-i",
            str(path),
            "-af",
            f"loudnorm=I={target_i}:LRA={target_lra}:TP={target_tp}:print_format=json",
            "-f",
            "null",
            "-",
        ],
        text=True,
        capture_output=True,
        check=False,
    )
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr or completed.stdout)
    payload = extract_last_json_block(completed.stderr)
    return float(payload["input_i"])


def test_a1_loudnorm_matches_reference_within_point_one_lufs(tmp_path: Path):
    _require_binary("ffmpeg")

    fixture = SAMPLES_DIR / "podcast-demo.wav"
    result = loudnorm_audio(
        input_path=fixture,
        output_dir=tmp_path,
        preset="apple",
        mode="two-pass",
        target_i=None,
        target_lra=None,
        target_tp=None,
    )

    output_path = Path(result["output_path"])
    assert output_path.exists()

    reference_lufs = _measure_integrated_lufs(output_path)
    worker_lufs = float(result["after"]["I"])
    assert abs(reference_lufs - worker_lufs) <= 0.1


def test_a2_chromaprint_near_duplicate_pair_scores_high():
    _require_binary("fpcalc")

    comparison = compare_fingerprints(
        left_path=SAMPLES_DIR / "near-duplicate-a.wav",
        right_path=SAMPLES_DIR / "near-duplicate-b.wav",
    )

    assert comparison["score"] >= 0.95


def test_non_duplicate_fingerprint_score_is_lower():
    _require_binary("fpcalc")

    comparison = compare_fingerprints(
        left_path=SAMPLES_DIR / "near-duplicate-a.wav",
        right_path=SAMPLES_DIR / "music-demo.wav",
    )

    assert comparison["score"] < 0.95
