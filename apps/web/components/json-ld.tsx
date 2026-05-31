const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AudioSuite",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "Extract audio, run EBU R128 loudness normalization, generate waveform peaks, Chromaprint fingerprints, and silence trimming online.",
  url: siteUrl,
  softwareHelp: `${siteUrl}/`,
  author: {
    "@type": "Person",
    name: "Chaitanya Prabuddha",
    url: "https://www.chaitanyaprabuddha.com",
  },
};

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
