import React from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_AUDIO_SUITE_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

type ResultHighlightsProps = {
  result: Record<string, unknown> | null;
};

export function ResultHighlights(props: ResultHighlightsProps) {
  if (!props.result) {
    return null;
  }

  const loudnorm = readLoudnormReport(props.result);
  const waveformUrl = readArtifactUrl(props.result, "waveform_png_url");
  const fingerprintScore = typeof props.result.score === "number" ? props.result.score : null;
  const silenceRanges = Array.isArray(props.result.ranges) ? props.result.ranges.length : null;

  if (!loudnorm && !waveformUrl && fingerprintScore === null && silenceRanges === null) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-[1.5rem] border border-stone-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-stone-950">Output preview</h3>

      {loudnorm ? (
        <div className="overflow-x-auto rounded-[1.1rem] border border-stone-200">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-2">Metric</th>
                <th className="px-4 py-2">Before</th>
                <th className="px-4 py-2">After</th>
                <th className="px-4 py-2">Target</th>
              </tr>
            </thead>
            <tbody className="text-stone-700">
              {(["I", "LRA", "TP"] as const).map((metric) => (
                <tr key={metric} className="border-t border-stone-200">
                  <td className="px-4 py-2 font-medium">{metric}</td>
                  <td className="px-4 py-2">{formatMetric(loudnorm.before[metric])}</td>
                  <td className="px-4 py-2">{formatMetric(loudnorm.after[metric])}</td>
                  <td className="px-4 py-2">{formatMetric(loudnorm.target[metric])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {waveformUrl ? (
        <div className="space-y-2">
          <p className="text-sm text-stone-600">Waveform preview (PNG)</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Generated waveform preview"
            className="w-full rounded-[1.1rem] border border-stone-200 bg-stone-50"
            src={waveformUrl}
          />
        </div>
      ) : null}

      {fingerprintScore !== null ? (
        <p className="rounded-[1.1rem] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
          Chromaprint similarity score: <strong>{fingerprintScore.toFixed(3)}</strong>
        </p>
      ) : null}

      {silenceRanges !== null ? (
        <p className="rounded-[1.1rem] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
          Detected silent regions: <strong>{silenceRanges}</strong>
        </p>
      ) : null}
    </div>
  );
}

function readArtifactUrl(result: Record<string, unknown>, key: string) {
  const value = result[key];
  if (typeof value !== "string" || !value.startsWith("/")) {
    return null;
  }
  return `${API_BASE_URL}${value}`;
}

function readLoudnormReport(result: Record<string, unknown>) {
  const before = result.before;
  const after = result.after;
  const target = result.target;
  if (!isLoudnessStats(before) || !isLoudnessStats(after) || !isLoudnessStats(target)) {
    return null;
  }
  return { before, after, target };
}

function isLoudnessStats(value: unknown): value is { I: number; LRA: number; TP: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { I?: unknown }).I === "number" &&
    typeof (value as { LRA?: unknown }).LRA === "number" &&
    typeof (value as { TP?: unknown }).TP === "number"
  );
}

function formatMetric(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "—";
}
