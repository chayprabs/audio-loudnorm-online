import type { Metadata } from "next";
import { SeoLandingPage } from "../../components/seo-landing-page";

export const metadata: Metadata = {
  title: "Audio Fingerprint Online",
  description: "Generate Chromaprint fingerprints and compare near-duplicate audio online.",
};

export default function AudioFingerprintOnlinePage() {
  return (
    <SeoLandingPage
      title="Audio Fingerprint Online"
      description="Create Chromaprint fingerprints from uploads or samples and compare near-duplicate pairs with a reproducible similarity score."
    />
  );
}
