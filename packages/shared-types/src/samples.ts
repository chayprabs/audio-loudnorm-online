export interface AudioSample {
  id: string;
  label: string;
  description: string;
  fileName: string;
  category: "podcast" | "music" | "voiceover" | "fingerprint";
}

export const AUDIO_SAMPLES: AudioSample[] = [
  {
    id: "podcast-demo",
    label: "Podcast clip",
    description: "Synthetic mono speech-like clip for probe, loudnorm, and extraction checks.",
    fileName: "podcast-demo.wav",
    category: "podcast",
  },
  {
    id: "music-demo",
    label: "Music clip",
    description: "Synthetic stereo tonal clip for peaks and extraction format checks.",
    fileName: "music-demo.wav",
    category: "music",
  },
  {
    id: "voiceover-demo",
    label: "Voiceover with silence",
    description: "Synthetic speech-like clip with leading, mid-roll, and trailing silence.",
    fileName: "voiceover-with-silence.wav",
    category: "voiceover",
  },
  {
    id: "near-duplicate-a",
    label: "Near-duplicate A",
    description: "Primary fingerprint fixture for compare-mode acceptance checks.",
    fileName: "near-duplicate-a.wav",
    category: "fingerprint",
  },
  {
    id: "near-duplicate-b",
    label: "Near-duplicate B",
    description: "Slightly altered version of near-duplicate A for similarity scoring.",
    fileName: "near-duplicate-b.wav",
    category: "fingerprint",
  },
];
