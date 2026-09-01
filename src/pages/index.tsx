import Layout from "@/components/Layout";
import { siteConfig } from "@/lib/seoConfig";

export default function Home() {
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.name,
    url: siteConfig.domain,
    sameAs: [
      "https://x.com/matthewmalan8",
      "https://www.linkedin.com/in/matthew-malan8/",
      "https://www.instagram.com/matthewmalan8/",
      "https://www.tiktok.com/@matthewmalan7",
    ],
  };

  return (
    <Layout
      path="/"
      title="I'll be back"
      description="Matthew Malan's site is on pause. Back soon."
      jsonLd={personJsonLd}
    >
      <section className="bg-[var(--color-black)] text-[var(--color-off-white)] min-h-screen flex items-center justify-center text-center">
        <div className="max-w-2xl mx-auto px-6 py-24">
          <h1 className="text-6xl sm:text-7xl lg:text-8xl leading-[0.9] tracking-tight">
            <span className="inline-block relative">
              I&apos;ll be back
              <span
                aria-hidden="true"
                className="absolute left-0 right-0 -bottom-2 lg:-bottom-3 h-3 lg:h-4 bg-[var(--color-yellow)]"
              />
            </span>
          </h1>
          <p className="mt-10 text-lg sm:text-xl text-[var(--color-warm-gray)]">
            The site is on pause for now.
          </p>
        </div>
      </section>
    </Layout>
  );
}
