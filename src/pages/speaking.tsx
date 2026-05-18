import Link from "next/link";
import Layout from "@/components/Layout";

const topics = [
  {
    title: "From Stutter to Stage",
    description:
      "The story of how I went from a debilitating childhood stutter to speaking on stages around the world — and the universal lessons it taught me about resilience, the human spirit, and finding the voice you didn't know you had.",
    duration: "45 min keynote",
  },
  {
    title: "Scale to Six Figures",
    description:
      "A practical playbook for e-commerce operators and online founders ready to break past plateaus. Covers the offer, the funnel, the team, and the mindset shifts that separate side hustles from real businesses.",
    duration: "60 min keynote or 90 min workshop",
  },
];

const stages = [
  {
    name: "Shopify Unite",
    logo: "https://cdn.simpleicons.org/shopify/95BF47",
  },
  {
    name: "BigCommerce Make It Big",
    logo: "https://cdn.simpleicons.org/bigcommerce/121118",
  },
  { name: "TEDx Phoenix", logo: "https://cdn.simpleicons.org/ted/E62B1E" },
  {
    name: "Stripe Sessions",
    logo: "https://cdn.simpleicons.org/stripe/635BFF",
  },
  {
    name: "HubSpot INBOUND",
    logo: "https://cdn.simpleicons.org/hubspot/FF7A59",
  },
  {
    name: "Y Combinator Demo Day",
    logo: "https://cdn.simpleicons.org/ycombinator/F26625",
  },
];

export default function SpeakingPage() {
  return (
    <Layout
      title="Speaking"
      description="Keynotes on resilience, the human spirit, and scaling e-commerce businesses by Matthew Malan."
      path="/speaking/"
      ogImage="/og/speaking.png"
    >
      {/* HERO */}
      <section className="bg-[var(--color-off-white)] text-[var(--color-black)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-24 pb-20 lg:pt-32 lg:pb-28">
          <h1 className="text-6xl sm:text-8xl lg:text-[10rem] leading-[0.9] tracking-tight">
            <span className="inline-block relative">
              Speaking
              <span
                aria-hidden="true"
                className="absolute left-0 right-0 -bottom-2 lg:-bottom-3 h-3 lg:h-4 bg-[var(--color-yellow)]"
              />
            </span>
          </h1>
          <p className="mt-12 text-xl lg:text-2xl max-w-2xl text-[var(--color-black)]/70">
            Keynotes on resilience, the human spirit, and what it really takes
            to scale a business to six figures and beyond.
          </p>
        </div>
      </section>

      {/* TOPIC CARDS */}
      <section className="bg-[var(--color-off-white)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pb-24 lg:pb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topics.map((t, i) => (
              <article
                key={i}
                className="bg-[var(--color-off-white)] border-2 border-[var(--color-warm-gray)] rounded-2xl p-8 lg:p-10 flex flex-col"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
                  Topic 0{i + 1}
                </p>
                <h2 className="mt-4 text-3xl lg:text-4xl tracking-tight">
                  <span className="inline-block relative">
                    {t.title}
                    <span
                      aria-hidden="true"
                      className="absolute left-0 right-0 -bottom-1 h-2 bg-[var(--color-yellow)]"
                    />
                  </span>
                </h2>
                <p className="mt-6 text-base text-[var(--color-black)]/70 leading-relaxed flex-1">
                  {t.description}
                </p>
                <p className="mt-8 text-sm font-semibold uppercase tracking-wider text-[var(--color-black)]/60">
                  {t.duration}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PAST STAGES */}
      <section className="bg-[var(--color-black)] text-[var(--color-off-white)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-yellow)]">
            Past stages
          </p>
          <h2 className="mt-4 text-3xl lg:text-5xl tracking-tight max-w-2xl">
            A few of the rooms I&apos;ve had the privilege of speaking in.
          </h2>

          <ul className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {stages.map((s) => (
              <li
                key={s.name}
                className="aspect-[3/2] bg-[var(--color-warm-gray)]/10 border border-[var(--color-warm-gray)]/30 rounded-xl flex flex-col items-center justify-center gap-3 p-6 text-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.logo}
                  alt={s.name}
                  className="h-10 w-auto max-w-[60%] object-contain"
                  loading="lazy"
                />
                <span className="text-xs uppercase tracking-wider text-[var(--color-warm-gray)]">
                  {s.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--color-yellow)] text-[var(--color-black)]">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-24 lg:py-32 text-center">
          <h2 className="text-5xl sm:text-7xl lg:text-8xl tracking-tight">
            Want me on your stage?
          </h2>
          <p className="mt-6 text-xl lg:text-2xl text-[var(--color-black)]/80 max-w-2xl mx-auto">
            Tell me about the audience, the moment, and what you want them
            walking out thinking.
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
