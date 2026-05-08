import Link from "next/link";
import Layout from "@/components/Layout";
import { siteConfig } from "@/lib/seoConfig";

export default function Home() {
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.name,
    url: siteConfig.domain,
    jobTitle: "Public Speaker & Podcast Host",
    description: siteConfig.description,
    sameAs: [
      "https://twitter.com/matthewmalan",
      "https://linkedin.com/in/matthewmalan",
    ],
  };

  return (
    <Layout path="/" jsonLd={personJsonLd}>
      <section className="bg-[var(--color-off-white)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-24 pb-32 lg:pt-32 lg:pb-40">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
            Speaker · Host · Storyteller
          </p>
          <h1 className="mt-6 text-5xl sm:text-7xl lg:text-8xl leading-[0.95] tracking-tight max-w-5xl">
            Conversations that
            <span className="bg-[var(--color-yellow)] px-3 inline-block ml-2 -rotate-1">
              move people
            </span>{" "}
            forward.
          </h1>
          <p className="mt-8 text-lg lg:text-xl max-w-2xl text-[var(--color-black)]/70 leading-relaxed">
            I'm Matthew Malan — a public speaker and podcast host exploring
            leadership, creativity, and the work that matters. On stage and
            behind the mic, I help people think harder and speak truer.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/speaking/"
              className="inline-flex items-center bg-[var(--color-black)] text-[var(--color-yellow)] px-7 py-4 text-base font-semibold rounded-full hover:bg-[var(--color-lime)] hover:text-[var(--color-black)] transition-colors"
            >
              Book a talk
            </Link>
            <Link
              href="/podcast/"
              className="inline-flex items-center border-2 border-[var(--color-black)] text-[var(--color-black)] px-7 py-4 text-base font-semibold rounded-full hover:bg-[var(--color-black)] hover:text-[var(--color-yellow)] transition-colors"
            >
              Listen to the podcast
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-black)] text-[var(--color-off-white)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div>
              <p className="font-[family-name:var(--font-display)] text-6xl text-[var(--color-yellow)]">
                100+
              </p>
              <p className="mt-3 text-[var(--color-warm-gray)]">
                Keynotes delivered to leaders, builders, and teams across four
                continents.
              </p>
            </div>
            <div>
              <p className="font-[family-name:var(--font-display)] text-6xl text-[var(--color-yellow)]">
                3M
              </p>
              <p className="mt-3 text-[var(--color-warm-gray)]">
                Podcast downloads from listeners who want sharper conversations,
                not louder ones.
              </p>
            </div>
            <div>
              <p className="font-[family-name:var(--font-display)] text-6xl text-[var(--color-yellow)]">
                12
              </p>
              <p className="mt-3 text-[var(--color-warm-gray)]">
                Years on stage, on air, and in rooms where the hard questions
                live.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-off-white)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 lg:py-32">
          <h2 className="text-4xl lg:text-6xl tracking-tight max-w-3xl">
            Three ways to{" "}
            <span className="bg-[var(--color-lime)] px-2">work together</span>.
          </h2>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/speaking/"
              className="group block p-8 border-2 border-[var(--color-black)] rounded-2xl hover:bg-[var(--color-yellow)] transition-colors"
            >
              <p className="font-[family-name:var(--font-display)] text-2xl">
                Keynotes
              </p>
              <p className="mt-3 text-[var(--color-black)]/70">
                Stage-ready talks for conferences, summits, and offsites.
              </p>
              <p className="mt-6 text-sm font-semibold">Explore speaking →</p>
            </Link>
            <Link
              href="/podcast/"
              className="group block p-8 border-2 border-[var(--color-black)] rounded-2xl hover:bg-[var(--color-yellow)] transition-colors"
            >
              <p className="font-[family-name:var(--font-display)] text-2xl">
                The Podcast
              </p>
              <p className="mt-3 text-[var(--color-black)]/70">
                Long-form interviews with operators, artists, and outliers.
              </p>
              <p className="mt-6 text-sm font-semibold">Listen now →</p>
            </Link>
            <Link
              href="/contact/"
              className="group block p-8 border-2 border-[var(--color-black)] rounded-2xl hover:bg-[var(--color-yellow)] transition-colors"
            >
              <p className="font-[family-name:var(--font-display)] text-2xl">
                Collaborate
              </p>
              <p className="mt-3 text-[var(--color-black)]/70">
                Workshops, advisory work, and custom engagements.
              </p>
              <p className="mt-6 text-sm font-semibold">Get in touch →</p>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
