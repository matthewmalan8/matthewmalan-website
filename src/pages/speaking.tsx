import Link from "next/link";
import Layout from "@/components/Layout";

const topics = [
  {
    title: "[Talk Title]",
    description: "[1-2 sentence description of the talk]",
    duration: "[45 min keynote]",
  },
  {
    title: "[Talk Title]",
    description: "[1-2 sentence description of the talk]",
    duration: "[60 min workshop]",
  },
  {
    title: "[Talk Title]",
    description: "[1-2 sentence description of the talk]",
    duration: "[30 min fireside]",
  },
];

const stages = ["Logo 01", "Logo 02", "Logo 03", "Logo 04", "Logo 05", "Logo 06"];

export default function SpeakingPage() {
  return (
    <Layout title="Speaking" description="[Placeholder]" path="/speaking/">
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
            [One-line subhead placeholder — what you bring to a stage.]
          </p>
        </div>
      </section>

      {/* TOPIC CARDS */}
      <section className="bg-[var(--color-off-white)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pb-24 lg:pb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            [Where I&apos;ve spoken before.]
          </h2>

          <ul className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {stages.map((s) => (
              <li
                key={s}
                className="aspect-[3/2] bg-[var(--color-warm-gray)]/15 border border-[var(--color-warm-gray)]/30 rounded-xl flex items-center justify-center"
              >
                <span className="text-sm text-[var(--color-warm-gray)]">{s}</span>
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
