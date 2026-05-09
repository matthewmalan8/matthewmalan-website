import Link from "next/link";
import Layout from "@/components/Layout";

export default function AboutPage() {
  return (
    <Layout
      title="About"
      description="[Placeholder — write 1-2 sentences about Matthew once content is final]"
      path="/about/"
    >
      {/* FULL-WIDTH PHOTO */}
      <section className="bg-[var(--color-off-white)]">
        <picture>
          <source
            media="(max-width: 480px)"
            srcSet="/images/matt-about-mobile.webp"
            type="image/webp"
          />
          <img
            src="/images/matt-about.webp"
            alt="Matthew Malan, photographed in a relaxed studio portrait."
            className="w-full h-[50vh] sm:h-[60vh] lg:h-[70vh] object-cover"
            loading="eager"
            decoding="async"
          />
        </picture>
      </section>

      {/* TITLE + TWO COLUMN */}
      <section className="bg-[var(--color-off-white)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-12">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            {/* LEFT: paragraphs */}
            <div className="lg:col-span-7 space-y-6 text-lg text-[var(--color-black)]/80 leading-relaxed">
              <p>
                [First paragraph placeholder — open with the headline version of
                who you are and what you do. Two or three sentences max.]
              </p>
              <p>
                [Second paragraph placeholder — go a layer deeper. Talk about
                the kinds of audiences you work with and what you tend to cover.]
              </p>
              <p>
                [Third paragraph placeholder — your background and how you got
                here. The bits that explain the angle you bring.]
              </p>
              <p>
                [Fourth paragraph placeholder — optional. A bit of personality:
                what you're into outside of work, or what you're currently
                obsessed with.]
              </p>
            </div>

            {/* RIGHT: quick facts card */}
            <aside className="lg:col-span-5">
              <div className="border-2 border-[var(--color-warm-gray)] rounded-2xl p-8 lg:sticky lg:top-24">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
                  Quick facts
                </p>
                <dl className="mt-6 space-y-6">
                  <div>
                    <dt className="text-sm font-semibold uppercase tracking-wider text-[var(--color-black)]/50">
                      Based in
                    </dt>
                    <dd className="mt-1 text-lg">[City, Country]</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-semibold uppercase tracking-wider text-[var(--color-black)]/50">
                      Speaks about
                    </dt>
                    <dd className="mt-1 text-lg">
                      [Your 2-3 core topics, comma separated]
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-semibold uppercase tracking-wider text-[var(--color-black)]/50">
                      Podcast
                    </dt>
                    <dd className="mt-1 text-lg">[Podcast name]</dd>
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
              [A short, sharp pull quote that captures your point of view.
              One or two sentences.]
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
              className="mt-8 inline-flex items-center bg-[var(--color-yellow)] text-[var(--color-black)] px-7 py-4 text-base font-semibold rounded-full hover:bg-[var(--color-lime)] transition-colors"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
