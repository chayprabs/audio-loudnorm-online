"use client";

import React, { useMemo, useRef, useState } from "react";
import { ResultHighlights } from "./result-highlights";
import { WorkerStatus } from "./worker-status";
import { AUDIO_SAMPLES, type AudioSample } from "@audio-suite/shared-types";
import type { AsyncJobResponse, AsyncJobStatus } from "@audio-suite/shared-worker-runtime";
import { ResultPane, SectionCard } from "@audio-suite/shared-ui";
import {
  ArrowRight,
  AudioLines,
  CheckCircle2,
  CircleDot,
  Link2,
  LoaderCircle,
  UploadCloud,
  XCircle,
} from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_AUDIO_SUITE_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

const tabs = [
  { id: "extract", label: "Extract" },
  { id: "loudnorm", label: "Loudnorm" },
  { id: "peaks", label: "Peaks" },
  { id: "fingerprint", label: "Fingerprint" },
  { id: "silence", label: "Silence" },
] as const;

const toolMeta = {
  extract: {
    badge: "Container to audio",
    summary: "Convert video or audio containers into a clean delivery format.",
    detail: "Choose format, sample rate, downmix, and bit depth, then export the artifact you need.",
    runLabel: "Generate audio export",
  },
  loudnorm: {
    badge: "EBU R128",
    summary: "Normalize for Spotify, Apple, YouTube, or EBU with a reproducible report.",
    detail: "Use probe first if you want a quick baseline, then run single-pass or two-pass loudnorm.",
    runLabel: "Run loudness normalization",
  },
  peaks: {
    badge: "Waveform data",
    summary: "Create multi-zoom JSON peaks plus a shareable PNG waveform.",
    detail: "This is useful for editors, players, previews, or documentation screenshots.",
    runLabel: "Generate waveform assets",
  },
  fingerprint: {
    badge: "Chromaprint",
    summary: "Generate fingerprints or compare a known near-duplicate pair.",
    detail: "Use compare mode for fixture verification, or fingerprint a single source for lookup workflows.",
    runLabel: "Generate fingerprint",
  },
  silence: {
    badge: "Trim silence",
    summary: "Detect silent regions and optionally export a trimmed version.",
    detail: "Tune the threshold and minimum duration, then keep the JSON ranges and trimmed artifact.",
    runLabel: "Detect silence",
  },
} satisfies Record<(typeof tabs)[number]["id"], { badge: string; summary: string; detail: string; runLabel: string }>;

type FeatureId = (typeof tabs)[number]["id"] | "probe";

type ExtractSettings = {
  outputFormat: "wav" | "mp3" | "aac" | "opus" | "flac";
  sampleRate: string;
  downmix: "keep" | "mono" | "stereo" | "5.1";
  bitDepth: "16" | "24" | "32";
};

type LoudnormSettings = {
  preset: "spotify" | "apple" | "youtube" | "ebu";
  mode: "single-pass" | "two-pass";
};

type FingerprintSettings = {
  compareMode: boolean;
  sampleIdB: string;
};

type SilenceSettings = {
  thresholdDb: string;
  minDurationSec: string;
  trim: boolean;
};

