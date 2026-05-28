import type { Metadata } from "next";
import { AudioSuiteLanding } from "../../components/audio-suite-landing";

export const metadata: Metadata = {
  title: "Audio Fingerprint Online",
  description:
    "Generate Chromaprint fingerprints and compare near-duplicate audio files online with AudioSuite.",
};

export default function AudioFingerprintOnlinePage() {
  return (
    <AudioSuiteLanding
      eyebrow="Chromaprint matching"
      title="Audio Fingerprint Online"
      description="Generate fingerprints, compare fixture pairs, and inspect duplicate scores in the AudioSuite workspace."
      ctaLabel="Open fingerprint workspace"
      ctaHref="/workspace"
      secondaryLabel="Waveform route"
      secondaryHref="/waveform-generator"
    />
  );
}
