"use client";

import React, { useMemo, useRef, useState } from "react";
import { AUDIO_SAMPLES, type AudioSample } from "@audio-suite/shared-types";
import type { AsyncJobResponse, AsyncJobStatus } from "@audio-suite/shared-worker-runtime";
import { ResultPane, SectionCard } from "@audio-suite/shared-ui";
import { AudioLines, Link2, UploadCloud, Waves, XCircle } from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_AUDIO_SUITE_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

const tabs = [
  { id: "extract", label: "Extract" },
  { id: "loudnorm", label: "Loudnorm" },
  { id: "peaks", label: "Peaks" },
  { id: "fingerprint", label: "Fingerprint" },
  { id: "silence", label: "Silence" },
] as const;

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
  const [sourceUrl, setSourceUrl] = useState("");
  const [selectedSample, setSelectedSample] = useState<AudioSample | null>(AUDIO_SAMPLES[0] ?? null);
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

  function resetInputsForExternalSource() {
    setFile(null);
    setSelectedSample(null);
  }

  function applySelectedFile(nextFile: File | null) {
    setFile(nextFile);
    if (nextFile) {
      setSourceUrl("");
      setSelectedSample(null);
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
    for (;;) {
      const response = await fetch(`${API_BASE_URL}/v1/jobs/${jobId}`);
      const nextJob = (await response.json()) as AsyncJobStatus;
      setJob(nextJob);

      if (nextJob.status === "completed" || nextJob.status === "failed" || nextJob.status === "cancelled") {
        return nextJob;
      }

      if (stopPollingRef.current) {
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

  async function submitFeature(feature: FeatureId) {
    setLoading(true);
    setError(null);
    stopPollingRef.current = false;

    try {
      const form = new FormData();
      if (file) {
        form.set("file", file);
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
        setJob(finalJob);
        setResult((finalJob.result as Record<string, unknown> | null) ?? null);
        if (finalJob.error) {
          setError(finalJob.error);
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
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-8">
      <header className="rounded-[2rem] border border-cyan-400/15 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Audio processing workspace</p>
            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">AudioSuite</h1>
            <p className="text-base leading-7 text-slate-300 md:text-lg">
              Extract audio from containers, normalize to platform loudness targets, inspect waveform peaks,
              compute Chromaprint fingerprints, and trim silence from a single technical workspace.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-3">
            <Metric label="Presets" value="Spotify, Apple, YouTube, EBU" />
            <Metric label="Artifacts" value="WAV, MP3, AAC, Opus, FLAC" />
            <Metric label="Async" value="Progress polling, cancellation, and webhook-ready jobs" />
          </div>
        </div>
      </header>

      <SectionCard
        eyebrow="Inputs"
        title="Upload, paste a source URL, or start from a sample clip"
        description="The same input panel feeds probe, extract, loudnorm, waveform, fingerprint, and silence operations."
      >
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <label
            className={`group flex min-h-60 cursor-pointer flex-col items-center justify-center gap-4 rounded-[2rem] border border-dashed p-8 text-center transition ${
              isDraggingFile
                ? "border-cyan-200 bg-cyan-300/12 shadow-[0_0_0_1px_rgba(103,232,249,0.3)]"
                : "border-cyan-400/35 bg-cyan-400/5 hover:border-cyan-300 hover:bg-cyan-400/8"
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
            <UploadCloud className="size-10 text-cyan-300" />
            <div>
              <p className="text-lg font-medium text-white">{file ? file.name : "Drop audio or video here"}</p>
              <p className="mt-2 text-sm text-slate-300">
                Supports browser file pick and drag-drop. Video containers are accepted for extraction and analysis.
              </p>
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

          <div className="space-y-5 rounded-[2rem] border border-white/10 bg-black/20 p-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Source URL</label>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3">
                <Link2 className="size-4 text-cyan-300" />
                <input
                  className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Webhook URL</label>
              <div className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3">
                <input
                  className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                  placeholder="https://example.com/webhooks/audio-suite"
                  value={webhookUrl}
                  onChange={(event) => setWebhookUrl(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-200">Sample clips</p>
              <div className="grid gap-2">
                {AUDIO_SAMPLES.filter((sample) => sample.category !== "fingerprint").map((sample) => (
                  <button
                    key={sample.id}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm text-slate-200 transition ${
                      selectedSample?.id === sample.id
                        ? "border-cyan-300/60 bg-cyan-300/10"
                        : "border-white/10 bg-slate-900/70 hover:border-cyan-300/50 hover:bg-slate-900"
                    }`}
                    onClick={() => {
                      setFile(null);
                      setSourceUrl("");
                      setSelectedSample(sample);
                    }}
                    type="button"
                  >
                    <span className="block font-medium text-white">{sample.label}</span>
                    <span className="mt-1 block text-xs text-slate-400">{sample.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
              onClick={() => submitFeature("probe")}
              type="button"
            >
              <AudioLines className="size-4" />
              Run probe first
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Workflow"
        title="Switch tasks without leaving the page"
        description="Each tab submits to its matching API endpoint and streams progress through the shared async job channel."
      >
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "bg-white text-slate-950"
                    : "border border-white/10 bg-slate-950/70 text-slate-300 hover:border-cyan-300/50"
                }`}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              <FeatureControls
                activeTab={activeTab}
                extractSettings={extractSettings}
                fingerprintSamples={fingerprintSamples}
                fingerprintSettings={fingerprintSettings}
                loudnormSettings={loudnormSettings}
                silenceSettings={silenceSettings}
                onExtractChange={setExtractSettings}
                onFingerprintChange={setFingerprintSettings}
                onLoudnormChange={setLoudnormSettings}
                onSilenceChange={setSilenceSettings}
              />

              <ActionGrid activeTab={activeTab} onRun={submitFeature} />
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Async progress</h3>
                    <p className="mt-2 text-sm text-slate-300">
                      Long-running jobs return a queued job id, then poll for status until completion.
                    </p>
                  </div>
                  <button
                    className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!job?.id || !loading}
                    onClick={() => void cancelCurrentJob()}
                    type="button"
                  >
                    <XCircle className="size-4" />
                    Cancel job
                  </button>
                </div>
                <div className="mt-5 space-y-4">
                  <div className="h-3 overflow-hidden rounded-full bg-slate-900">
                    <div
                      className="h-full rounded-full bg-cyan-300 transition-all"
                      style={{ width: `${job?.progress ?? 0}%` }}
                    />
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                    <dt>Status</dt>
                    <dd>{loading ? "running" : job?.status ?? "idle"}</dd>
                    <dt>Job ID</dt>
                    <dd className="truncate">{job?.id ?? "n/a"}</dd>
                    <dt>Cancel</dt>
                    <dd>{job?.id ? "Available in-page and via API" : "Waiting for a queued job"}</dd>
                  </dl>
                  {error ? (
                    <p className="rounded-2xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                      {error}
                    </p>
                  ) : null}
                </div>
              </div>

              <ArtifactLinks result={result} />
              <ResultPane title="Result JSON" value={result ?? { status: "Run a task to inspect worker output." }} />
            </div>
          </div>
        </div>
      </SectionCard>
    </main>
  );
}

function FeatureControls(props: {
  activeTab: (typeof tabs)[number]["id"];
  extractSettings: ExtractSettings;
  loudnormSettings: LoudnormSettings;
  fingerprintSettings: FingerprintSettings;
  silenceSettings: SilenceSettings;
  fingerprintSamples: AudioSample[];
  onExtractChange: (value: ExtractSettings) => void;
  onLoudnormChange: (value: LoudnormSettings) => void;
  onFingerprintChange: (value: FingerprintSettings) => void;
  onSilenceChange: (value: SilenceSettings) => void;
}) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
      <h3 className="text-lg font-semibold text-white">{labelForTab(props.activeTab)} controls</h3>
      <p className="mt-2 text-sm text-slate-300">
        These inputs map directly to the worker request for the active tool.
      </p>

      {props.activeTab === "extract" ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Output format"
            value={props.extractSettings.outputFormat}
            options={["wav", "mp3", "aac", "opus", "flac"]}
            onChange={(value) => props.onExtractChange({ ...props.extractSettings, outputFormat: value as ExtractSettings["outputFormat"] })}
          />
          <SelectField
            label="Downmix"
            value={props.extractSettings.downmix}
            options={["keep", "mono", "stereo", "5.1"]}
            onChange={(value) => props.onExtractChange({ ...props.extractSettings, downmix: value as ExtractSettings["downmix"] })}
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
            onChange={(value) => props.onExtractChange({ ...props.extractSettings, bitDepth: value as ExtractSettings["bitDepth"] })}
          />
        </div>
      ) : null}

      {props.activeTab === "loudnorm" ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Preset"
            value={props.loudnormSettings.preset}
            options={["spotify", "apple", "youtube", "ebu"]}
            onChange={(value) => props.onLoudnormChange({ ...props.loudnormSettings, preset: value as LoudnormSettings["preset"] })}
          />
          <SelectField
            label="Mode"
            value={props.loudnormSettings.mode}
            options={["single-pass", "two-pass"]}
            onChange={(value) => props.onLoudnormChange({ ...props.loudnormSettings, mode: value as LoudnormSettings["mode"] })}
          />
        </div>
      ) : null}

      {props.activeTab === "fingerprint" ? (
        <div className="mt-5 space-y-4">
          <label className="flex items-center gap-3 text-sm text-slate-200">
            <input
              checked={props.fingerprintSettings.compareMode}
              className="size-4 rounded border-white/20 bg-slate-950"
              onChange={(event) =>
                props.onFingerprintChange({ ...props.fingerprintSettings, compareMode: event.target.checked })
              }
              type="checkbox"
            />
            Compare two fixtures for near-duplicate scoring
          </label>
          {props.fingerprintSettings.compareMode ? (
            <SelectField
              label="Comparison sample B"
              value={props.fingerprintSettings.sampleIdB}
              options={props.fingerprintSamples.map((sample) => sample.id)}
              labels={Object.fromEntries(props.fingerprintSamples.map((sample) => [sample.id, sample.label]))}
              onChange={(value) => props.onFingerprintChange({ ...props.fingerprintSettings, sampleIdB: value })}
            />
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
          <label className="flex items-center gap-3 text-sm text-slate-200 sm:col-span-2">
            <input
              checked={props.silenceSettings.trim}
              className="size-4 rounded border-white/20 bg-slate-950"
              onChange={(event) => props.onSilenceChange({ ...props.silenceSettings, trim: event.target.checked })}
              type="checkbox"
            />
            Trim leading and trailing silence into a downloadable artifact
          </label>
        </div>
      ) : null}

      {props.activeTab === "peaks" ? (
        <p className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
          Peaks generation uses the active input and returns multi-zoom JSON plus a waveform PNG download.
        </p>
      ) : null}
    </div>
  );
}

function ActionGrid(props: {
  activeTab: (typeof tabs)[number]["id"];
  onRun: (feature: FeatureId) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <ActionCard
        active={props.activeTab === "extract"}
        icon={<UploadCloud className="size-5" />}
        title="Extract"
        description="Container to audio conversion with format, rate, bit-depth, and downmix controls."
        onRun={() => props.onRun("extract")}
      />
      <ActionCard
        active={props.activeTab === "loudnorm"}
        icon={<Waves className="size-5" />}
        title="Loudnorm"
        description="Single-pass or two-pass EBU R128 with platform presets."
        onRun={() => props.onRun("loudnorm")}
      />
      <ActionCard
        active={props.activeTab === "peaks"}
        icon={<AudioLines className="size-5" />}
        title="Peaks"
        description="Generate multi-zoom JSON peaks and a waveform PNG."
        onRun={() => props.onRun("peaks")}
      />
      <ActionCard
        active={props.activeTab === "fingerprint"}
        icon={<Link2 className="size-5" />}
        title="Fingerprint"
        description="Generate a Chromaprint fingerprint or compare a fixture pair."
        onRun={() => props.onRun("fingerprint")}
      />
      <ActionCard
        active={props.activeTab === "silence"}
        icon={<Waves className="size-5" />}
        title="Silence"
        description="Detect silent regions and optionally trim them into a new file."
        onRun={() => props.onRun("silence")}
      />
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
    <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
      <h3 className="text-lg font-semibold text-white">Artifacts</h3>
      <div className="mt-4 grid gap-3">
        {links.map(([key, value]) => (
          <a
            key={key}
            className="rounded-2xl border border-cyan-300/20 bg-cyan-300/5 px-4 py-3 text-sm text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-300/10"
            href={`${API_BASE_URL}${value}`}
            rel="noreferrer"
            target="_blank"
          >
            {key.replaceAll("_", " ")}
          </a>
        ))}
      </div>
    </div>
  );
}

function Metric(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{props.label}</p>
      <p className="mt-2 text-sm font-medium text-white">{props.value}</p>
    </div>
  );
}

function ActionCard(props: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onRun: () => void;
}) {
  return (
    <div
      className={`flex flex-col rounded-[1.75rem] border p-4 ${
        props.active ? "border-cyan-300/50 bg-cyan-400/5" : "border-white/10 bg-slate-950/60"
      }`}
    >
      <div className="flex items-center gap-3 text-white">
        <div className="rounded-xl bg-cyan-400/10 p-2 text-cyan-300">{props.icon}</div>
        <h3 className="font-semibold">{props.title}</h3>
      </div>
      <p className="mt-3 flex-1 text-sm leading-6 text-slate-300">{props.description}</p>
      <button
        className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:border-cyan-300/50 hover:bg-cyan-300/10"
        onClick={props.onRun}
        type="button"
      >
        Run {props.title}
      </button>
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
      <span className="text-sm font-medium text-slate-200">{props.label}</span>
      <select
        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none"
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
      <span className="text-sm font-medium text-slate-200">{props.label}</span>
      <input
        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
        onChange={(event) => props.onChange(event.target.value)}
        placeholder={props.placeholder}
        value={props.value}
      />
    </label>
  );
}

function labelForTab(tab: (typeof tabs)[number]["id"]) {
  return tabs.find((item) => item.id === tab)?.label ?? tab;
}
