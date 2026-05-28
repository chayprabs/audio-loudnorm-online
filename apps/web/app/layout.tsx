import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AudioSuite",
  description:
    "Extract audio, run EBU R128 loudness normalisation, generate waveform peaks and Chromaprint fingerprints online for podcast and video.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
