export type AudioSuiteFeature =
  | "probe"
  | "extract"
  | "loudnorm"
  | "peaks"
  | "fingerprint"
  | "silence";

export interface AudioProbe {
  container: string;
  streams: Array<{
    index: number;
    codecType: string;
    codecName?: string;
    channels?: number;
    sampleRate?: number;
    bitDepth?: number;
  }>;
  codec: string;
  channels: number;
  sampleRate: number;
  bitDepth?: number;
  durationSec: number;
  integratedLufs?: number;
}

export interface LoudnormStats {
  I: number;
  LRA: number;
  TP: number;
}

export interface LoudnormReport {
  before: LoudnormStats;
  after: LoudnormStats;
  target: LoudnormStats;
  preset: "spotify" | "apple" | "youtube" | "ebu" | "custom";
  mode: "single-pass" | "two-pass";
}

export interface PeakLevel {
  zoom: number;
  samples: number[];
}

export interface PeaksResponse {
  durationSec: number;
  levels: PeakLevel[];
  waveformPngPath?: string;
}

export interface FingerprintResponse {
  algorithm: "chromaprint";
  durationSec: number;
  fingerprint: string;
}

export interface FingerprintCompareResponse {
  score: number;
  leftDurationSec: number;
  rightDurationSec: number;
}

export interface SilenceRange {
  startSec: number;
  endSec: number;
}

export interface SilenceResponse {
  thresholdDb: number;
  minDurationSec: number;
  ranges: SilenceRange[];
  trimmedPath?: string;
}

export * from "./samples";
