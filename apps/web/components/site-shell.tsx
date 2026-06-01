import type { ReactNode } from "react";
import { Globe } from "lucide-react";

const GITHUB_REPO_URL = "https://github.com/chayprabs/audio-loudnorm-online";
const TWITTER_URL = "https://x.com/chayprabs";
const WEBSITE_URL = "https://www.chaitanyaprabuddha.com";

const SEO_LINE_ONE =
  "Extract audio from video, run EBU R128 loudness normalization, generate waveform peaks, and compare Chromaprint fingerprints online.";
const SEO_LINE_TWO =
  "Built for podcasters, YouTube editors, and archivists who need broadcast-safe loudness, silence trimming, and duplicate detection without local FFmpeg setup.";

type SiteShellProps = {
  children: ReactNode;
  showSeoBar?: boolean;
};

export function SiteShell({ children, showSeoBar = true }: SiteShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <a className="text-lg font-semibold tracking-tight text-stone-950" href="/">
            AudioSuite
          </a>
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="External links">
            <a
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-950"
              href={GITHUB_REPO_URL}
              rel="noreferrer"
              target="_blank"
            >
              <GithubIcon className="size-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <a
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-950"
              href={TWITTER_URL}
              rel="noreferrer"
              target="_blank"
              aria-label="Chaitanya on X"
            >
              <XIcon className="size-4" />
              <span className="hidden sm:inline">X</span>
            </a>
            <a
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-950"
              href={WEBSITE_URL}
              rel="noreferrer"
              target="_blank"
            >
              <Globe className="size-4" aria-hidden />
              <span className="hidden sm:inline">Website</span>
            </a>
          </nav>
        </div>
      </header>

      {showSeoBar ? (
        <section
          className="border-b border-stone-200 bg-white/90"
          aria-label="Product summary for search engines"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col justify-center gap-1 px-4 py-3 text-sm leading-relaxed text-stone-600 md:flex-row md:items-center md:justify-between md:gap-8 md:px-6 md:py-4">
            <p className="md:flex-1">{SEO_LINE_ONE}</p>
            <p className="md:flex-1 md:text-right">{SEO_LINE_TWO}</p>
          </div>
        </section>
      ) : null}

      <div className="flex-1">{children}</div>

      <footer className="mt-auto border-t border-stone-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-6 px-4 py-6 text-sm text-stone-600 md:px-6">
          <a className="underline-offset-4 hover:text-stone-950 hover:underline" href="/privacy">
            Privacy Policy
          </a>
          <a className="underline-offset-4 hover:text-stone-950 hover:underline" href="/terms">
            Terms &amp; Conditions
          </a>
        </div>
      </footer>
    </div>
  );
}

function GithubIcon(props: { className?: string }) {
  return (
    <svg
      className={props.className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function XIcon(props: { className?: string }) {
  return (
    <svg
      className={props.className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
