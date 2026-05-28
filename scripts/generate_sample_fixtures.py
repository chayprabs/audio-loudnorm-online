from __future__ import annotations

import math
import struct
import wave
from pathlib import Path


SAMPLE_RATE = 48_000
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "samples"


def clamp(value: float) -> float:
    return max(-1.0, min(1.0, value))


def write_wav(path: Path, channels: int, samples: list[tuple[float, ...]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(channels)
        handle.setsampwidth(2)
        handle.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for frame in samples:
            frames.extend(struct.pack("<" + "h" * channels, *[int(clamp(value) * 32767) for value in frame]))
        handle.writeframes(frames)


def silence(seconds: float, channels: int = 1) -> list[tuple[float, ...]]:
    frame_count = int(SAMPLE_RATE * seconds)
    return [tuple(0.0 for _ in range(channels)) for _ in range(frame_count)]


def tone(
    *,
    seconds: float,
    frequency: float,
    channels: int = 1,
    amplitude: float = 0.3,
    phase_offset: float = 0.0,
) -> list[tuple[float, ...]]:
    frame_count = int(SAMPLE_RATE * seconds)
    output: list[tuple[float, ...]] = []
    for index in range(frame_count):
        t = index / SAMPLE_RATE
        envelope = 0.65 + 0.35 * math.sin(2 * math.pi * 1.6 * t + phase_offset)
        base = amplitude * envelope * math.sin(2 * math.pi * frequency * t + phase_offset)
        if channels == 1:
            output.append((base,))
        else:
            right = amplitude * 0.85 * envelope * math.sin(2 * math.pi * (frequency * 1.5) * t + phase_offset / 2)
            output.append((base, right))
    return output


def speech_like(seconds: float, base_frequency: float, amplitude: float = 0.24) -> list[tuple[float]]:
    frame_count = int(SAMPLE_RATE * seconds)
    output: list[tuple[float]] = []
    for index in range(frame_count):
        t = index / SAMPLE_RATE
        cadence = 0.5 * (1 + math.sin(2 * math.pi * 3.7 * t))
        formant = math.sin(2 * math.pi * base_frequency * t)
        overtone = 0.5 * math.sin(2 * math.pi * base_frequency * 2.4 * t)
        breath = 0.08 * math.sin(2 * math.pi * 27 * t)
        sample = amplitude * cadence * (formant + overtone) + breath
        output.append((sample,))
    return output


def with_gain(samples: list[tuple[float]], gain: float) -> list[tuple[float]]:
    return [tuple(clamp(channel * gain) for channel in frame) for frame in samples]


def with_subtle_offset(samples: list[tuple[float]], noise_frequency: float) -> list[tuple[float]]:
    adjusted: list[tuple[float]] = []
    for index, frame in enumerate(samples):
        t = index / SAMPLE_RATE
        wobble = 0.012 * math.sin(2 * math.pi * noise_frequency * t)
        adjusted.append(tuple(clamp(channel + wobble) for channel in frame))
    return adjusted


def build_podcast() -> list[tuple[float]]:
    return (
        speech_like(3.6, 170)
        + silence(0.25)
        + speech_like(3.2, 190, amplitude=0.22)
        + silence(0.25)
        + speech_like(2.8, 210, amplitude=0.21)
    )


def build_music() -> list[tuple[float, float]]:
    return tone(seconds=10.0, frequency=220, channels=2, amplitude=0.32, phase_offset=0.15)


def build_voiceover_with_silence() -> list[tuple[float]]:
    return silence(1.2) + speech_like(2.4, 160, amplitude=0.22) + silence(0.9) + speech_like(2.0, 205, amplitude=0.2) + silence(1.1)


def main() -> None:
    podcast = build_podcast()
    music = build_music()
    voiceover = build_voiceover_with_silence()
    duplicate_base = speech_like(4.8, 185, amplitude=0.23)
    duplicate_variant = with_subtle_offset(with_gain(duplicate_base, 0.96), 31)

    write_wav(OUTPUT_DIR / "podcast-demo.wav", 1, podcast)
    write_wav(OUTPUT_DIR / "music-demo.wav", 2, music)
    write_wav(OUTPUT_DIR / "voiceover-with-silence.wav", 1, voiceover)
    write_wav(OUTPUT_DIR / "near-duplicate-a.wav", 1, duplicate_base)
    write_wav(OUTPUT_DIR / "near-duplicate-b.wav", 1, duplicate_variant)


if __name__ == "__main__":
    main()
