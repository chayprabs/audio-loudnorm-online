from __future__ import annotations

import math
import random
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


def melodic_phrase(*, variant: bool = False) -> list[tuple[float]]:
    freqs = [130.81, 146.83, 164.81, 174.61, 196.0, 220.0, 246.94, 261.63, 293.66, 329.63]
    output: list[tuple[float]] = []
    for segment in range(32):
        freq = freqs[(segment * 2) % len(freqs)]
        frame_count = int(SAMPLE_RATE * 0.28)
        for index in range(frame_count):
            t = index / SAMPLE_RATE
            attack = min(1.0, index / (0.02 * SAMPLE_RATE))
            release = min(1.0, (frame_count - index) / (0.03 * SAMPLE_RATE))
            envelope = attack * release
            sample = 0.22 * envelope * math.sin(2 * math.pi * freq * t)
            sample += 0.11 * envelope * math.sin(2 * math.pi * freq * 2 * t)
            sample += 0.05 * envelope * math.sin(2 * math.pi * (freq * 1.498) * t)
            if variant:
                sample += 0.01 * math.sin(2 * math.pi * 29 * t)
                sample *= 0.98
            output.append((sample,))
        output.extend([(0.0,)] * int(SAMPLE_RATE * 0.03))
    return output


def textured_music() -> list[tuple[float, float]]:
    rng = random.Random(7)
    base_freqs = [82.41, 98.0, 123.47, 155.56, 207.65]
    output: list[tuple[float, float]] = []
    for segment in range(40):
        left_freq = base_freqs[segment % len(base_freqs)] * (1 + (segment % 3) * 0.25)
        right_freq = left_freq * 1.5
        frame_count = int(SAMPLE_RATE * 0.22)
        for index in range(frame_count):
            t = index / SAMPLE_RATE
            gate = 1.0 if (index % (SAMPLE_RATE // 40)) < (SAMPLE_RATE // 200) else 0.0
            noise = (rng.random() * 2 - 1) * 0.12
            left = 0.18 * math.sin(2 * math.pi * left_freq * t)
            left += 0.12 * math.sin(2 * math.pi * left_freq * 3.1 * t)
            left += 0.08 * noise + 0.12 * gate
            right = 0.16 * math.sin(2 * math.pi * right_freq * t)
            right += 0.1 * math.sin(2 * math.pi * right_freq * 2.3 * t)
            right += 0.06 * noise + 0.1 * gate
            output.append((left, right))
        output.extend([(0.0, 0.0)] * int(SAMPLE_RATE * 0.02))
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
    return textured_music()


def build_voiceover_with_silence() -> list[tuple[float]]:
    return silence(1.2) + speech_like(2.4, 160, amplitude=0.22) + silence(0.9) + speech_like(2.0, 205, amplitude=0.2) + silence(1.1)


def main() -> None:
    podcast = build_podcast()
    music = build_music()
    voiceover = build_voiceover_with_silence()
    duplicate_base = melodic_phrase()
    duplicate_variant = melodic_phrase(variant=True)

    write_wav(OUTPUT_DIR / "podcast-demo.wav", 1, podcast)
    write_wav(OUTPUT_DIR / "music-demo.wav", 2, music)
    write_wav(OUTPUT_DIR / "voiceover-with-silence.wav", 1, voiceover)
    write_wav(OUTPUT_DIR / "near-duplicate-a.wav", 1, duplicate_base)
    write_wav(OUTPUT_DIR / "near-duplicate-b.wav", 1, duplicate_variant)


if __name__ == "__main__":
    main()
