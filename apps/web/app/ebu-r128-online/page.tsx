import type { Metadata } from "next";
import { AudioSuiteLanding } from "../../components/audio-suite-landing";

export const metadata: Metadata = {
  title: "EBU R128 Online",
  description:
    "Normalize audio to EBU R128 targets online with open-source FFmpeg loudnorm presets and artifact downloads.",
};

export default function EbuR128OnlinePage() {
  return (
    <AudioSuiteLanding
      eyebrow="Broadcast loudness targets"
      title="EBU R128 Online"
      description="Use the AudioSuite workspace for broadcast-safe loudness normalization, JSON reporting, and downloadable normalized audio."
      ctaLabel="Open EBU workspace"
      ctaHref="/workspace"
      secondaryLabel="Loudnorm route"
      secondaryHref="/loudnorm-online"
    />
  );
}
