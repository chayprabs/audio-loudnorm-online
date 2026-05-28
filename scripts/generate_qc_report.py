from __future__ import annotations

import json
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = REPO_ROOT / "qc"
REPORT_PATH = OUTPUT_DIR / "appendix-b.md"


def run(command: list[str], cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=cwd, text=True, capture_output=True, check=True)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    ffmpeg_available = shutil.which("ffmpeg") is not None
    fpcalc_available = shutil.which("fpcalc") is not None

    lines = [
        "# AudioSuite QC Appendix B",
        "",
        f"- Generated: {datetime.now(timezone.utc).isoformat()}",
        f"- Repo: `{REPO_ROOT.name}`",
        f"- FFmpeg available: `{ffmpeg_available}`",
        f"- fpcalc available: `{fpcalc_available}`",
        "",
        "## Commands",
        "",
        "- `pytest apps/worker/tests/test_acceptance_runtime.py -q`",
        "- `pnpm typecheck`",
        "- `pnpm test`",
        "",
    ]

    if ffmpeg_available and fpcalc_available:
        acceptance = run(["pytest", "apps/worker/tests/test_acceptance_runtime.py", "-q"], cwd=REPO_ROOT)
        lines.extend(
            [
                "## Acceptance Runtime",
                "",
                "```text",
                acceptance.stdout.strip(),
                "```",
                "",
            ]
        )
    else:
        lines.extend(
            [
                "## Acceptance Runtime",
                "",
                "Native tools were not available on PATH, so runtime acceptance verification was skipped.",
                "",
            ]
        )

    REPORT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(str(REPORT_PATH))


if __name__ == "__main__":
    main()
