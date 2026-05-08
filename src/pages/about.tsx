import Link from "next/link";
import Layout from "@/components/Layout";

export default function AboutPage() {
  return (
    <Layout
      title="About"
      description="About Matthew Malan — speaker, host, and writer on leadership and craft."
      path="/about/"
    >
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-16">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
          About
        </p>
        <h1 className="mt-6 text-5xl sm:text-7xl tracking-tight max-w-4xl">
          I help people{" "}
          <span className="bg-[var(--color-yellow)] px-2">say what they mean</span>.
        </h1>
      </section>

      <section className="max-w-3xl mx-auto px-6 lg:px-10 pb-24">
        <div className="space-y-6 text-lg text-[var(--color-black)]/80 leading-relaxed">
          <p>
            I'm Matthew Malan — a public speaker, podcast host, and writer based
            in Brooklyn. For the last twelve years I've been on stage, on air,
            and in the rooms where leaders make calls they can't take back.
          </p>
          <p>
            My work sits at the intersection of leadership, craft, and
            conversation. I spend most of my time interviewing the kinds of
            people whose work I respect, then translating what I learn into
            talks, essays, and frameworks operators can actually use.
          </p>
          <p>
            Before this, I led communications at two startups and spent a few
            years writing for outlets I'm still proud of. That work taught me
            that clarity is a discipline, not a talent — and that most of the
            time, what looks like a strategy problem is really a conversation
            problem in disguise.
          </p>
          <p>
            When I'm not working, I'm probably reading something dense, walking
            the dog, or losing at chess.
          </p>
        </div>

        <div className="mt-14 p-8 bg-[var(--color-black)] text-[var(--color-off-white)] rounded-2xl">
          <p className="font-[family-name:var(--font-display)] text-2xl">
            Want to work together?
          </p>
          <p className="mt-3 text-[var(--color-warm-gray)]">
            I take on a small number of speaking engagements and advisory
            partnerships each year.
          </p>
          <Link
            href="/contact/"
            className="mt-6 inline-flex items-center bg-[var(--color-yellow)] text-[var(--color-black)] px-6 py-3 text-sm font-semibold rounded-full hover:bg-[var(--color-lime)] transition-colors"
          >
            Get in touch
          </Link>
        </div>
      </section>
    </Layout>
  );
}
