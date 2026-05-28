import type { Metadata } from "next";
import { AudioSuiteApp } from "../../components/audio-suite-app";

export const metadata: Metadata = {
  title: "Workspace",
  description:
    "Interactive AudioSuite workspace for extract, loudnorm, peaks, fingerprint, silence, async progress, and cancellation.",
};

export default function WorkspacePage() {
  return <AudioSuiteApp />;
}
