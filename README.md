# AudioSuite

AudioSuite is an open-source audio toolkit that extracts audio, runs EBU
R128 loudness normalisation, generates waveform peaks, computes
Chromaprint fingerprints, and detects silence for podcast and video
production workflows.

## Status

Initial repository scaffold and core worker/web implementation are in
progress on `cursor/audio-suite-build`.

## Stack

- Next.js 15 playground in `apps/web`
- FastAPI worker in `apps/worker`
- Shared TypeScript contracts in `packages/shared-types`
- Docker Compose for local self-hosting

## Local development

```bash
pnpm install
pnpm dev
```

Worker development:

```bash
cd apps/worker
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## License

AGPL-3.0-only
