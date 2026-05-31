import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AudioSuiteApp } from "../components/audio-suite-app";

const runningJob = {
  id: "job-1",
  feature: "loudnorm",
  status: "running",
  progress: 40,
  result: null,
  error: null,
  expires_at: "2026-12-31T00:00:00Z",
};

const completedJob = {
  ...runningJob,
  status: "completed",
  progress: 100,
  result: {
    output_url: "/artifacts/out.wav",
    report_url: "/artifacts/report.json",
  },
};

const cancelledJob = {
  ...runningJob,
  status: "cancelled",
  progress: 40,
  result: null,
};

describe("AudioSuiteApp", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: "ok", ffmpeg: true, fpcalc: true }),
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("requires a source before running a tool", async () => {
    render(<AudioSuiteApp />);
    fireEvent.click(screen.getAllByRole("button", { name: /Run loudness normalization/i })[0]!);
    expect(await screen.findByText(/Choose a file, paste a source URL, or select a sample/i)).toBeInTheDocument();
  });

  it("renders the required tabs", () => {
    render(<AudioSuiteApp />);
    expect(screen.getByRole("button", { name: "Extract" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Loudnorm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Peaks" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fingerprint" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Silence" })).toBeInTheDocument();
  });

  it("renders local sample fixtures and lets the user select them", () => {
    render(<AudioSuiteApp />);
    const button = screen.getByRole("button", { name: /Voiceover with silence/i });
    fireEvent.click(button);
    expect(button).toHaveClass("border-cyan-300/60");
  });

  it("accepts a dropped file in the upload area", () => {
    render(<AudioSuiteApp />);
    const dropzone = screen.getByText("Drop audio or video here").closest("label");
    const file = new File(["demo"], "voiceover.mp3", { type: "audio/mpeg" });

    expect(dropzone).not.toBeNull();
    fireEvent.drop(dropzone!, { dataTransfer: { files: [file] } });

    expect(screen.getAllByText("voiceover.mp3").length).toBeGreaterThan(0);
  });

  function selectDefaultSample() {
    fireEvent.click(screen.getByRole("button", { name: /Podcast clip/i }));
  }

  it("prefixes artifact links with the API base URL", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.endsWith("/v1/loudnorm")) {
        return {
          ok: true,
          json: async () => ({ job_id: "job-1" }),
        };
      }

      if (url.endsWith("/v1/jobs/job-1")) {
        return {
          ok: true,
          json: async () => completedJob,
        };
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AudioSuiteApp />);
    selectDefaultSample();
    fireEvent.click(screen.getAllByRole("button", { name: /Run loudness normalization/i })[0]!);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /output url/i })).toHaveAttribute(
        "href",
        "http://localhost:8000/artifacts/out.wav",
      );
      expect(screen.getByRole("link", { name: /report url/i })).toHaveAttribute(
        "href",
        "http://localhost:8000/artifacts/report.json",
      );
    });
  });

  it("cancels an in-flight job without overwriting the cancelled status", async () => {
    let pollCount = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/v1/loudnorm")) {
        return {
          ok: true,
          json: async () => ({ job_id: "job-1" }),
        };
      }

      if (url.endsWith("/v1/jobs/job-1/cancel") && init?.method === "POST") {
        return {
          ok: true,
          json: async () => cancelledJob,
        };
      }

      if (url.endsWith("/v1/jobs/job-1")) {
        pollCount += 1;
        if (pollCount === 1) {
          return {
            ok: true,
            json: async () => runningJob,
          };
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
        return {
          ok: true,
          json: async () => ({ ...runningJob, progress: 80 }),
        };
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AudioSuiteApp />);
    selectDefaultSample();
    fireEvent.click(screen.getAllByRole("button", { name: /Run loudness normalization/i })[0]!);

    const cancelButton = await screen.findByRole("button", { name: /Cancel job/i });
    await waitFor(() => expect(cancelButton).not.toBeDisabled());
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:8000/v1/jobs/job-1/cancel",
        expect.objectContaining({ method: "POST" }),
      );
      expect(screen.getAllByText("cancelled").length).toBeGreaterThan(0);
    });
  });
});
