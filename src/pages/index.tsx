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
      {/* HERO */}
      <section className="bg-[var(--color-black)] text-[var(--color-off-white)] min-h-screen -mt-16 pt-16 flex items-center">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-7">
            <h1 className="text-6xl sm:text-7xl lg:text-8xl leading-[0.9] tracking-tight">
              <span className="inline-block relative">
                Matthew Malan
                <span
                  aria-hidden="true"
                  className="absolute left-0 right-0 -bottom-2 lg:-bottom-3 h-3 lg:h-4 bg-[var(--color-yellow)]"
                />
              </span>
            </h1>

            <p className="mt-10 text-2xl sm:text-3xl text-[var(--color-off-white)] font-medium">
              Public speaker. Podcast host.
            </p>

            <p className="mt-6 text-lg sm:text-xl max-w-xl text-[var(--color-warm-gray)]">
              [Your one-line positioning statement goes here]
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/podcast/"
                className="inline-flex items-center bg-[var(--color-yellow)] text-[var(--color-black)] px-7 py-4 text-base font-semibold rounded-full hover:bg-[var(--color-lime)] transition-colors"
              >
                Listen to the podcast
              </Link>
              <Link
                href="/speaking/"
                className="inline-flex items-center border-2 border-[var(--color-off-white)] text-[var(--color-off-white)] px-7 py-4 text-base font-semibold rounded-full hover:bg-[var(--color-off-white)] hover:text-[var(--color-black)] transition-colors"
              >
                Book me to speak
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <picture>
              <source
                media="(max-width: 480px)"
                srcSet="/images/matt-hero-mobile.webp"
                type="image/webp"
              />
              <img
                src="/images/matt-hero.webp"
                alt="Portrait of Matthew Malan, public speaker and podcast host."
                className="w-full h-auto rounded-2xl object-cover"
                loading="eager"
                decoding="async"
              />
            </picture>
          </div>
        </div>
      </section>

      {/* ABOUT TEASER */}
      <section className="bg-[var(--color-off-white)] text-[var(--color-black)]">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 py-28 lg:py-40">
          <h2 className="text-5xl sm:text-7xl tracking-tight">
            <span className="inline-block relative">
              Hi, I&apos;m Matt.
              <span
                aria-hidden="true"
                className="absolute left-0 right-0 -bottom-1 lg:-bottom-2 h-2 lg:h-3 bg-[var(--color-lime)]"
              />
            </span>
          </h2>

          <p className="mt-12 text-xl lg:text-2xl text-[var(--color-black)]/80 leading-relaxed max-w-3xl">
            [2-3 sentences about what you do and who you help]
          </p>

          <Link
            href="/about/"
            className="mt-10 inline-flex items-center text-lg font-semibold text-[var(--color-black)] hover:text-[var(--color-yellow)] transition-colors"
          >
            More about me →
          </Link>
        </div>
      </section>

      {/* WHAT I DO */}
      <section className="bg-[var(--color-black)] text-[var(--color-off-white)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-28 lg:py-40">
          <h2 className="text-5xl sm:text-7xl tracking-tight">
            <span className="inline-block relative">
              What I do.
              <span
                aria-hidden="true"
                className="absolute left-0 right-0 -bottom-1 lg:-bottom-2 h-2 lg:h-3 bg-[var(--color-yellow)]"
              />
            </span>
          </h2>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
            <article className="bg-[var(--color-off-white)] text-[var(--color-black)] border border-[var(--color-warm-gray)] rounded-2xl p-10 lg:p-12">
              <h3 className="text-3xl lg:text-4xl">Speaking</h3>
              <p className="mt-6 text-lg text-[var(--color-black)]/70 leading-relaxed">
                [One sentence about your talks and topics]
              </p>
              <Link
                href="/speaking/"
                className="mt-10 inline-flex items-center text-base font-semibold text-[var(--color-black)] hover:text-[var(--color-yellow)] transition-colors"
              >
                See speaking topics →
              </Link>
            </article>

            <article className="bg-[var(--color-off-white)] text-[var(--color-black)] border border-[var(--color-warm-gray)] rounded-2xl p-10 lg:p-12">
              <h3 className="text-3xl lg:text-4xl">Podcast</h3>
              <p className="mt-6 text-lg text-[var(--color-black)]/70 leading-relaxed">
                [One sentence about your podcast]
              </p>
              <Link
                href="/podcast/"
                className="mt-10 inline-flex items-center text-base font-semibold text-[var(--color-black)] hover:text-[var(--color-yellow)] transition-colors"
              >
                Listen now →
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[var(--color-yellow)] text-[var(--color-black)]">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-28 lg:py-40 text-center">
          <h2 className="text-5xl sm:text-7xl lg:text-8xl tracking-tight">
            Let&apos;s work together.
          </h2>
          <p className="mt-8 text-xl lg:text-2xl text-[var(--color-black)]/80 max-w-2xl mx-auto">
            Book a keynote, come on the podcast, or just say hi.
          </p>
          <Link
            href="/contact/"
            className="mt-12 inline-flex items-center bg-[var(--color-black)] text-[var(--color-yellow)] px-8 py-5 text-lg font-semibold rounded-full hover:bg-[var(--color-off-white)] hover:text-[var(--color-black)] transition-colors"
          >
            Get in touch
          </Link>
        </div>
      </section>
    </Layout>
  );
}
