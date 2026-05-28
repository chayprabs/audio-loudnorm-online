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
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <header className="overflow-hidden rounded-[2rem] border border-stone-200/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(245,245,244,0.88))] p-6 shadow-[0_24px_80px_rgba(28,25,23,0.08)] backdrop-blur md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-stone-500">{props.eyebrow}</p>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-stone-950 md:text-6xl">{props.title}</h1>
            <p className="text-base leading-7 text-stone-600 md:text-lg">{props.description}</p>
          </div>
          <div className="grid gap-3 text-sm text-stone-600 md:grid-cols-3">
            <MetricCard label="Presets" value="Spotify, Apple, YouTube, EBU" />
            <MetricCard label="Artifacts" value="WAV, MP3, AAC, Opus, FLAC" />
            <MetricCard label="Flow" value="Source, tool, result in one direct path" />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            className="inline-flex items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
            href={props.ctaHref ?? "/workspace"}
          >
            {props.ctaLabel ?? "Open workspace"}
          </a>
          <a
            className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
            href={props.secondaryHref ?? "/waveform-generator"}
          >
            {props.secondaryLabel ?? "View SEO routes"}
          </a>
        </div>
      </header>

      <section className="rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-[0_12px_40px_rgba(28,25,23,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">What ships in the workspace</p>
        <div className="mt-3 space-y-2">
          <h2 className="text-2xl font-semibold text-stone-950">Production audio tooling without extra setup</h2>
          <p className="max-w-3xl text-sm leading-6 text-stone-600">
            The interactive workspace lives at <code>/workspace</code> and includes the required Extract, Loudnorm,
            Peaks, Fingerprint, and Silence tabs, plus async progress and cancellation controls.
          </p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {featureCards.map((card, index) => (
            <article key={card.title} className="rounded-[1.5rem] border border-stone-200 bg-stone-50/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Step {index + 1}</p>
              <h3 className="mt-2 font-semibold text-stone-950">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-stone-600">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-[0_12px_40px_rgba(28,25,23,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Why this route exists</p>
        <div className="mt-3 space-y-3 text-sm leading-6 text-stone-600">
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
    <div className="rounded-2xl border border-stone-200 bg-white/75 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{props.label}</p>
      <p className="mt-2 text-sm font-medium text-stone-900">{props.value}</p>
    </div>
  );
}
