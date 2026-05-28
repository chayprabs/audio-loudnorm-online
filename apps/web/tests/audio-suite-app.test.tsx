import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { AudioSuiteApp } from "../components/audio-suite-app";

describe("AudioSuiteApp", () => {
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

    expect(screen.getByText("voiceover.mp3")).toBeInTheDocument();
  });
});
