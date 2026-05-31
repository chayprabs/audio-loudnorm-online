import type { Metadata } from "next";
import { SiteShell } from "../../components/site-shell";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for using AudioSuite.",
};

const LAST_UPDATED = "May 31, 2026";

export default function TermsPage() {
  return (
    <SiteShell showSeoBar={false}>
      <article className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6 md:py-14">
        <h1 className="text-3xl font-semibold text-stone-950">Terms &amp; Conditions</h1>
        <p className="mt-2 text-sm text-stone-500">Last updated: {LAST_UPDATED}</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-stone-700">
          <section>
            <h2 className="text-lg font-semibold text-stone-950">1. Agreement to terms</h2>
            <p className="mt-2">
              These Terms &amp; Conditions (“Terms”) govern your access to and use of <strong>AudioSuite</strong>—the
              website, API, and related services (collectively, the “Service”) made available by the project maintainers.
              By accessing or using the Service, you agree to these Terms and our{" "}
              <a className="underline underline-offset-4" href="/privacy">
                Privacy Policy
              </a>
              . If you do not agree, you must not use the Service.
            </p>
            <p className="mt-2">
              If you use the Service on behalf of an organization, you represent that you have authority to bind that
              organization, and “you” includes that organization.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">2. Eligibility</h2>
            <p className="mt-2">
              You must be at least 16 years old (or the age of majority in your jurisdiction, whichever is higher) and
              legally able to enter a binding contract. The Service is not intended for children. You may not use the
              Service if you are barred under applicable law or export control regulations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">3. The Service</h2>
            <p className="mt-2">
              AudioSuite provides automated tools for audio extraction, loudness normalization (including EBU R128-style
              processing), waveform peaks, Chromaprint-style fingerprinting, and silence detection. The Service is
              provided on an <strong>“AS IS”</strong> and <strong>“AS AVAILABLE”</strong> basis. Outputs depend on input
              quality, codecs, settings, and third-party components (such as FFmpeg and Chromaprint).
            </p>
            <p className="mt-2">
              <strong>No professional advice.</strong> Results are technical estimates only. They are not legal,
              financial, broadcast-compliance, platform-compliance, or engineering certifications. You alone decide
              whether outputs are suitable for publication, distribution, or monetization.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">4. Your content and responsibilities</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                You retain ownership of media you submit. You grant us a limited, non-exclusive, royalty-free license to
                host, process, transform, and temporarily store your content solely to operate the Service and return
                results to you.
              </li>
              <li>
                You represent that you have all rights, licenses, and consents needed to upload, process, and download
                content, and that your use does not infringe intellectual property, privacy, publicity, or other rights.
              </li>
              <li>
                You are solely responsible for reviewing outputs before use, broadcast, or distribution.
              </li>
              <li>
                You must not submit unlawful content, malware, content that exploits minors, or content intended to
                harass, defame, or harm others.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">5. Acceptable use</h2>
            <p className="mt-2">You agree not to:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Abuse, overload, or attempt to disrupt the Service (including automated scraping beyond fair use).</li>
              <li>Circumvent security, access controls, or rate limits.</li>
              <li>Reverse engineer the Service except where applicable law expressly permits.</li>
              <li>Use the Service in violation of export, sanctions, or anti-spam laws.</li>
              <li>Imply endorsement by maintainers without written permission.</li>
            </ul>
            <p className="mt-2">
              We may suspend or terminate access, remove content, or report activity to authorities if we reasonably
              believe you violated these Terms or pose risk to the Service or others.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">6. Intellectual property</h2>
            <p className="mt-2">
              The AudioSuite name, branding, documentation, and site design are protected by applicable intellectual
              property laws. Open-source components are licensed as stated in the repository (see Section 12).
            </p>
            <p className="mt-2">
              <strong>Copyright complaints.</strong> If you believe content processed through the Service infringes your
              copyright, contact us with identification of the work, the material, your contact information, a good-faith
              statement, and your signature (physical or electronic). We may remove or disable access to material and
              terminate repeat infringers where appropriate.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">7. Disclaimer of warranties</h2>
            <p className="mt-2 uppercase">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE AND ALL OUTPUTS ARE PROVIDED “AS IS” AND “AS
              AVAILABLE” WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING
              WITHOUT LIMITATION IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE,
              NON-INFRINGEMENT, ACCURACY, QUIET ENJOYMENT, AND ANY WARRANTIES ARISING FROM COURSE OF DEALING OR USAGE OF
              TRADE.
            </p>
            <p className="mt-2 uppercase">
              WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, FREE OF HARMFUL COMPONENTS,
              OR THAT LOUDNESS, FINGERPRINT, OR SILENCE RESULTS WILL MEET ANY PLATFORM, REGULATORY, OR BROADCAST STANDARD
              (INCLUDING SPOTIFY, APPLE, YOUTUBE, EBU, FCC, OR ITU REQUIREMENTS).
            </p>
            <p className="mt-2">
              Some jurisdictions do not allow exclusion of certain warranties; in those jurisdictions, exclusions apply to
              the fullest extent permitted.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">8. Limitation of liability</h2>
            <p className="mt-2 uppercase">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE MAINTAINERS, CONTRIBUTORS,
              LICENSORS, OR SUPPLIERS OF AUDIOSUITE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
              EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, GOODWILL, BUSINESS INTERRUPTION, OR
              REPUTATIONAL HARM, ARISING OUT OF OR RELATED TO THE SERVICE OR THESE TERMS, WHETHER BASED ON WARRANTY,
              CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR ANY OTHER THEORY, EVEN IF ADVISED OF THE
              POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="mt-2 uppercase">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, OUR TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT
              OF OR RELATING TO THE SERVICE OR THESE TERMS SHALL NOT EXCEED THE GREATER OF (A) USD $100 OR (B) THE AMOUNT
              YOU PAID US FOR THE SERVICE IN THE TWELVE (12) MONTHS BEFORE THE EVENT GIVING RISE TO LIABILITY (IF ANY).
            </p>
            <p className="mt-2">
              Nothing in these Terms limits liability that cannot be limited under applicable law (such as fraud, wilful
              misconduct, or death/personal injury caused by negligence where such limitation is prohibited).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">9. Indemnification</h2>
            <p className="mt-2">
              You agree to defend, indemnify, and hold harmless the maintainers, contributors, and service providers
              from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable
              attorneys’ fees) arising out of or related to: (a) your content or use of outputs; (b) your violation of
              these Terms or applicable law; (c) your infringement of third-party rights; or (d) your operation of a
              self-hosted deployment that you make available to others. We may assume exclusive defense of any matter
              subject to indemnification at your expense if we choose.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">10. Release</h2>
            <p className="mt-2">
              To the fullest extent permitted by law, you release the maintainers and contributors from claims, demands,
              and damages of every kind arising out of or connected with disputes between you and third parties relating
              to content you process through the Service. If you are a California resident, you waive California Civil
              Code §1542 to the extent permitted (and any similar limitation in other jurisdictions).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">11. Dispute resolution and governing law</h2>
            <p className="mt-2">
              <strong>Governing law.</strong> These Terms are governed by the laws of <strong>India</strong>, without
              regard to conflict-of-law rules that would apply another jurisdiction’s laws, except where mandatory
              consumer protection rules in your country of residence require otherwise.
            </p>
            <p className="mt-2">
              <strong>Informal resolution.</strong> Before filing a claim, you agree to contact us and attempt good-faith
              informal resolution for at least thirty (30) days.
            </p>
            <p className="mt-2">
              <strong>Arbitration (where permitted).</strong> Except where prohibited by mandatory law, disputes that
              cannot be resolved informally shall be resolved by binding arbitration in Bengaluru, Karnataka, India, under
              rules of the Indian Arbitration and Conciliation Act, 1996 (as amended), in English, before a single
              arbitrator. Judgment on the award may be entered in any court of competent jurisdiction.
            </p>
            <p className="mt-2">
              <strong>Class action waiver.</strong> To the fullest extent permitted by law, you bring claims only in
              your individual capacity and not as a plaintiff or class member in any class, collective, or representative
              proceeding.
            </p>
            <p className="mt-2">
              <strong>Courts.</strong> If arbitration is unenforceable for a particular claim, the courts located in
              Bengaluru, Karnataka, India shall have exclusive jurisdiction, and you consent to personal jurisdiction
              there, subject to mandatory consumer rights in your home country.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">12. Open-source software license</h2>
            <p className="mt-2">
              Source code for AudioSuite is licensed under the <strong>GNU Affero General Public License v3.0</strong>{" "}
              (“AGPL-3.0”) unless otherwise noted in the repository. Your use of the source code is governed by the AGPL
              and not by these Terms. These Terms govern the hosted Service experience (uploads, processing, and site
              use). See the repository <code>LICENSE</code> and <code>NOTICE</code> files.
            </p>
            <p className="mt-2">
              If you operate a network service based on the software, AGPL obligations may require you to offer
              corresponding source to users who interact with your modified version over a network.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">13. Third-party services and links</h2>
            <p className="mt-2">
              The Service may process URLs you supply or link to third-party sites (GitHub, social profiles, etc.). We do
              not control third-party services and are not responsible for their content, policies, or practices.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">14. Force majeure</h2>
            <p className="mt-2">
              We are not liable for failure or delay due to events beyond reasonable control, including natural disasters,
              war, terrorism, labor disputes, internet failures, power outages, government actions, or failures of
              hosting or CDN providers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">15. Changes and termination</h2>
            <p className="mt-2">
              We may modify the Service or these Terms at any time by posting updated Terms with a new “Last updated”
              date. Continued use after changes constitutes acceptance where permitted by law. We may suspend or
              discontinue the Service at any time without liability.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">16. Miscellaneous</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                <strong>Severability:</strong> If any provision is invalid, the remainder stays in effect.
              </li>
              <li>
                <strong>No waiver:</strong> Failure to enforce a provision is not a waiver.
              </li>
              <li>
                <strong>Assignment:</strong> You may not assign these Terms without consent; we may assign them in
                connection with a reorganization or transfer.
              </li>
              <li>
                <strong>Entire agreement:</strong> These Terms and the Privacy Policy are the entire agreement regarding
                the Service (excluding the AGPL for software).
              </li>
              <li>
                <strong>Language:</strong> These Terms are drafted in English. Translations are for convenience only.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-950">17. Contact</h2>
            <p className="mt-2">
              Legal or Terms inquiries:{" "}
              <a
                className="text-stone-950 underline underline-offset-4"
                href="https://github.com/chayprabs/audio-loudnorm-online/issues"
                rel="noreferrer"
                target="_blank"
              >
                GitHub Issues
              </a>
              ,{" "}
              <a
                className="text-stone-950 underline underline-offset-4"
                href="https://github.com/chayprabs/audio-loudnorm-online/security/advisories/new"
                rel="noreferrer"
                target="_blank"
              >
                Security Advisories
              </a>
              , or{" "}
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

          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-stone-700">
            <p>
              <strong>Important:</strong> These Terms are designed to limit risk for an open-source tool operator but{" "}
              <strong>cannot guarantee</strong> you will never face a lawsuit in any country. Laws vary worldwide.
              Consult a qualified attorney in your jurisdiction before relying on this document for commercial or
              high-risk use.
            </p>
          </section>
        </div>
      </article>
    </SiteShell>
  );
}
