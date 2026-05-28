import type { Metadata } from "next";
import { AudioSuiteLanding } from "../../components/audio-suite-landing";

export const metadata: Metadata = {
  title: "Loudnorm Online",
  description:
    "Run open-source EBU R128 loudness normalization online with Spotify, Apple, YouTube, and EBU presets.",
};

export default function LoudnormOnlinePage() {
  return (
    <AudioSuiteLanding
      eyebrow="EBU R128 loudness normalization"
      title="Loudnorm Online"
      description="Use AudioSuite to run single-pass or two-pass loudnorm processing with platform presets and downloadable artifacts."
      ctaLabel="Open loudnorm workspace"
      ctaHref="/workspace"
      secondaryLabel="Podcast loudnorm"
      secondaryHref="/podcast-loudnorm"
    />
  );
}
