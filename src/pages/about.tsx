import Link from "next/link";
import Layout from "@/components/Layout";

export default function AboutPage() {
  return (
    <Layout
      title="About"
      description="Matthew Malan is a public speaker and host of the Stay Hungry Podcast, based in Mesa, Arizona."
      path="/about/"
    >
      {/* TITLE + BIO + PHOTO */}
      <section className="bg-[var(--color-off-white)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-24 pb-12 lg:pt-32">
          <h1 className="font-[family-name:var(--font-display)] text-5xl sm:text-7xl tracking-tight">
            <span className="inline-block relative">
              About Matthew
              <span
                aria-hidden="true"
                className="absolute left-0 right-0 -bottom-1 lg:-bottom-2 h-2 lg:h-3 bg-[var(--color-yellow)]"
              />
            </span>
          </h1>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-10 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* LEFT: paragraphs */}
            <div className="lg:col-span-7 space-y-6 text-lg text-[var(--color-black)]/80 leading-relaxed">
              <p>
                I&apos;m Matthew Malan — a public speaker and the host of the
                Stay Hungry Podcast. I work with business leaders and
                e-commerce operators to help them build resilient teams, find
                their voice, and scale their companies past six figures.
              </p>
              <p>
                On stage and behind the mic, I&apos;m drawn to the same kinds
                of conversations: the ones that strip away the polish and get
                to what actually works. Most of my talks and episodes pull from
                the lessons of entrepreneurs, doctors, community leaders, and
                everyday people who&apos;ve done extraordinary things.
              </p>
              <p>
                I grew up with a debilitating stutter. Speaking in front of a
                classroom — let alone an arena — felt physically impossible
                for years. The story of how I got from there to here is the
                spine of one of my most-requested keynotes, and it&apos;s also
                the reason I care so much about helping other people find
                their voice in business and in life.
              </p>
              <p>
                When I&apos;m not on a stage or recording an episode,
                you&apos;ll find me in Mesa, Arizona — usually with a coffee,
                a book, and an unreasonable number of tabs open.
              </p>
            </div>

            {/* RIGHT: photo + quick facts */}
            <aside className="lg:col-span-5 space-y-8">
              <picture>
                <source
                  media="(max-width: 480px)"
                  srcSet="/images/matt-about-mobile.webp"
                  type="image/webp"
                />
                <img
                  src="/images/matt-about.webp"
                  alt="Matthew Malan, photographed in a relaxed studio portrait."
                  className="w-full h-auto rounded-2xl object-cover"
                  loading="eager"
                  decoding="async"
                />
              </picture>

              <div className="border-2 border-[var(--color-warm-gray)] rounded-2xl p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
                  Quick facts
                </p>
                <dl className="mt-6 space-y-6">
                  <div>
                    <dt className="text-sm font-semibold uppercase tracking-wider text-[var(--color-black)]/50">
                      Based in
                    </dt>
                    <dd className="mt-1 text-lg">Mesa, Arizona</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-semibold uppercase tracking-wider text-[var(--color-black)]/50">
                      Speaks about
                    </dt>
                    <dd className="mt-1 text-lg">
                      Leadership, resilience, communication, scaling e-commerce
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-semibold uppercase tracking-wider text-[var(--color-black)]/50">
                      Podcast
                    </dt>
                    <dd className="mt-1 text-lg">Stay Hungry Podcast</dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* PULL QUOTE */}
      <section className="bg-[var(--color-off-white)]">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 py-16 lg:py-24">
          <blockquote className="border-l-4 border-[var(--color-yellow)] pl-8 py-2">
            <p className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl leading-snug tracking-tight">
              The voice you&apos;re afraid to use is the one your business is
              waiting for.
            </p>
          </blockquote>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--color-off-white)]">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 pb-28 lg:pb-40">
          <div className="bg-[var(--color-black)] text-[var(--color-off-white)] rounded-2xl p-10 lg:p-14">
            <p className="font-[family-name:var(--font-display)] text-3xl lg:text-4xl tracking-tight">
              Want to work together?
            </p>
            <p className="mt-4 text-lg text-[var(--color-warm-gray)] max-w-xl">
              Speaking, podcast guesting, or something else — drop me a note.
            </p>
            <Link
              href="/contact/"
              className="mt-8 inline-flex items-center bg-[var(--color-yellow)] text-[var(--color-black)] px-7 py-4 text-base font-semibold rounded-full hover:bg-[#FFF04D] transition-colors"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
