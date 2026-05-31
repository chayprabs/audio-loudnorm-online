from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="AUDIO_SUITE_",
        env_file=".env",
        extra="ignore",
    )

    job_root: Path = Path("/tmp/audio-suite")
    artifact_ttl_seconds: int = 3600
    max_download_bytes: int = 512 * 1024 * 1024
    cors_origin_regex: str = (
        r"https?://(localhost|127\.0\.0\.1)(:\d+)?|https?://[a-z0-9.-]+(:\d+)?"
    )
    cleanup_interval_seconds: int = 60


settings = Settings()
