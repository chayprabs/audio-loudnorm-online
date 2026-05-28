import type { ReactNode } from "react";

type AudioSuiteLandingProps = {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  details?: ReactNode;
};

const featureCards = [
  {
    title: "Extract",
    body: "Convert containers into WAV, MP3, AAC, Opus, or FLAC with sample-rate, channel, and bit-depth controls.",
  },
  {
    title: "Loudnorm",
    body: "Run single-pass or two-pass EBU R128 normalization with Spotify, Apple, YouTube, and EBU presets.",
  },
  {
    title: "Peaks",
    body: "Generate multi-zoom waveform JSON plus PNG preview artifacts for editors and playback UIs.",
  },
  {
    title: "Fingerprint",
    body: "Create Chromaprint fingerprints and compare near-duplicate fixtures with a reproducible score.",
  },
  {
    title: "Silence",
    body: "Detect silent regions, export JSON ranges, and trim leading or trailing silence from source media.",
  },
];

export function AudioSuiteLanding(props: AudioSuiteLandingProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-8">
      <header className="rounded-[2rem] border border-cyan-400/15 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">{props.eyebrow}</p>
            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">{props.title}</h1>
            <p className="text-base leading-7 text-slate-300 md:text-lg">{props.description}</p>
          </div>
          <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-3">
            <MetricCard label="Presets" value="Spotify, Apple, YouTube, EBU" />
            <MetricCard label="Artifacts" value="WAV, MP3, AAC, Opus, FLAC" />
            <MetricCard label="Async" value="Progress polling, cancellation, and webhooks" />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            className="inline-flex items-center justify-center rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
            href={props.ctaHref ?? "/workspace"}
          >
            {props.ctaLabel ?? "Open workspace"}
          </a>
          <a
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:border-cyan-300/50 hover:bg-cyan-300/10"
            href={props.secondaryHref ?? "/waveform-generator"}
          >
            {props.secondaryLabel ?? "View SEO routes"}
          </a>
        </div>
      </header>

      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/20">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">What ships in the workspace</p>
        <div className="mt-3 space-y-2">
          <h2 className="text-2xl font-semibold text-white">Production audio tooling without a plugin install</h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-300">
            The interactive workspace lives at <code>/workspace</code> and includes the required Extract, Loudnorm,
            Peaks, Fingerprint, and Silence tabs, plus async progress and cancellation controls.
          </p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {featureCards.map((card) => (
            <article key={card.title} className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-4">
              <h3 className="font-semibold text-white">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/20">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Why this route exists</p>
        <div className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
          <p>
            This landing page stays static so it can load quickly, index cleanly, and point users directly into the
            tool. The heavy client-side workflow stays isolated on the workspace route where the actual processing UI
            matters.
          </p>
          {props.details ?? null}
        </div>
      </section>
    </main>
  );
}

function MetricCard(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{props.label}</p>
      <p className="mt-2 text-sm font-medium text-white">{props.value}</p>
    </div>
  );
}
