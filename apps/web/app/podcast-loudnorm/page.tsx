import type { Metadata } from "next";
import { AudioSuiteLanding } from "../../components/audio-suite-landing";

export const metadata: Metadata = {
  title: "Podcast Loudnorm",
  description:
    "Normalize podcast audio online with Apple and Spotify loudness targets using the AudioSuite workspace.",
};

export default function PodcastLoudnormPage() {
  return (
    <AudioSuiteLanding
      eyebrow="Podcast mastering"
      title="Podcast Loudnorm"
      description="Bring spoken-word audio into Apple and Spotify loudness ranges with two-pass normalization and downloadable outputs."
      ctaLabel="Open podcast workspace"
      ctaHref="/workspace"
      secondaryLabel="Waveform generator"
      secondaryHref="/waveform-generator"
    />
  );
}
