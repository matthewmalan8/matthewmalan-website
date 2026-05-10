import Layout from "@/components/Layout";
import {
  InstagramIcon,
  LinkedInIcon,
  TikTokIcon,
  XIcon,
} from "@/components/Icons";

const socials = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/matthewmalan8/",
    Icon: InstagramIcon,
  },
  {
    label: "Twitter / X",
    href: "https://x.com/matthewmalan8",
    Icon: XIcon,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/matthew-malan8/",
    Icon: LinkedInIcon,
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@matthewmalan7",
    Icon: TikTokIcon,
  },
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
                <option value="Consulting">Consulting</option>
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
        <div className="max-w-3xl mx-auto px-6 lg:px-10 py-16 lg:py-20 space-y-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
              Email
            </p>
            <a
              href="mailto:matthewsmalan@gmail.com"
              className="mt-3 inline-block font-[family-name:var(--font-display)] text-xl sm:text-2xl hover:text-[var(--color-yellow)] transition-colors whitespace-nowrap"
            >
              matthewsmalan@gmail.com
            </a>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
              Elsewhere
            </p>
            <ul className="mt-4 flex flex-wrap gap-3 items-center">
              {socials.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-[var(--color-warm-gray)] text-[var(--color-black)] hover:scale-110 hover:border-[var(--color-black)] transition-all"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </Layout>
  );
}
