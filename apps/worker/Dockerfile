FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    AUDIO_SUITE_JOB_ROOT=/tmp/audio-suite \
    AUDIO_SUITE_ARTIFACT_TTL_SECONDS=3600

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg chromaprint-tools curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY apps/worker/requirements.txt /tmp/requirements.txt
RUN pip install --upgrade pip && pip install -r /tmp/requirements.txt

COPY apps/worker /app
COPY samples /app/samples

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
