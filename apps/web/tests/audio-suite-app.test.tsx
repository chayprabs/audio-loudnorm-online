import React from "react";
import { render, screen } from "@testing-library/react";

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
});
