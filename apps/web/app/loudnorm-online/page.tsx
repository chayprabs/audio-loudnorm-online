import type { Metadata } from "next";
import { SeoLandingPage } from "../../components/seo-landing-page";

export const metadata: Metadata = {
  title: "Loudnorm Online",
  description:
    "Run open-source EBU R128 loudness normalization online with Spotify, Apple, YouTube, and EBU presets.",
};

export default function LoudnormOnlinePage() {
  return (
    <SeoLandingPage
      title="Loudnorm Online"
      description="Normalize podcast and video audio to platform targets with single-pass or two-pass EBU R128 loudness processing, integrated LUFS reporting, and downloadable artifacts."
    />
  );
}
