import React, { type ReactNode } from "react";

export function SectionCard(props: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/20">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">{props.eyebrow}</p>
      <div className="mt-3 space-y-2">
        <h2 className="text-2xl font-semibold text-white">{props.title}</h2>
        <p className="max-w-3xl text-sm text-slate-300">{props.description}</p>
      </div>
      <div className="mt-6">{props.children}</div>
    </section>
  );
}

export function ResultPane(props: { title: string; value: unknown }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-100">{props.title}</h3>
      </div>
      <pre className="max-h-[28rem] overflow-auto rounded-xl bg-black/40 p-4 text-xs text-cyan-100">
        {JSON.stringify(props.value, null, 2)}
      </pre>
    </div>
  );
}
