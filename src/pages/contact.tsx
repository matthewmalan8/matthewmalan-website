import Layout from "@/components/Layout";

const socials = [
  { label: "Instagram", href: "https://www.instagram.com/matthewmalan8/" },
  { label: "Twitter / X", href: "https://x.com/matthewmalan8" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/matthew-malan8/" },
  { label: "TikTok", href: "https://www.tiktok.com/@matthewmalan7" },
];

export default function ContactPage() {
  return (
    <Layout
      title="Contact"
      description="Get in touch with Matthew Malan for speaking engagements, podcast guesting, and collaborations."
      path="/contact/"
    >
      <section className="bg-[var(--color-off-white)] text-[var(--color-black)]">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 pt-24 pb-16 lg:pt-32">
          <h1 className="text-6xl sm:text-8xl tracking-tight">
            <span className="inline-block relative">
              Let&apos;s talk.
              <span
                aria-hidden="true"
                className="absolute left-0 right-0 -bottom-2 lg:-bottom-3 h-3 lg:h-4 bg-[var(--color-yellow)]"
              />
            </span>
          </h1>
          <p className="mt-10 text-xl lg:text-2xl text-[var(--color-black)]/75 leading-relaxed">
            Speaking inquiry, podcast guest, or just want to say hi — I read
            every message.
          </p>
        </div>
      </section>

      <section className="bg-[var(--color-off-white)]">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 pb-20">
          <form
            action="https://formspree.io/f/mbdwzagr"
            method="POST"
            className="space-y-6"
          >
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold uppercase tracking-wider text-[var(--color-black)]/70"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                className="mt-2 w-full px-5 py-4 bg-[var(--color-off-white)] border-2 border-[var(--color-black)] rounded-xl text-base placeholder:text-[var(--color-black)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-yellow)]"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold uppercase tracking-wider text-[var(--color-black)]/70"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-2 w-full px-5 py-4 bg-[var(--color-off-white)] border-2 border-[var(--color-black)] rounded-xl text-base placeholder:text-[var(--color-black)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-yellow)]"
              />
            </div>

            <div>
              <label
                htmlFor="reason"
                className="block text-sm font-semibold uppercase tracking-wider text-[var(--color-black)]/70"
              >
                Reason
              </label>
              <select
                id="reason"
                name="reason"
                required
                defaultValue=""
                className="mt-2 w-full px-5 py-4 bg-[var(--color-off-white)] border-2 border-[var(--color-black)] rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-yellow)]"
              >
                <option value="" disabled>
                  Select one
                </option>
                <option value="Speaking">Speaking</option>
                <option value="Podcast Guest">Podcast Guest</option>
                <option value="Collaboration">Collaboration</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-semibold uppercase tracking-wider text-[var(--color-black)]/70"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                className="mt-2 w-full px-5 py-4 bg-[var(--color-off-white)] border-2 border-[var(--color-black)] rounded-xl text-base placeholder:text-[var(--color-black)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-yellow)] resize-y"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex items-center bg-[var(--color-yellow)] text-[var(--color-black)] px-8 py-4 text-base font-semibold rounded-full hover:bg-[var(--color-lime)] transition-colors"
              >
                Send message
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="bg-[var(--color-off-white)] border-t border-[var(--color-warm-gray)]">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 py-16 lg:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
                Email
              </p>
              <a
                href="mailto:matthewsmalan@gmail.com"
                className="mt-3 inline-block font-[family-name:var(--font-display)] text-2xl break-all hover:text-[var(--color-yellow)] transition-colors"
              >
                matthewsmalan@gmail.com
              </a>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
                Elsewhere
              </p>
              <ul className="mt-3 space-y-2 text-lg">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      className="hover:text-[var(--color-yellow)] transition-colors"
                    >
                      {s.label} →
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