export function AudioSuiteApp() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("loudnorm");
  const [file, setFile] = useState<File | null>(null);
  const [compareFileB, setCompareFileB] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [selectedSample, setSelectedSample] = useState<AudioSample | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<AsyncJobStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [extractSettings, setExtractSettings] = useState<ExtractSettings>({
    outputFormat: "wav",
    sampleRate: "48000",
    downmix: "stereo",
    bitDepth: "24",
  });
  const [loudnormSettings, setLoudnormSettings] = useState<LoudnormSettings>({
    preset: "apple",
    mode: "two-pass",
  });
  const [fingerprintSettings, setFingerprintSettings] = useState<FingerprintSettings>({
    compareMode: false,
    sampleIdB: "near-duplicate-b",
  });
  const [silenceSettings, setSilenceSettings] = useState<SilenceSettings>({
    thresholdDb: "-38",
    minDurationSec: "0.5",
    trim: true,
  });
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const stopPollingRef = useRef(false);

  const fingerprintSamples = useMemo(
    () => AUDIO_SAMPLES.filter((sample) => sample.category === "fingerprint"),
    [],
  );

  const activeTool = toolMeta[activeTab];
  const selectedSourceLabel = file?.name ?? selectedSample?.label ?? (sourceUrl ? "Source URL ready" : "No source selected");
  const selectedSourceHint = file
    ? "Uploaded from this browser session."
    : selectedSample
      ? selectedSample.description
      : sourceUrl
        ? sourceUrl
        : "Start with a file, a source URL, or one of the local fixtures.";

  function resetInputsForExternalSource() {
    setFile(null);
    setSelectedSample(null);
    setCompareFileB(null);
  }

  function applySelectedFile(nextFile: File | null) {
    setFile(nextFile);
    if (nextFile) {
      setSourceUrl("");
      setSelectedSample(null);
    }
  }

  function applyCompareFileB(nextFile: File | null) {
    setCompareFileB(nextFile);
    if (nextFile) {
      setSelectedSample(null);
      setSourceUrl("");
    }
  }

  function currentPrimarySampleId() {
    if (selectedSample) {
      return selectedSample.id;
    }
    if (activeTab === "fingerprint" && fingerprintSettings.compareMode) {
      return "near-duplicate-a";
    }
    return null;
  }

  async function pollJob(jobId: string) {
    let lastJob: AsyncJobStatus | null = null;

    for (;;) {
      if (stopPollingRef.current) {
        return lastJob;
      }

      const response = await fetch(`${API_BASE_URL}/v1/jobs/${jobId}`);
      const nextJob = (await response.json()) as AsyncJobStatus;
      lastJob = nextJob;

      if (stopPollingRef.current) {
        return nextJob;
      }

      setJob(nextJob);

      if (nextJob.status === "completed" || nextJob.status === "failed" || nextJob.status === "cancelled") {
        return nextJob;
      }

      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
  }

  async function cancelCurrentJob() {
    if (!job?.id) {
      return;
    }

    stopPollingRef.current = true;
    const response = await fetch(`${API_BASE_URL}/v1/jobs/${job.id}/cancel`, {
      method: "POST",
    });
    const cancelledJob = (await response.json()) as AsyncJobStatus;
    setJob(cancelledJob);
    setResult(cancelledJob.result as Record<string, unknown> | null);
    setLoading(false);
  }

  function hasSelectedSource() {
    if (file || sourceUrl.trim()) {
      return true;
    }
    return currentPrimarySampleId() !== null;
  }

  async function submitFeature(feature: FeatureId) {
    if (!hasSelectedSource()) {
      setError("Choose a file, paste a source URL, or select a sample clip before running a tool.");
      return;
    }

    if (feature === "fingerprint" && fingerprintSettings.compareMode) {
      const usingUploads = Boolean(file || compareFileB);
      const usingFixtures = !file && !sourceUrl.trim();
      if (usingUploads && (!file || !compareFileB)) {
        setError("Compare mode with uploads requires both file A and file B.");
        return;
      }
      if (!usingUploads && !usingFixtures) {
        setError("Compare mode needs two fixture samples or two uploaded files.");
        return;
      }
    }

    setLoading(true);
    setError(null);
    stopPollingRef.current = false;

    try {
      const form = new FormData();
      if (file) {
        form.set("file", file);
      }
      if (feature === "fingerprint" && fingerprintSettings.compareMode && compareFileB) {
        form.set("file_b", compareFileB);
      }
      if (!file && sourceUrl) {
        form.set("source_url", sourceUrl);
      }

      const sampleId = currentPrimarySampleId();
      if (!file && !sourceUrl && sampleId) {
        form.set("sample_id", sampleId);
      }

      if (webhookUrl) {
        form.set("webhook_url", webhookUrl);
      }
      form.set("async_mode", "true");

      if (feature === "extract") {
        form.set("output_format", extractSettings.outputFormat);
        form.set("sample_rate", extractSettings.sampleRate);
        form.set("downmix", extractSettings.downmix);
        form.set("bit_depth", extractSettings.bitDepth);
      }

      if (feature === "loudnorm") {
        form.set("preset", loudnormSettings.preset);
        form.set("mode", loudnormSettings.mode);
      }

      if (feature === "fingerprint") {
        form.set("compare_mode", String(fingerprintSettings.compareMode));
        if (fingerprintSettings.compareMode && !file && !sourceUrl) {
          form.set("sample_id", "near-duplicate-a");
          form.set("sample_id_b", fingerprintSettings.sampleIdB);
        }
      }

      if (feature === "silence") {
        form.set("threshold_db", silenceSettings.thresholdDb);
        form.set("min_duration_sec", silenceSettings.minDurationSec);
        form.set("trim", String(silenceSettings.trim));
      }

      const endpoint = feature === "probe" ? "probe" : feature;
      const response = await fetch(`${API_BASE_URL}/v1/${endpoint}`, {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as AsyncJobResponse | Record<string, unknown>;

      if (!response.ok) {
        throw new Error(
          typeof payload === "object" && payload && "detail" in payload ? String(payload.detail) : "Request failed",
        );
      }

      if ("job_id" in payload && typeof payload.job_id === "string") {
        const finalJob = await pollJob(payload.job_id);
        if (!stopPollingRef.current && finalJob) {
          setJob(finalJob);
          setResult((finalJob.result as Record<string, unknown> | null) ?? null);
          if (finalJob.error) {
            setError(finalJob.error);
          }
        }
      } else {
        setResult(payload as Record<string, unknown>);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unknown error");
    } finally {
      setLoading(false);
      stopPollingRef.current = false;
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
            <span className="font-medium text-stone-900">{labelForTab(activeTab)}</span>
            <span aria-hidden>·</span>
            <span className="max-w-md truncate">{selectedSourceLabel}</span>
          </div>
          <WorkerStatus />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
            onClick={() => submitFeature("probe")}
            type="button"
          >
            <AudioLines className="size-4" />
            Probe
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-stone-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            onClick={() => submitFeature(activeTab)}
            type="button"
          >
            {loading ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            {activeTool.runLabel}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <SectionCard
            eyebrow="Step 1"
            title="Add one source and keep the rest simple"
            description="Use only one input method at a time. The selected source carries through every tool tab."
          >
            <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <label
                className={`group flex min-h-64 cursor-pointer flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-dashed px-8 py-10 text-center transition ${
                  isDraggingFile
                    ? "border-stone-950 bg-stone-950/[0.03]"
                    : "border-stone-300 bg-stone-50 hover:border-stone-500 hover:bg-white"
                }`}
                onDragEnter={() => setIsDraggingFile(true)}
                onDragLeave={(event) => {
                  if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    return;
                  }
                  setIsDraggingFile(false);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDraggingFile(false);
                  applySelectedFile(event.dataTransfer.files?.[0] ?? null);
                }}
              >
                <div className="rounded-full border border-stone-300 bg-white p-4 shadow-sm">
                  <UploadCloud className="size-7 text-stone-900" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-stone-950">
                    {file ? file.name : "Drop audio or video here"}
                  </p>
                  <p className="mt-2 max-w-md text-sm leading-6 text-stone-600">
                    Supports drag and drop, file picking, and common media containers for extraction and analysis.
                  </p>
                </div>
                <div className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition group-hover:border-stone-500">
                  Browse files
                </div>
                <input
                  className="hidden"
                  type="file"
                  accept="audio/*,video/*"
                  onChange={(event) => {
                    applySelectedFile(event.target.files?.[0] ?? null);
                    setIsDraggingFile(false);
                  }}
                />
              </label>

              <div className="space-y-4 rounded-[1.75rem] border border-stone-200 bg-stone-50/80 p-4">
                <FieldFrame label="Paste a source URL" helper="Use this when the worker should fetch the media for you.">
                  <div className="flex items-center gap-3 rounded-[1.1rem] border border-stone-200 bg-white px-4 py-3">
                    <Link2 className="size-4 text-stone-500" />
                    <input
                      className="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
                      placeholder="https://example.com/episode.mp4"
                      value={sourceUrl}
                      onChange={(event) => {
                        setSourceUrl(event.target.value);
                        if (event.target.value) {
                          resetInputsForExternalSource();
                        }
                      }}
                    />
                  </div>
                </FieldFrame>

                <FieldFrame label="Optional webhook URL" helper="Add this only if you want a callback when async work completes.">
                  <div className="rounded-[1.1rem] border border-stone-200 bg-white px-4 py-3">
                    <input
                      className="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
                      placeholder="https://example.com/webhooks/audio-suite"
                      value={webhookUrl}
                      onChange={(event) => setWebhookUrl(event.target.value)}
                    />
                  </div>
                </FieldFrame>

                <div className="rounded-[1.1rem] border border-stone-200 bg-white px-4 py-4">
                  <p className="text-sm font-semibold text-stone-900">Current source</p>
                  <p className="mt-2 text-sm font-medium text-stone-700">{selectedSourceLabel}</p>
                  <p className="mt-1 text-sm leading-6 text-stone-500">{selectedSourceHint}</p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold text-stone-900">Local sample clips</p>
              <p className="mt-1 text-sm leading-6 text-stone-500">
                Use these when you want fast reproducible results without uploading anything.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {AUDIO_SAMPLES.filter((sample) => sample.category !== "fingerprint").map((sample) => (
                  <button
                    key={sample.id}
                    className={`rounded-[1.25rem] border px-4 py-4 text-left text-sm transition ${
                      selectedSample?.id === sample.id
                        ? "border-cyan-300/60 bg-cyan-300/10"
                        : "border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50"
                    }`}
                    onClick={() => {
                      setFile(null);
                      setSourceUrl("");
                      setCompareFileB(null);
                      setSelectedSample(sample);
                    }}
                    type="button"
                  >
                    <span className="block font-semibold text-stone-950">{sample.label}</span>
                    <span className="mt-2 block leading-6 text-stone-500">{sample.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Step 2"
            title="Choose one tool and adjust only the useful controls"
            description="Each tab maps directly to one worker endpoint. The control panel below changes with the active tool."
          >
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="flex flex-wrap gap-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
                        activeTab === tab.id
                          ? "bg-stone-950 text-stone-50"
                          : "border border-stone-300 bg-white text-stone-600 hover:border-stone-500 hover:text-stone-900"
                      }`}
                      onClick={() => setActiveTab(tab.id)}
                      type="button"
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  {activeTool.badge}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/90 p-5">
                  <p className="text-sm font-semibold text-stone-900">{activeTool.summary}</p>
                  <p className="mt-2 text-sm leading-6 text-stone-500">{activeTool.detail}</p>
                  <div className="mt-4 space-y-2 rounded-[1.2rem] border border-stone-200 bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">What happens next</p>
                    <ol className="space-y-2 text-sm leading-6 text-stone-700">
                      <li>1. AudioSuite sends the current source to the {labelForTab(activeTab).toLowerCase()} endpoint.</li>
                      <li>2. The worker runs asynchronously and updates the job status until completion.</li>
                      <li>3. You get artifact links plus the raw response JSON for validation.</li>
                    </ol>
                  </div>
                </div>

                <FeatureControls
                  activeTab={activeTab}
                  extractSettings={extractSettings}
                  fingerprintSamples={fingerprintSamples}
                  fingerprintSettings={fingerprintSettings}
                  loudnormSettings={loudnormSettings}
                  silenceSettings={silenceSettings}
                  onCompareFileB={applyCompareFileB}
                  onExtractChange={setExtractSettings}
                  onFingerprintChange={(value) => {
                    if (!value.compareMode && fingerprintSettings.compareMode) {
                      setCompareFileB(null);
                    }
                    setFingerprintSettings(value);
                  }}
                  onLoudnormChange={setLoudnormSettings}
                  onSilenceChange={setSilenceSettings}
                />
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            eyebrow="Step 3"
            title="Run the active tool and track the job"
            description="One primary action, visible status, and a quick path to cancel if a run is no longer useful."
          >
            <div className="space-y-5">
              <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/90 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Active action
                    </p>
                    <h3 className="text-xl font-semibold text-stone-950">{activeTool.runLabel}</h3>
                    <p className="max-w-xl text-sm leading-6 text-stone-500">
                      Use the active source and current tab settings. Results will appear below with downloadable artifacts when available.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={loading}
                      onClick={() => submitFeature(activeTab)}
                      type="button"
                    >
                      {loading ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                      {activeTool.runLabel}
                    </button>
                    <button
                      className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!job?.id || !loading}
                      onClick={() => void cancelCurrentJob()}
                      type="button"
                    >
                      <XCircle className="size-4" />
                      Cancel job
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-950">Progress</h3>
                    <p className="mt-1 text-sm text-stone-500">
                      Async jobs are polled automatically until they complete, fail, or are cancelled.
                    </p>
                  </div>
                  <JobStatePill loading={loading} status={job?.status ?? "idle"} />
                </div>

                <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-stone-200">
                  <div
                    className="h-full rounded-full bg-stone-950 transition-all"
                    style={{ width: `${job?.progress ?? 0}%` }}
                  />
                </div>

                <dl className="mt-5 grid gap-3 text-sm text-stone-600 sm:grid-cols-2">
                  <StatusTile label="Job id" value={job?.id ?? "Waiting for a queued run"} />
                  <StatusTile label="Progress" value={`${job?.progress ?? 0}%`} />
                  <StatusTile label="Status" value={loading ? "running" : job?.status ?? "idle"} />
                  <StatusTile label="Cancellation" value={job?.id ? "Available in page and via API" : "Not active yet"} />
                </dl>

                {error ? (
                  <p className="mt-4 rounded-[1.1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </p>
                ) : null}
              </div>

              <ResultHighlights result={result} />
              <ArtifactLinks result={result} />
              <ResultPane title="Result JSON" value={result ?? { status: "Run a task to inspect worker output." }} />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function FeatureControls(props: {
  activeTab: (typeof tabs)[number]["id"];
  extractSettings: ExtractSettings;
  loudnormSettings: LoudnormSettings;
  fingerprintSettings: FingerprintSettings;
  silenceSettings: SilenceSettings;
  fingerprintSamples: AudioSample[];
  onCompareFileB: (file: File | null) => void;
  onExtractChange: (value: ExtractSettings) => void;
  onLoudnormChange: (value: LoudnormSettings) => void;
  onFingerprintChange: (value: FingerprintSettings) => void;
  onSilenceChange: (value: SilenceSettings) => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-stone-950">{labelForTab(props.activeTab)} settings</h3>
      <p className="mt-2 text-sm leading-6 text-stone-500">
        Only the active tool settings are shown here so you can focus on the output you want.
      </p>

      {props.activeTab === "extract" ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Output format"
            value={props.extractSettings.outputFormat}
            options={["wav", "mp3", "aac", "opus", "flac"]}
            onChange={(value) =>
              props.onExtractChange({ ...props.extractSettings, outputFormat: value as ExtractSettings["outputFormat"] })
            }
          />
          <SelectField
            label="Downmix"
            value={props.extractSettings.downmix}
            options={["keep", "mono", "stereo", "5.1"]}
            onChange={(value) =>
              props.onExtractChange({ ...props.extractSettings, downmix: value as ExtractSettings["downmix"] })
            }
          />
          <InputField
            label="Sample rate"
            value={props.extractSettings.sampleRate}
            onChange={(value) => props.onExtractChange({ ...props.extractSettings, sampleRate: value })}
            placeholder="48000"
          />
          <SelectField
            label="Bit depth"
            value={props.extractSettings.bitDepth}
            options={["16", "24", "32"]}
            onChange={(value) =>
              props.onExtractChange({ ...props.extractSettings, bitDepth: value as ExtractSettings["bitDepth"] })
            }
          />
        </div>
      ) : null}

      {props.activeTab === "loudnorm" ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Preset"
            value={props.loudnormSettings.preset}
            options={["spotify", "apple", "youtube", "ebu"]}
            onChange={(value) =>
              props.onLoudnormChange({ ...props.loudnormSettings, preset: value as LoudnormSettings["preset"] })
            }
          />
          <SelectField
            label="Mode"
            value={props.loudnormSettings.mode}
            options={["single-pass", "two-pass"]}
            onChange={(value) =>
              props.onLoudnormChange({ ...props.loudnormSettings, mode: value as LoudnormSettings["mode"] })
            }
          />
        </div>
      ) : null}

      {props.activeTab === "fingerprint" ? (
        <div className="mt-5 space-y-4">
          <label className="flex items-start gap-3 rounded-[1.1rem] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
            <input
              checked={props.fingerprintSettings.compareMode}
              className="mt-1 size-4 rounded border-stone-300 bg-white"
              onChange={(event) =>
                props.onFingerprintChange({ ...props.fingerprintSettings, compareMode: event.target.checked })
              }
              type="checkbox"
            />
            <span>
              <span className="block font-medium text-stone-900">Compare the fixture pair</span>
              <span className="mt-1 block leading-6 text-stone-500">
                Turn this on to score the built-in near-duplicate samples against each other.
              </span>
            </span>
          </label>
          {props.fingerprintSettings.compareMode ? (
            <>
              <SelectField
                label="Comparison sample B (fixtures)"
                value={props.fingerprintSettings.sampleIdB}
                options={props.fingerprintSamples.map((sample) => sample.id)}
                labels={Object.fromEntries(props.fingerprintSamples.map((sample) => [sample.id, sample.label]))}
                onChange={(value) => props.onFingerprintChange({ ...props.fingerprintSettings, sampleIdB: value })}
              />
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-stone-900">Or upload file B</span>
                <input
                  accept="audio/*,video/*"
                  className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-full file:border-0 file:bg-stone-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-stone-50"
                  onChange={(event) => props.onCompareFileB(event.target.files?.[0] ?? null)}
                  type="file"
                />
              </label>
            </>
          ) : null}
        </div>
      ) : null}

      {props.activeTab === "silence" ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <InputField
            label="Threshold (dB)"
            value={props.silenceSettings.thresholdDb}
            onChange={(value) => props.onSilenceChange({ ...props.silenceSettings, thresholdDb: value })}
            placeholder="-38"
          />
          <InputField
            label="Minimum duration (sec)"
            value={props.silenceSettings.minDurationSec}
            onChange={(value) => props.onSilenceChange({ ...props.silenceSettings, minDurationSec: value })}
            placeholder="0.5"
          />
          <label className="flex items-start gap-3 rounded-[1.1rem] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 sm:col-span-2">
            <input
              checked={props.silenceSettings.trim}
              className="mt-1 size-4 rounded border-stone-300 bg-white"
              onChange={(event) => props.onSilenceChange({ ...props.silenceSettings, trim: event.target.checked })}
              type="checkbox"
            />
            <span>
              <span className="block font-medium text-stone-900">Trim the output</span>
              <span className="mt-1 block leading-6 text-stone-500">
                Keep this on when you want a ready-to-download artifact with leading and trailing silence removed.
              </span>
            </span>
          </label>
        </div>
      ) : null}

      {props.activeTab === "peaks" ? (
        <p className="mt-5 rounded-[1.1rem] border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-600">
          Peaks generation uses the current source and returns multi-zoom JSON plus a waveform PNG artifact.
        </p>
      ) : null}
    </div>
  );
}

function ArtifactLinks(props: { result: Record<string, unknown> | null }) {
  if (!props.result) {
    return null;
  }

  const links = Object.entries(props.result).filter(
    ([key, value]) => key.endsWith("_url") && typeof value === "string" && value.startsWith("/"),
  );

  if (links.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-stone-950">Artifacts</h3>
      <p className="mt-1 text-sm text-stone-500">Open any generated file in a new tab.</p>
      <div className="mt-4 grid gap-3">
        {links.map(([key, value]) => (
          <a
            key={key}
            className="inline-flex items-center justify-between rounded-[1.1rem] border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 transition hover:border-stone-400 hover:bg-stone-100"
            href={`${API_BASE_URL}${value}`}
            rel="noreferrer"
            target="_blank"
          >
            <span>{key.replaceAll("_", " ")}</span>
            <ArrowRight className="size-4" />
          </a>
        ))}
      </div>
    </div>
  );
}

function FieldFrame(props: {
  label: string;
  helper: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-semibold text-stone-900">{props.label}</label>
        <p className="mt-1 text-sm leading-6 text-stone-500">{props.helper}</p>
      </div>
      {props.children}
    </div>
  );
}

function SelectField(props: {
  label: string;
  value: string;
  options: string[];
  labels?: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-stone-900">{props.label}</span>
      <select
        className="w-full rounded-[1.1rem] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
        onChange={(event) => props.onChange(event.target.value)}
        value={props.value}
      >
        {props.options.map((option) => (
          <option key={option} value={option}>
            {props.labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function InputField(props: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-stone-900">{props.label}</span>
      <input
        className="w-full rounded-[1.1rem] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none placeholder:text-stone-400 transition focus:border-stone-500"
        onChange={(event) => props.onChange(event.target.value)}
        placeholder={props.placeholder}
        value={props.value}
      />
    </label>
  );
}

function StatusTile(props: { label: string; value: string }) {
  return (
    <div className="rounded-[1.1rem] border border-stone-200 bg-stone-50 px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{props.label}</dt>
      <dd className="mt-2 truncate text-sm font-medium text-stone-900">{props.value}</dd>
    </div>
  );
}

function JobStatePill(props: { status: string; loading: boolean }) {
  if (props.loading) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
        <LoaderCircle className="size-3.5 animate-spin" />
        Running
      </span>
    );
  }

  if (props.status === "completed") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
        <CheckCircle2 className="size-3.5" />
        Completed
      </span>
    );
  }

  if (props.status === "failed" || props.status === "cancelled") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
        <XCircle className="size-3.5" />
        {props.status}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">
      <CircleDot className="size-3.5" />
      Idle
    </span>
  );
}

function labelForTab(tab: (typeof tabs)[number]["id"]) {
  return tabs.find((item) => item.id === tab)?.label ?? tab;
}
