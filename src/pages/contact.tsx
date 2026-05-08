import Layout from "@/components/Layout";

export default function ContactPage() {
  return (
    <Layout
      title="Contact"
      description="Get in touch with Matthew Malan about speaking, podcast guesting, or partnerships."
      path="/contact/"
    >
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-24">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
          Contact
        </p>
        <h1 className="mt-6 text-5xl sm:text-7xl tracking-tight max-w-4xl">
          Let's{" "}
          <span className="bg-[var(--color-yellow)] px-2">talk</span>.
        </h1>
        <p className="mt-8 max-w-2xl text-lg text-[var(--color-black)]/70 leading-relaxed">
          The fastest way to reach me is email. Tell me what you're working on,
          what you need, and when you need it. I read everything and reply to
          most things within a few days.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <a
            href="mailto:speaking@matthewmalan.com"
            className="block p-8 border-2 border-[var(--color-black)] rounded-2xl hover:bg-[var(--color-yellow)] transition-colors"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-black)]/60">
              Speaking
            </p>
            <p className="mt-3 font-[family-name:var(--font-display)] text-2xl break-all">
              speaking@matthewmalan.com
            </p>
            <p className="mt-3 text-[var(--color-black)]/70">
              Keynotes, workshops, and stage appearances.
            </p>
          </a>

          <a
            href="mailto:hello@matthewmalan.com"
            className="block p-8 border-2 border-[var(--color-black)] rounded-2xl hover:bg-[var(--color-lime)] transition-colors"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-black)]/60">
              Everything else
            </p>
            <p className="mt-3 font-[family-name:var(--font-display)] text-2xl break-all">
              hello@matthewmalan.com
            </p>
            <p className="mt-3 text-[var(--color-black)]/70">
              Podcast pitches, partnerships, press, hellos.
            </p>
          </a>
        </div>
      </section>
    </Layout>
  );
}
