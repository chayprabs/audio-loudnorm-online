"use client";

import React from "react";
import { pollJob, type AsyncJobResponse, type AsyncJobStatus } from "@audio-suite/shared-worker-runtime";
import { ResultPane, SectionCard } from "@audio-suite/shared-ui";
import { AudioLines, Link2, UploadCloud, Waves } from "lucide-react";
import { useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_AUDIO_SUITE_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

const tabs = [
  { id: "extract", label: "Extract" },
  { id: "loudnorm", label: "Loudnorm" },
  { id: "peaks", label: "Peaks" },
  { id: "fingerprint", label: "Fingerprint" },
  { id: "silence", label: "Silence" },
] as const;

const samples = [
  {
    id: "podcast-demo",
    label: "Podcast clip",
    sourceUrl: "https://filesamples.com/samples/audio/mp3/sample3.mp3",
  },
  {
    id: "music-demo",
    label: "Music clip",
    sourceUrl: "https://filesamples.com/samples/audio/mp3/sample1.mp3",
  },
  {
    id: "voiceover-demo",
    label: "Voiceover with silence",
    sourceUrl: "https://filesamples.com/samples/audio/mp3/sample2.mp3",
  },
] as const;

type FeatureId = (typeof tabs)[number]["id"] | "probe";

export function AudioSuiteApp() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("loudnorm");
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<AsyncJobStatus | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitFeature(feature: FeatureId) {
    setLoading(true);
    setError(null);

    try {
      const form = new FormData();
      if (file) {
        form.set("file", file);
      }
      if (sourceUrl) {
        form.set("source_url", sourceUrl);
      }
      form.set("async_mode", "true");

      if (feature === "extract") {
        form.set("output_format", "wav");
        form.set("downmix", "stereo");
        form.set("sample_rate", "48000");
      }

      if (feature === "loudnorm") {
        form.set("preset", "apple");
        form.set("mode", "two-pass");
      }

      if (feature === "fingerprint") {
        form.set("compare_mode", "false");
      }

      if (feature === "silence") {
        form.set("threshold_db", "-38");
        form.set("min_duration_sec", "0.5");
        form.set("trim", "true");
      }

      const endpoint = feature === "probe" ? "probe" : feature;
      const response = await fetch(`${API_BASE_URL}/v1/${endpoint}`, {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as AsyncJobResponse | Record<string, unknown>;

      if (!response.ok) {
        throw new Error(typeof payload === "object" && payload && "detail" in payload ? String(payload.detail) : "Request failed");
      }

      if ("job_id" in payload) {
        const finalJob = await pollJob(
          () => fetch(`${API_BASE_URL}/v1/jobs/${payload.job_id}`).then((res) => res.json()),
          (nextJob) => setJob(nextJob),
        );
        setJob(finalJob);
        setResult(finalJob.result);
        if (finalJob.error) {
          setError(finalJob.error);
        }
      } else {
        setResult(payload);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unknown error");
    } finally {
      setLoading(false);
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
            <Metric label="Async" value="Progress polling and webhook-ready jobs" />
          </div>
        </div>
      </header>

      <SectionCard
        eyebrow="Inputs"
        title="Upload, paste a source URL, or start from a sample clip"
        description="The same input panel feeds probe, extract, loudnorm, waveform, fingerprint, and silence operations."
      >
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <label className="group flex min-h-60 cursor-pointer flex-col items-center justify-center gap-4 rounded-[2rem] border border-dashed border-cyan-400/35 bg-cyan-400/5 p-8 text-center transition hover:border-cyan-300 hover:bg-cyan-400/8">
            <UploadCloud className="size-10 text-cyan-300" />
            <div>
              <p className="text-lg font-medium text-white">{file ? file.name : "Drop audio or video here"}</p>
              <p className="mt-2 text-sm text-slate-300">Supports browser file pick and drag-drop. Video containers are accepted for extraction and analysis.</p>
            </div>
            <input
              className="hidden"
              type="file"
              accept="audio/*,video/*"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
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
                  onChange={(event) => setSourceUrl(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-200">Sample clips</p>
              <div className="grid gap-2">
                {samples.map((sample) => (
                  <button
                    key={sample.id}
                    className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-cyan-300/50 hover:bg-slate-900"
                    onClick={() => {
                      setSourceUrl(sample.sourceUrl);
                      setFile(null);
                    }}
                    type="button"
                  >
                    {sample.label}
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

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <ActionCard
              active={activeTab === "extract"}
              icon={<UploadCloud className="size-5" />}
              title="Extract"
              description="Container to audio conversion with format, rate, and downmix controls."
              onRun={() => submitFeature("extract")}
            />
            <ActionCard
              active={activeTab === "loudnorm"}
              icon={<Waves className="size-5" />}
              title="Loudnorm"
              description="Two-pass EBU R128 with Apple, Spotify, YouTube, and broadcast targets."
              onRun={() => submitFeature("loudnorm")}
            />
            <ActionCard
              active={activeTab === "peaks"}
              icon={<AudioLines className="size-5" />}
              title="Peaks"
              description="Generate multi-zoom JSON peaks and a waveform PNG."
              onRun={() => submitFeature("peaks")}
            />
            <ActionCard
              active={activeTab === "fingerprint"}
              icon={<Link2 className="size-5" />}
              title="Fingerprint"
              description="Chromaprint generation for lookup and duplicate workflows."
              onRun={() => submitFeature("fingerprint")}
            />
            <ActionCard
              active={activeTab === "silence"}
              icon={<Waves className="size-5" />}
              title="Silence"
              description="Detect silent regions and trim leading and trailing silence."
              onRun={() => submitFeature("silence")}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
              <h3 className="text-lg font-semibold text-white">Async progress</h3>
              <p className="mt-2 text-sm text-slate-300">
                Long-running jobs return a queued job id, then poll for status until completion.
              </p>
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
                  <dd>Available via `POST /v1/jobs/:id/cancel`</dd>
                </dl>
                {error ? <p className="rounded-2xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
              </div>
            </div>

            <ResultPane title="Result JSON" value={result ?? { status: "Run a task to inspect worker output." }} />
          </div>
        </div>
      </SectionCard>
    </main>
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
