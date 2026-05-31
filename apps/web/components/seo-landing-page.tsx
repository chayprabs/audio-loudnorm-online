import { SiteShell } from "./site-shell";

type SeoLandingPageProps = {
  title: string;
  description: string;
};

export function SeoLandingPage(props: SeoLandingPageProps) {
  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-3xl px-4 py-12 md:px-6">
        <h1 className="text-3xl font-semibold text-stone-950">{props.title}</h1>
        <p className="mt-4 text-base leading-7 text-stone-600">{props.description}</p>
        <a
          className="mt-8 inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
          href="/"
        >
          Open AudioSuite
        </a>
      </section>
    </SiteShell>
  );
}
