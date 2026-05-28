from typing import Any, Literal

from pydantic import BaseModel, Field, HttpUrl


LoudnormPreset = Literal["spotify", "apple", "youtube", "ebu", "custom"]
LoudnormMode = Literal["single-pass", "two-pass"]
OutputFormat = Literal["wav", "mp3", "aac", "opus", "flac"]
DownmixMode = Literal["mono", "stereo", "5.1", "keep"]


class AsyncJobAccepted(BaseModel):
    job_id: str
    status: str


class JobStatusResponse(BaseModel):
    id: str
    feature: str
    status: str
    progress: int
    result: dict[str, Any] | None = None
    error: str | None = None
    expires_at: str


class ProbeStream(BaseModel):
    index: int
    codec_type: str
    codec_name: str | None = None
    channels: int | None = None
    sample_rate: int | None = None
    bit_depth: int | None = None


class ProbeResponse(BaseModel):
    container: str
    streams: list[ProbeStream]
    codec: str
    channels: int
    sample_rate: int
    bit_depth: int | None = None
    duration_sec: float
    integrated_lufs: float | None = None


class ExtractResponse(BaseModel):
    format: OutputFormat
    sample_rate: int | None = None
    channels: int | None = None
    bit_depth: int | None = None
    downmix: DownmixMode
    artifact_url: str


class LoudnormStats(BaseModel):
    I: float
    LRA: float
    TP: float


class LoudnormResponse(BaseModel):
    mode: LoudnormMode
    preset: LoudnormPreset
    before: LoudnormStats
    after: LoudnormStats
    target: LoudnormStats
    artifact_url: str
    ffmpeg_args: list[str]


class PeakLevel(BaseModel):
    zoom: int
    samples: list[float]


class PeaksResponse(BaseModel):
    duration_sec: float
    levels: list[PeakLevel]
    json_artifact_url: str
    waveform_png_url: str


class FingerprintResponse(BaseModel):
    algorithm: Literal["chromaprint"]
    duration_sec: float
    fingerprint: str


class FingerprintCompareResponse(BaseModel):
    algorithm: Literal["chromaprint"]
    score: float
    left_duration_sec: float
    right_duration_sec: float


class SilenceRange(BaseModel):
    start_sec: float
    end_sec: float


class SilenceResponse(BaseModel):
    threshold_db: float
    min_duration_sec: float
    ranges: list[SilenceRange]
    ranges_artifact_url: str
    trimmed_artifact_url: str | None = None


class WebhookPayload(BaseModel):
    url: HttpUrl
    headers: dict[str, str] = Field(default_factory=dict)
