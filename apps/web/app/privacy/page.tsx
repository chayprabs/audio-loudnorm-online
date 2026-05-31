import type { Metadata } from "next";
import { SiteShell } from "../../components/site-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for AudioSuite, the open-source online audio processing tool.",
};

const LAST_UPDATED = "May 31, 2026";

export default function PrivacyPage() {
  return (
    <SiteShell showSeoBar={false}>
      <article className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6 md:py-14">
        <h1 className="text-3xl font-semibold text-stone-950">Privacy Policy</h1>
        <p className="mt-2 text-sm text-stone-500">Last updated: {LAST_UPDATED}</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-stone-700">
          <section>
            <h2 className="text-lg font-semibold text-stone-950">1. Scope and who this applies to</h2>
            <p className="mt-2">
              This Privacy Policy describes how <strong>AudioSuite</strong> (“we”, “us”, “our”) handles information
              when you use a website or API deployment operated by the project maintainers (the “Service”). If you use
              a copy of AudioSuite run by someone else, that operator’s policy applies instead—we are not responsible
              for third-party deployments.
            </p>
            <p className="mt-2">
              By using the Service, you acknowledge this Policy. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">2. Information we process</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                <strong>Content you provide:</strong> audio/video files you upload, optional source URLs, and processing
                parameters (presets, formats, thresholds).
              </li>
              <li>
                <strong>Derived outputs:</strong> normalized audio, peaks JSON, PNG waveforms, fingerprints, silence
                ranges, and related artifacts generated to fulfill your request.
              </li>
              <li>
                <strong>Technical data:</strong> job identifiers, timestamps, request metadata, error messages, and
                standard server logs (such as IP address, user agent, and referrer) on hosted deployments.
              </li>
              <li>
                <strong>Communications:</strong> information you send when reporting issues or security concerns (for
                example, via GitHub).
              </li>
            </ul>
            <p className="mt-2">
              We do <strong>not</strong> intentionally log raw audio payload content in application logs. We do not
              require an account for the public playground. We do not use third-party advertising or cross-site tracking
              pixels in the open-source web app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">3. Why we process data (legal bases)</h2>
            <p className="mt-2">Where privacy laws require a legal basis, we rely on:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                <strong>Performance of a service</strong> you request (processing your file and returning results).
              </li>
              <li>
                <strong>Legitimate interests</strong> in operating, securing, and improving the Service (abuse prevention,
                debugging, capacity planning), balanced against your rights.
              </li>
              <li>
                <strong>Legal obligations</strong> where we must retain or disclose information under applicable law.
              </li>
              <li>
                <strong>Consent</strong> where required (for example, if optional features explicitly ask for consent).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">4. Retention and deletion</h2>
            <p className="mt-2">
              Uploads and generated artifacts are stored in ephemeral per-job storage. Default retention is approximately
              one hour after job creation (configurable by the operator). After expiry, files are deleted automatically
              by the worker cleanup process. Backups, if any, are the responsibility of the deployment operator.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">5. Sharing and international transfers</h2>
            <p className="mt-2">
              We do not sell your personal information. We may share limited data with:
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Infrastructure providers that host the Service (processors under their terms).</li>
              <li>Authorities when required by valid legal process.</li>
              <li>Advisers in connection with legal claims or security incidents, under confidentiality duties.</li>
            </ul>
            <p className="mt-2">
              If you access the Service from outside the country where servers are located, your information may be
              processed in that country or other jurisdictions that may have different data-protection laws. You use the
              Service at your own risk regarding cross-border transfer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">6. Security</h2>
            <p className="mt-2">
              We use reasonable technical measures (HTTPS where configured, ephemeral storage, access controls on
              artifacts, no intentional logging of media payloads). No method of transmission or storage is 100% secure.
              You are responsible for protecting credentials and infrastructure if you self-host.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">7. Your rights</h2>
            <p className="mt-2">
              Depending on your location (including the EEA, UK, Switzerland, India, Brazil, California, and other
              regions with privacy laws), you may have rights to access, correct, delete, restrict, or object to
              processing, and to data portability or withdraw consent. Because we typically do not maintain user
              accounts, we may not be able to identify you from a job ID alone—provide relevant details when contacting
              us.
            </p>
            <p className="mt-2">
              California residents: we do not sell personal information as defined under the CCPA/CPRA for monetary
              consideration. You may have rights to know, delete, and correct personal information subject to exceptions.
            </p>
            <p className="mt-2">
              EU/UK: you may lodge a complaint with your local supervisory authority. We encourage you to contact us
              first so we can try to resolve your concern.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">8. Children</h2>
            <p className="mt-2">
              The Service is not directed to children under 16 (or the age of digital consent in your country). We do
              not knowingly collect personal information from children. If you believe a child has provided content,
              contact us to request deletion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">9. Self-hosting</h2>
            <p className="mt-2">
              If you deploy AudioSuite yourself, you are the data controller (or equivalent) for your users. This
              Policy describes maintainer defaults for the reference deployment only.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">10. Changes</h2>
            <p className="mt-2">
              We may update this Policy by posting a revised version with a new “Last updated” date. Material changes may
              also be noted in the repository. Continued use after changes constitutes acceptance where permitted by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">11. Contact</h2>
            <p className="mt-2">
              Privacy questions or requests: open a GitHub issue or security advisory at{" "}
              <a
                className="text-stone-950 underline underline-offset-4"
                href="https://github.com/chayprabs/audio-loudnorm-online"
                rel="noreferrer"
                target="_blank"
              >
                github.com/chayprabs/audio-loudnorm-online
              </a>
              , or contact the maintainer via{" "}
              <a
                className="text-stone-950 underline underline-offset-4"
                href="https://www.chaitanyaprabuddha.com"
                rel="noreferrer"
                target="_blank"
              >
                chaitanyaprabuddha.com
              </a>
              .
            </p>
          </section>

          <section className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs leading-6 text-stone-600">
            <p>
              <strong>Important:</strong> This Policy is a general template for an open-source tool. It does not
              constitute legal advice and does not guarantee compliance in every jurisdiction. Consult qualified counsel
              for your situation, especially if you operate a commercial or high-volume public service.
            </p>
          </section>
        </div>
      </article>
    </SiteShell>
  );
}
