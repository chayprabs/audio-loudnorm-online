import React, { type ReactNode } from "react";

export function SectionCard(props: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white/90 p-6 shadow-[0_12px_40px_rgba(28,25,23,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">{props.eyebrow}</p>
      <div className="mt-3 space-y-2">
        <h2 className="text-2xl font-semibold text-stone-950">{props.title}</h2>
        <p className="max-w-3xl text-sm leading-6 text-stone-600">{props.description}</p>
      </div>
      <div className="mt-6">{props.children}</div>
    </section>
  );
}

export function ResultPane(props: { title: string; value: unknown }) {
  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-stone-900">{props.title}</h3>
      </div>
      <pre className="max-h-[28rem] overflow-auto rounded-[1.1rem] bg-stone-950 p-4 text-xs text-stone-100">
        {JSON.stringify(props.value, null, 2)}
      </pre>
    </div>
  );
}
