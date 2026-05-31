import type { Metadata } from "next";
import { SeoLandingPage } from "../../components/seo-landing-page";

export const metadata: Metadata = {
  title: "EBU R128 Online",
  description: "Broadcast-safe EBU R128 loudness normalization online with two-pass measurement reports.",
};

export default function EbuR128OnlinePage() {
  return (
    <SeoLandingPage
      title="EBU R128 Online"
      description="Apply broadcast EBU (-23 LUFS) loudness normalization with true-peak limiting and before/after loudness reports using the open-source AudioSuite worker."
    />
  );
}
