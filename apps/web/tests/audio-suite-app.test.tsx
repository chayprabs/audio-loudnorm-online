import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AudioSuiteApp } from "../components/audio-suite-app";
import { ResultHighlights } from "../components/result-highlights";
import { WorkerStatus } from "../components/worker-status";

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

function healthFetchMock() {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ status: "ok", ffmpeg: true, fpcalc: true }),
  });
}

async function readFormData(body: BodyInit | null | undefined) {
  if (!(body instanceof FormData)) {
    throw new Error("Expected FormData body");
  }
  return Object.fromEntries([...body.entries()].map(([key, value]) => [key, value]));
}

describe("AudioSuiteApp", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("fetch", healthFetchMock());
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

  it("renders the required tabs", async () => {
    render(<AudioSuiteApp />);
    await waitFor(() => {
      expect(screen.getByText(/Worker online/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Extract" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Loudnorm" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Peaks" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fingerprint" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Silence" })).toBeInTheDocument();
  });

  it("renders local sample fixtures and lets the user select them", async () => {
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

      if (url.endsWith("/health")) {
        return { ok: true, json: async () => ({ status: "ok", ffmpeg: true, fpcalc: true }) };
      }

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

      if (url.endsWith("/health")) {
        return { ok: true, json: async () => ({ status: "ok", ffmpeg: true, fpcalc: true }) };
      }

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

  it("submits fingerprint compare fixtures without an explicit source selection", async () => {
    let submittedForm: Record<string, FormDataEntryValue> | null = null;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/health")) {
        return { ok: true, json: async () => ({ status: "ok", ffmpeg: true, fpcalc: true }) };
      }

      if (url.endsWith("/v1/fingerprint")) {
        submittedForm = await readFormData(init?.body);
        return { ok: true, json: async () => ({ job_id: "job-fp" }) };
      }

      if (url.endsWith("/v1/jobs/job-fp")) {
        return {
          ok: true,
          json: async () => ({
            id: "job-fp",
            feature: "fingerprint",
            status: "completed",
            progress: 100,
            result: { score: 0.97, algorithm: "chromaprint" },
            error: null,
            expires_at: "2026-12-31T00:00:00Z",
          }),
        };
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AudioSuiteApp />);
    fireEvent.click(screen.getByRole("button", { name: "Fingerprint" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Compare the fixture pair/i }));
    fireEvent.click(screen.getAllByRole("button", { name: /Generate fingerprint/i })[0]!);

    await waitFor(() => {
      expect(submittedForm).toMatchObject({
        compare_mode: "true",
        sample_id: "near-duplicate-a",
        sample_id_b: "near-duplicate-b",
        async_mode: "true",
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Chromaprint similarity score/i)).toBeInTheDocument();
    });
  });

  it("requires both uploads in fingerprint compare mode", async () => {
    render(<AudioSuiteApp />);
    fireEvent.click(screen.getByRole("button", { name: "Fingerprint" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Compare the fixture pair/i }));

    const dropzone = screen.getByText("Drop audio or video here").closest("label");
    const fileA = new File(["a"], "clip-a.wav", { type: "audio/wav" });
    fireEvent.drop(dropzone!, { dataTransfer: { files: [fileA] } });

    fireEvent.click(screen.getAllByRole("button", { name: /Generate fingerprint/i })[0]!);
    expect(await screen.findByText(/Compare mode with uploads requires both file A and file B/i)).toBeInTheDocument();
  });

  it("keeps file B when file A is uploaded and sends both files to the API", async () => {
    let submittedForm: Record<string, FormDataEntryValue> | null = null;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/health")) {
        return { ok: true, json: async () => ({ status: "ok", ffmpeg: true, fpcalc: true }) };
      }

      if (url.endsWith("/v1/fingerprint")) {
        submittedForm = await readFormData(init?.body);
        return { ok: true, json: async () => ({ job_id: "job-fp-upload" }) };
      }

      if (url.endsWith("/v1/jobs/job-fp-upload")) {
        return {
          ok: true,
          json: async () => ({
            id: "job-fp-upload",
            feature: "fingerprint",
            status: "completed",
            progress: 100,
            result: { score: 0.99 },
            error: null,
            expires_at: "2026-12-31T00:00:00Z",
          }),
        };
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AudioSuiteApp />);
    fireEvent.click(screen.getByRole("button", { name: "Fingerprint" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Compare the fixture pair/i }));

    const fileBInput = screen.getByLabelText(/Or upload file B/i);
    const fileA = new File(["a"], "clip-a.wav", { type: "audio/wav" });
    const fileB = new File(["b"], "clip-b.wav", { type: "audio/wav" });

    fireEvent.change(fileBInput, { target: { files: [fileB] } });

    const dropzone = screen.getByText("Drop audio or video here").closest("label");
    fireEvent.drop(dropzone!, { dataTransfer: { files: [fileA] } });

    fireEvent.click(screen.getAllByRole("button", { name: /Generate fingerprint/i })[0]!);

    await waitFor(() => {
      expect(submittedForm?.file).toBeInstanceOf(File);
      expect(submittedForm?.file_b).toBeInstanceOf(File);
      expect((submittedForm?.file as File).name).toBe("clip-a.wav");
      expect((submittedForm?.file_b as File).name).toBe("clip-b.wav");
      expect(submittedForm?.compare_mode).toBe("true");
    });
  });

  it("does not attach file_b when running loudnorm after a compare upload", async () => {
    let submittedForm: Record<string, FormDataEntryValue> | null = null;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/health")) {
        return { ok: true, json: async () => ({ status: "ok", ffmpeg: true, fpcalc: true }) };
      }

      if (url.endsWith("/v1/loudnorm")) {
        submittedForm = await readFormData(init?.body);
        return { ok: true, json: async () => ({ job_id: "job-ln" }) };
      }

      if (url.endsWith("/v1/jobs/job-ln")) {
        return {
          ok: true,
          json: async () => ({
            ...completedJob,
            id: "job-ln",
            feature: "loudnorm",
          }),
        };
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AudioSuiteApp />);
    fireEvent.click(screen.getByRole("button", { name: "Fingerprint" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Compare the fixture pair/i }));

    const fileBInput = screen.getByLabelText(/Or upload file B/i);
    fireEvent.change(fileBInput, { target: { files: [new File(["b"], "clip-b.wav", { type: "audio/wav" })] } });

    fireEvent.click(screen.getByRole("button", { name: "Loudnorm" }));
    selectDefaultSample();
    fireEvent.click(screen.getAllByRole("button", { name: /Run loudness normalization/i })[0]!);

    await waitFor(() => {
      expect(submittedForm?.sample_id).toBe("podcast-demo");
      expect(submittedForm?.file_b).toBeUndefined();
    });
  });

  it("submits extract settings with the selected sample", async () => {
    let submittedForm: Record<string, FormDataEntryValue> | null = null;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/health")) {
        return { ok: true, json: async () => ({ status: "ok", ffmpeg: true, fpcalc: true }) };
      }

      if (url.endsWith("/v1/extract")) {
        submittedForm = await readFormData(init?.body);
        return { ok: true, json: async () => ({ job_id: "job-ex" }) };
      }

      if (url.endsWith("/v1/jobs/job-ex")) {
        return {
          ok: true,
          json: async () => ({
            id: "job-ex",
            feature: "extract",
            status: "completed",
            progress: 100,
            result: { artifact_url: "/artifacts/out.wav" },
            error: null,
            expires_at: "2026-12-31T00:00:00Z",
          }),
        };
      }

      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AudioSuiteApp />);
    fireEvent.click(screen.getByRole("button", { name: "Extract" }));
    selectDefaultSample();
    fireEvent.click(screen.getAllByRole("button", { name: /Generate audio export/i })[0]!);

    await waitFor(() => {
      expect(submittedForm).toMatchObject({
        sample_id: "podcast-demo",
        output_format: "wav",
        sample_rate: "48000",
        downmix: "stereo",
        bit_depth: "24",
        async_mode: "true",
      });
    });
  });
});

describe("ResultHighlights", () => {
  it("renders fingerprint compare score", () => {
    render(<ResultHighlights result={{ score: 0.972, algorithm: "chromaprint" }} />);
    expect(screen.getByText(/Chromaprint similarity score/i)).toBeInTheDocument();
    expect(screen.getByText("0.972")).toBeInTheDocument();
  });

  it("renders silence range count", () => {
    render(<ResultHighlights result={{ ranges: [{ start: 0, end: 1 }, { start: 2, end: 3 }] }} />);
    expect(screen.getByText(/Detected silent regions/i)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});

describe("WorkerStatus", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows online status when health check succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: "ok", ffmpeg: true, fpcalc: true }),
      }),
    );

    render(<WorkerStatus />);
    expect(await screen.findByText(/Worker online · FFmpeg \+ Chromaprint ready/i)).toBeInTheDocument();
  });

  it("shows offline status when health check fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    render(<WorkerStatus />);
    expect(await screen.findByText(/Worker offline/i)).toBeInTheDocument();
  });
});
