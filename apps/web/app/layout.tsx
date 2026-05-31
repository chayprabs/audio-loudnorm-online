import type { Metadata } from "next";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AudioSuite",
    template: "%s | AudioSuite",
  },
  description:
    "Extract audio, run EBU R128 loudness normalisation, generate waveform peaks and Chromaprint fingerprints online for podcast and video.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AudioSuite",
    description:
      "Extract audio, normalize to EBU R128 targets, generate waveform peaks, compare Chromaprint fingerprints, and trim silence in one open-source tool.",
    type: "website",
    url: "/",
    siteName: "AudioSuite",
  },
  twitter: {
    card: "summary_large_image",
    title: "AudioSuite",
    description:
      "Audio extraction, loudness normalization, waveform peaks, fingerprints, and silence trimming in one open-source tool.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
