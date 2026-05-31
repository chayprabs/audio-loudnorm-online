import type { Metadata } from "next";
import { SeoLandingPage } from "../../components/seo-landing-page";

export const metadata: Metadata = {
  title: "Waveform Generator",
  description: "Generate multi-zoom waveform JSON peaks and PNG previews online.",
};

export default function WaveformGeneratorPage() {
  return (
    <SeoLandingPage
      title="Waveform Generator"
      description="Produce downsampled multi-zoom waveform JSON and PNG preview images for editors, players, and documentation."
    />
  );
}
