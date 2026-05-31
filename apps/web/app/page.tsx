import type { Metadata } from "next";
import { AudioSuiteApp } from "../components/audio-suite-app";
import { SiteShell } from "../components/site-shell";

export const metadata: Metadata = {
  title: "AudioSuite",
  description:
    "Extract audio, run EBU R128 loudness normalization, generate waveform peaks and Chromaprint fingerprints online for podcast and video.",
};

export default function HomePage() {
  return (
    <SiteShell>
      <AudioSuiteApp />
    </SiteShell>
  );
}
