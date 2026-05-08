import Link from "next/link";
import Layout from "@/components/Layout";

const talks = [
  {
    title: "The Conversations Leaders Avoid",
    summary:
      "Why the hardest moments are usually the ones leaders need most — and a framework for showing up for them.",
    audience: "C-suites, founders, leadership offsites",
  },
  {
    title: "Storytelling for Operators",
    summary:
      "How to tell the truth about your work in a way that compounds trust, instead of burning it.",
    audience: "Tech & product teams, growth orgs",
  },
  {
    title: "Asking Better Questions",
    summary:
      "A practical talk on the craft of inquiry — pulled from 500+ podcast interviews.",
    audience: "Sales, support, research, leadership",
  },
];

export default function SpeakingPage() {
  return (
    <Layout
      title="Speaking"
      description="Keynotes, workshops, and stage talks by Matthew Malan."
      path="/speaking/"
    >
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-16">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
          Speaking
        </p>
        <h1 className="mt-6 text-5xl sm:text-7xl tracking-tight max-w-4xl">
          Talks that don't waste{" "}
          <span className="bg-[var(--color-yellow)] px-2">your team's time</span>.
        </h1>
        <p className="mt-8 max-w-2xl text-lg text-[var(--color-black)]/70 leading-relaxed">
          I speak to leadership teams, conferences, and product orgs about the
          things that quietly run the show — communication, trust, judgment,
          and the conversations that decide everything else.
        </p>
      </section>

      <section className="bg-[var(--color-black)] text-[var(--color-off-white)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
          <h2 className="text-3xl lg:text-5xl tracking-tight">Signature talks</h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {talks.map((t) => (
              <article
                key={t.title}
                className="p-8 border border-[var(--color-warm-gray)]/30 rounded-2xl hover:border-[var(--color-yellow)] transition-colors"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-yellow)]">
                  {t.audience}
                </p>
                <h3 className="mt-4 text-2xl">{t.title}</h3>
                <p className="mt-4 text-[var(--color-warm-gray)] leading-relaxed">
                  {t.summary}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <h2 className="text-4xl lg:text-5xl tracking-tight">
            Bringing me to{" "}
            <span className="bg-[var(--color-lime)] px-2">your stage</span>?
          </h2>
          <div>
            <p className="text-lg text-[var(--color-black)]/70 leading-relaxed">
              Tell me about the audience, the moment, and what you want them
              walking out thinking. I'll come back with a take and a fee.
            </p>
            <Link
              href="/contact/"
              className="mt-8 inline-flex items-center bg-[var(--color-black)] text-[var(--color-yellow)] px-7 py-4 text-base font-semibold rounded-full hover:bg-[var(--color-lime)] hover:text-[var(--color-black)] transition-colors"
            >
              Start the conversation
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
