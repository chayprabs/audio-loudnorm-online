import type { Metadata } from "next";
import { SiteShell } from "../../components/site-shell";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for using AudioSuite.",
};

export default function TermsPage() {
  return (
    <SiteShell showSeoBar={false}>
      <article className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6 md:py-14">
        <h1 className="text-3xl font-semibold text-stone-950">Terms &amp; Conditions</h1>
        <p className="mt-2 text-sm text-stone-500">Last updated: May 31, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-stone-700">
          <section>
            <h2 className="text-lg font-semibold text-stone-950">Acceptance</h2>
            <p className="mt-2">
              By using AudioSuite (hosted or self-hosted), you agree to these terms. If you do not agree, do not use the
              service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">Service description</h2>
            <p className="mt-2">
              AudioSuite provides online audio extraction, loudness normalization, waveform generation, fingerprinting,
              and silence tools on an &quot;as is&quot; and &quot;as available&quot; basis. Results depend on input quality,
              codecs, and runtime configuration.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">Your responsibilities</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>You must have the right to upload or process any media you submit.</li>
              <li>You must not use the service for unlawful content, malware distribution, or abuse of shared infrastructure.</li>
              <li>You are responsible for reviewing outputs before broadcast or publication.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">Disclaimer of warranties</h2>
            <p className="mt-2">
              THE SOFTWARE IS PROVIDED WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
              WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. LOUDNESS TARGETS
              AND FINGERPRINT SCORES ARE TECHNICAL ESTIMATES, NOT LEGAL OR BROADCAST COMPLIANCE CERTIFICATIONS.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">Limitation of liability</h2>
            <p className="mt-2">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE AUTHORS AND CONTRIBUTORS SHALL NOT BE LIABLE FOR
              ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR
              GOODWILL, ARISING FROM YOUR USE OF AUDIOSUITE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">Open-source license</h2>
            <p className="mt-2">
              Source code is licensed under AGPL-3.0-only unless otherwise noted in the repository. Use of the source
              code is also governed by that license.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">Changes</h2>
            <p className="mt-2">
              These terms may be updated from time to time. Continued use after changes are posted constitutes acceptance
              of the revised terms.
            </p>
          </section>
        </div>
      </article>
    </SiteShell>
  );
}
