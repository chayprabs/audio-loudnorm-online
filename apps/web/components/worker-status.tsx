"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, WifiOff } from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_AUDIO_SUITE_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

type WorkerHealth = {
  status?: string;
  ffmpeg?: boolean;
  fpcalc?: boolean;
};

export function WorkerStatus() {
  const [state, setState] = useState<"checking" | "online" | "offline">("checking");
  const [health, setHealth] = useState<WorkerHealth | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const response = await fetch(`${API_BASE_URL}/health`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("unhealthy");
        }
        const payload = (await response.json()) as WorkerHealth;
        if (!cancelled) {
          setHealth(payload);
          setState(payload.status === "ok" ? "online" : "offline");
        }
      } catch {
        if (!cancelled) {
          setHealth(null);
          setState("offline");
        }
      }
    }

    void check();
    const timer = window.setInterval(() => void check(), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  if (state === "checking") {
    return (
      <span className="inline-flex items-center gap-2 text-xs text-stone-500">
        <LoaderCircle className="size-3.5 animate-spin" />
        Checking worker…
      </span>
    );
  }

  if (state === "offline") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
        <WifiOff className="size-3.5" />
        Worker offline — start the API at {API_BASE_URL}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
      <CheckCircle2 className="size-3.5" />
      Worker online
      {health?.ffmpeg && health?.fpcalc ? " · FFmpeg + Chromaprint ready" : ""}
    </span>
  );
}
