import type { Metadata } from "next";
import { AudioSuiteLanding } from "../components/audio-suite-landing";

export const metadata: Metadata = {
  title: "AudioSuite",
  description:
    "Open-source audio extraction, EBU R128 loudness normalization, waveform peaks, fingerprints, and silence trimming.",
};

export default function HomePage() {
  return (
    <AudioSuiteLanding
      eyebrow="Open-source audio processing"
      title="AudioSuite"
      description="Extract audio from containers, normalize to platform targets, inspect waveform peaks, compare Chromaprint fingerprints, and trim silence from a single browser workspace."
      secondaryLabel="Go to workspace"
      secondaryHref="/workspace"
      details={
        <p>
          Use the workspace route when you want the full async UI with sample inputs, webhook callbacks, result JSON,
          and artifact links.
        </p>
      }
    />
  );
}
