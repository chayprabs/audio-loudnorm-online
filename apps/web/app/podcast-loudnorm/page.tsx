import type { Metadata } from "next";
import { SeoLandingPage } from "../../components/seo-landing-page";

export const metadata: Metadata = {
  title: "Podcast Loudnorm",
  description:
    "Normalize podcast audio online with Apple (-16 LUFS) and Spotify (-14 LUFS) loudness targets.",
};

export default function PodcastLoudnormPage() {
  return (
    <SeoLandingPage
      title="Podcast Loudnorm"
      description="Prepare podcast episodes for Apple Podcasts and Spotify with preset loudness targets, async job progress, and artifact downloads."
    />
  );
}
