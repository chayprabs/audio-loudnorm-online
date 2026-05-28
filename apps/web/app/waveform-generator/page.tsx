import type { Metadata } from "next";
import { AudioSuiteLanding } from "../../components/audio-suite-landing";

export const metadata: Metadata = {
  title: "Waveform Generator",
  description:
    "Generate multi-zoom waveform JSON and PNG artifacts online with the AudioSuite peaks workspace.",
};

export default function WaveformGeneratorPage() {
  return (
    <AudioSuiteLanding
      eyebrow="Waveform generation"
      title="Waveform Generator"
      description="Create waveform peaks JSON and PNG previews from the AudioSuite workspace without leaving the browser."
      ctaLabel="Open peaks workspace"
      ctaHref="/workspace"
      secondaryLabel="Root route"
      secondaryHref="/"
    />
  );
}
