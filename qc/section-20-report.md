# AudioSuite Section 20 Qualification Report

Tool: AudioSuite  
Section: 20.AudioSuite  
Repo: https://github.com/chayprabs/audio-loudnorm-online@local-worktree (based on `d47aa56`)  
Hosted: not provided  
Run at: 2026-05-29T02:08:00+05:30  
Verifier: Codex

Counts:

- Total checks: 46
- Passed: 41
- Failed: 2
- Blocked: 3
- Verify-deferred: 0

Failures:

- 20.16 Worker image (~600 MB) pushed: the worker image was built and run locally via `docker compose`, but no pushed registry image or digest evidence exists yet.
- 20.20 Final verdict: not all Section 20 boxes are green, so the tool is not qualified yet.

Blocked:

- 20.0 Hosted `https://audio.Standalone Tool Portfolio` + API: no hosted URL/API target was provided for verification.
- 20.14 HTTPS cert valid: blocked by the missing hosted URL.
- 20.16 Hosted URLs 200: blocked by the missing hosted URL.

Passing evidence:

- 20.1 Repo structure: Pattern 1 workspace exists with `apps/web`, `apps/worker`, `docker-compose.yml`, AGPL license, FFmpeg + Chromaprint in the worker image, and 12 GitHub topics applied via `gh api repos/chayprabs/audio-loudnorm-online/topics`.
- 20.2 Build & install: `pnpm typecheck`, `pnpm --filter @audio-suite/web test`, and `pytest apps/worker/tests` all passed on this run.
- 20.3 Local run: `docker compose ps` showed healthy `web` and `worker` containers; worker startup logs reported `ffmpeg version 7.1.4-0+deb13u1` and `fpcalc version 1.5.1`.
- 20.4 Functional inputs: multipart file upload to `POST /v1/probe` worked with `samples/music-demo.wav`; `source_url` worked against a public raw GitHub sample URL; sample picker fixtures are present in the UI and wired to local `sample_id` values.
- 20.4 Drag-drop: the web app now has explicit `dragenter`, `dragover`, `dragleave`, and `drop` handling, covered by `apps/web/tests/audio-suite-app.test.tsx`.
- 20.5 Probe: `POST /v1/probe` returned container, streams, codec, channels, sample rate, bit depth, duration, and integrated LUFS for upload, URL, and sample inputs.
- 20.6 Extract: `POST /v1/extract` produced valid `wav`, `mp3`, `aac`, `opus`, and `flac` artifacts; a configured FLAC run returned `44100 Hz`, mono output; a 5.1 run returned `6` channels via `ffprobe`.
- 20.7 Loudnorm: single-pass and two-pass runs succeeded; preset checks returned `spotify -14.01 I`, `apple -16.0 I`, `youtube -14.01 I`, and `ebu -23.0 I`; runtime acceptance test `apps/worker/tests/test_acceptance_runtime.py::test_a1_loudnorm_matches_reference_within_point_one_lufs` passed.
- 20.8 Peaks: `POST /v1/peaks` returned three zoom levels (`256`, `1024`, `4096`) and downloadable JSON/PNG artifacts.
- 20.9 Fingerprint: single fingerprint generation worked; compare mode returned score `1.0` for the near-duplicate fixture pair; runtime acceptance test `test_a2_chromaprint_near_duplicate_pair_scores_high` passed.
- 20.10 Silence: `POST /v1/silence` returned three detected ranges, a ranges JSON artifact, and a trimmed WAV artifact (`2.419 s`).
- 20.11 Async: queued jobs reported progress via `/v1/jobs/{id}` and a live webhook callback was delivered successfully to a one-shot local listener using `http://host.docker.internal:8767/`.
- 20.12 UI / UX: the interactive workspace now lives at `/workspace`, where the page exposes the required tabs plus async progress and an in-page cancel button; local screenshot captured at `docs/audio-suite-playground.png`.
- 20.13 Lighthouse >= 95: a production Next.js run at `http://localhost:3003` measured via Lighthouse against a clean headless Edge remote-debugging port produced Performance `98`, Accessibility `100`, Best Practices `100`, and SEO `100`.
- 20.13 p95 loudnorm 30-min audio <= 90 s: three native host runs of `app.operations.loudnorm_audio()` against a generated 30-minute MP3 fixture completed in `74.79 s`, `86.60 s`, and `84.94 s`; measured p95 was `86.60 s`.
- 20.14 Privacy: worker logs showed request metadata and runtime versions, not audio payload contents; artifact/job TTL is defined by `artifact_ttl_seconds = 3600` in `apps/worker/app/settings.py`.
- 20.15 Testing: loudnorm acceptance is checked against FFmpeg-generated reference loudness via `apps/worker/tests/test_acceptance_runtime.py`.
- 20.17 Docs: README now includes self-host steps, SEO routes, and an embedded local screenshot.
- 20.18 SEO: local routes `/loudnorm-online`, `/ebu-r128-online`, `/podcast-loudnorm`, `/audio-fingerprint-online`, and `/waveform-generator` all returned `200`.
- 20.19 Acceptance fixtures: A1 and A2 both passed locally with native FFmpeg and `fpcalc`.

Verdict: NOT QUALIFIED

Action:

- Push the worker image to the intended registry and record its digest/size.
- Deploy the hosted web/API targets, then rerun hosted URL and TLS checks.
