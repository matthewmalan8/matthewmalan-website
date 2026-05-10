import Link from "next/link";
import Layout from "@/components/Layout";

export default function AboutPage() {
  return (
    <Layout
      title="About"
      description="Matthew Malan is an e-commerce consultant and host of the Stay Hungry Podcast, helping founders scale companies to six figures and beyond."
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
                I&apos;m Matthew Malan — an e-commerce consultant who helps
                founders and operators scale their businesses to six figures
                and beyond. My approach is analytical and execution-focused:
                dig into the performance data, find what&apos;s actually
                working, and turn the insights into campaigns that drive
                measurable revenue.
              </p>
              <p>
                I currently serve as Marketing Manager at Vemo Smart Energy,
                where I lead an 8-person team responsible for digital
                acquisition across paid social, email, and content. By
                continuously testing creative, optimizing targeting, and
                analyzing campaign performance, we increased lead generation
                28% while reducing cost per acquisition by 13%.
              </p>
              <p>
                Tools like Google Analytics, Meta Ads, Google Ads, and CRM
                systems help guide decisions — but the real focus is building
                systems that consistently generate and convert demand. Earlier
                in my career, I built my foundation in SEO and marketing
                analytics, running keyword research, implementing analytics
                tooling, and improving search performance for content-driven
                growth.
              </p>
              <p>
                Outside the day job, I host the Stay Hungry Podcast — business
                strategies from the entrepreneurs and executives who built
                something worth studying.
              </p>
            </div>

            {/* RIGHT: photo + quick facts */}
            <aside className="lg:col-span-5 space-y-16">
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
                      Currently
                    </dt>
                    <dd className="mt-1 text-lg">
                      Marketing Manager, Vemo Smart Energy
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-semibold uppercase tracking-wider text-[var(--color-black)]/50">
                      Helps with
                    </dt>
                    <dd className="mt-1 text-lg">
                      E-commerce growth, paid acquisition, scaling to six
                      figures
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
              Marketing isn&apos;t magic — it&apos;s a system. Build the
              system, run the experiments, ship what works.
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
              Consulting, speaking, podcast guesting — drop me a note.
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
