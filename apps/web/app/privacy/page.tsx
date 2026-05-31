import type { Metadata } from "next";
import { SiteShell } from "../../components/site-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for AudioSuite, the open-source online audio processing tool.",
};

export default function PrivacyPage() {
  return (
    <SiteShell showSeoBar={false}>
      <article className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6 md:py-14">
        <h1 className="text-3xl font-semibold text-stone-950">Privacy Policy</h1>
        <p className="mt-2 text-sm text-stone-500">Last updated: May 31, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-stone-700">
          <section>
            <h2 className="text-lg font-semibold text-stone-950">Summary</h2>
            <p className="mt-2">
              AudioSuite processes audio and video files you upload or provide by URL. Files are handled on the server
              only for the duration needed to complete your request and are not sold or used for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">What we collect</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Uploaded media and optional source URLs you submit for processing.</li>
              <li>Technical metadata such as request timestamps, job identifiers, and error messages.</li>
              <li>Standard web server logs (IP address, user agent) when you use a hosted deployment.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">What we do not do</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>We do not log raw audio content in application logs.</li>
              <li>We do not require an account for the public playground workflow.</li>
              <li>We do not embed third-party advertising or cross-site tracking scripts in the web app.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">Retention</h2>
            <p className="mt-2">
              Generated artifacts and uploads are stored in ephemeral per-job directories with a documented time-to-live
              (default one hour on self-hosted deployments). After expiry, files are deleted automatically.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">Self-hosting</h2>
            <p className="mt-2">
              If you run AudioSuite on your own infrastructure, you are the data controller. This policy describes the
              software&apos;s defaults; your deployment may impose additional policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">Contact</h2>
            <p className="mt-2">
              Questions about privacy may be directed via the repository issue tracker at{" "}
              <a
                className="text-stone-950 underline underline-offset-4"
                href="https://github.com/chayprabs/audio-loudnorm-online/issues"
                rel="noreferrer"
                target="_blank"
              >
                github.com/chayprabs/audio-loudnorm-online
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </SiteShell>
  );
}
