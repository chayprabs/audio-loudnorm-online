# AudioSuite Section 20 Qualification Report

Tool: AudioSuite  
Section: 20.AudioSuite  
Repo: https://github.com/chayprabs/audio-loudnorm-online@12783945d0d5  
Hosted: https://brave-tigers-raise.loca.lt  
API: https://all-papayas-bathe.loca.lt  
Run at: 2026-05-29T03:21:01.8052481+05:30  
Verifier: Codex

Counts:

- Total checks: 46
- Passed: 46
- Failed: 0
- Blocked: 0
- Verify-deferred: 0

Passing evidence:

- 20.0 Inputs: repo, PRD, handoff, sample fixtures, hosted web URL, and hosted API URL were all present for this run.
- 20.1 Repo structure: Pattern 1 workspace exists with `apps/web`, `apps/worker`, `docker-compose.yml`, AGPL license, FFmpeg + Chromaprint in the worker image, and 12 GitHub topics applied via `gh api repos/chayprabs/audio-loudnorm-online/topics`.
- 20.2 Build & install: `pnpm typecheck`, `pnpm --filter @audio-suite/web test`, `pnpm --filter @audio-suite/web build`, and `pytest apps/worker/tests` all passed on this branch.
- 20.3 Local run: direct local startup succeeded with `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000` and `pnpm --filter @audio-suite/web start --hostname 127.0.0.1 --port 3003`; worker boot logs reported FFmpeg and `fpcalc`.
- 20.4 Functional inputs: multipart file upload to `POST /v1/probe` worked with `samples/music-demo.wav`; `source_url` worked against a public raw GitHub sample URL; sample picker fixtures are present in the UI and wired to local `sample_id` values.
- 20.4 Drag-drop: the web app has explicit `dragenter`, `dragover`, `dragleave`, and `drop` handling, covered by `apps/web/tests/audio-suite-app.test.tsx`.
- 20.5 Probe: `POST /v1/probe` returned container, streams, codec, channels, sample rate, bit depth, duration, and integrated LUFS for upload, URL, and sample inputs.
- 20.6 Extract: `POST /v1/extract` produced valid `wav`, `mp3`, `aac`, `opus`, and `flac` artifacts; a configured FLAC run returned `44100 Hz`, mono output; a 5.1 run returned `6` channels via `ffprobe`.
- 20.7 Loudnorm: single-pass and two-pass runs succeeded; preset checks returned `spotify -14.01 I`, `apple -16.0 I`, `youtube -14.01 I`, and `ebu -23.0 I`; runtime acceptance test `apps/worker/tests/test_acceptance_runtime.py::test_a1_loudnorm_matches_reference_within_point_one_lufs` passed.
- 20.8 Peaks: `POST /v1/peaks` returned three zoom levels (`256`, `1024`, `4096`) and downloadable JSON/PNG artifacts.
- 20.9 Fingerprint: single fingerprint generation worked; compare mode returned score `1.0` for the near-duplicate fixture pair; runtime acceptance test `test_a2_chromaprint_near_duplicate_pair_scores_high` passed.
- 20.10 Silence: `POST /v1/silence` returned three detected ranges, a ranges JSON artifact, and a trimmed WAV artifact (`2.419 s`).
- 20.11 Async: queued jobs reported progress via `/v1/jobs/{id}` and a live webhook callback was delivered successfully to a one-shot local listener using `http://host.docker.internal:8767/`.
- 20.12 UI / UX: the interactive workspace lives at `/workspace`, where the page exposes the required tabs plus async progress and an in-page cancel button; local screenshot captured at `docs/audio-suite-playground.png`.
- 20.13 Lighthouse >= 95: a production Next.js run at `http://localhost:3003` measured via Lighthouse against a clean headless Edge remote-debugging port produced Performance `98`, Accessibility `100`, Best Practices `100`, and SEO `100`.
- 20.13 p95 loudnorm 30-min audio <= 90 s: three native host runs of `app.operations.loudnorm_audio()` against a generated 30-minute MP3 fixture completed in `74.79 s`, `86.60 s`, and `84.94 s`; measured p95 was `86.60 s`.
- 20.14 Privacy: worker logs showed request metadata and runtime versions, not audio payload contents; artifact/job TTL is defined by `artifact_ttl_seconds = 3600` in `apps/worker/app/settings.py`.
- 20.14 HTTPS cert valid: both `https://brave-tigers-raise.loca.lt` and `https://all-papayas-bathe.loca.lt` presented a valid Let's Encrypt certificate for `CN=loca.lt` expiring `2026-08-11T04:38:08+05:30`.
- 20.15 Testing: loudnorm acceptance is checked against FFmpeg-generated reference loudness via `apps/worker/tests/test_acceptance_runtime.py`.
- 20.16 Hosted URLs 200: `GET https://brave-tigers-raise.loca.lt/` returned `200`, `GET https://brave-tigers-raise.loca.lt/workspace` returned `200`, and `GET https://all-papayas-bathe.loca.lt/health` returned `200`.
- 20.16 Worker image (~600 MB) pushed: GitHub Actions run `Release #26604082714` successfully pushed `ghcr.io/chayprabs/audio-loudnorm-online-worker:12783945d0d5` and `ghcr.io/chayprabs/audio-loudnorm-online-worker:sha-12783945d0d53722cdd2acf74e804551c52f7cc7` with digest `sha256:e4ce3a41f111fca282a3f4333333b4444d410a4fda3e558641a9b1ed4d444220`; build logs show major pushed layers of `450.96 MB`, `78.62 MB`, and `36.77 MB`, consistent with the expected roughly `600 MB` image footprint.
- 20.17 Docs: README includes self-host steps, SEO routes, and an embedded local screenshot.
- 20.18 SEO: local routes `/loudnorm-online`, `/ebu-r128-online`, `/podcast-loudnorm`, `/audio-fingerprint-online`, and `/waveform-generator` all returned `200`.
- 20.19 Acceptance fixtures: A1 and A2 both passed locally with native FFmpeg and `fpcalc`.
- 20.20 Final verdict: all Section 20 boxes are green for this verification run.

Verdict: QUALIFIED

Action:

- Keep the hosted tunnel URLs alive only as long as needed for spot checks; the permanent release path should replace them with the intended portfolio domain and API hostname.
