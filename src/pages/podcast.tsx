import Layout from "@/components/Layout";

const listenOn = [
  { label: "Apple Podcasts", href: "https://podcasts.apple.com/" },
  { label: "Spotify", href: "https://open.spotify.com/" },
  { label: "YouTube", href: "https://youtube.com/" },
  { label: "RSS", href: "/rss.xml" },
];

const episodes = [
  {
    number: "005",
    title: "[Episode title placeholder]",
    description: "[Short description of the episode — one or two lines.]",
    duration: "52 min",
    href: "#",
  },
  {
    number: "004",
    title: "[Episode title placeholder]",
    description: "[Short description of the episode — one or two lines.]",
    duration: "47 min",
    href: "#",
  },
  {
    number: "003",
    title: "[Episode title placeholder]",
    description: "[Short description of the episode — one or two lines.]",
    duration: "61 min",
    href: "#",
  },
  {
    number: "002",
    title: "[Episode title placeholder]",
    description: "[Short description of the episode — one or two lines.]",
    duration: "44 min",
    href: "#",
  },
  {
    number: "001",
    title: "[Episode title placeholder]",
    description: "[Short description of the episode — one or two lines.]",
    duration: "39 min",
    href: "#",
  },
];

export default function PodcastPage() {
  return (
    <Layout title="Podcast" description="[Placeholder]" path="/podcast/">
      {/* HERO */}
      <section className="bg-[var(--color-black)] text-[var(--color-off-white)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-24 pb-20 lg:pt-32 lg:pb-28">
          <h1 className="text-6xl sm:text-8xl lg:text-[10rem] leading-[0.9] tracking-tight">
            <span className="inline-block relative">
              The Podcast
              <span
                aria-hidden="true"
                className="absolute left-0 right-0 -bottom-2 lg:-bottom-3 h-3 lg:h-4 bg-[var(--color-yellow)]"
              />
            </span>
          </h1>

          <p className="mt-12 text-xl lg:text-2xl max-w-2xl text-[var(--color-warm-gray)]">
            [One-line description of the podcast — what it&apos;s about and who
            it&apos;s for.]
          </p>

          <div className="mt-12">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-yellow)]">
              Listen on
            </p>
            <ul className="mt-5 flex flex-wrap gap-3">
              {listenOn.map((p) => (
                <li key={p.label}>
                  <a
                    href={p.href}
                    className="inline-flex items-center border-2 border-[var(--color-off-white)] text-[var(--color-off-white)] px-5 py-3 text-sm font-semibold rounded-full hover:bg-[var(--color-yellow)] hover:text-[var(--color-black)] hover:border-[var(--color-yellow)] transition-colors"
                  >
                    {p.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* LATEST EPISODE FEATURED */}
      <section className="bg-[var(--color-off-white)] text-[var(--color-black)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
            Latest episode
          </p>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-5">
              <div className="aspect-square bg-[var(--color-warm-gray)]/40 border border-[var(--color-warm-gray)] rounded-2xl flex items-center justify-center">
                <span className="text-[var(--color-black)]/50 text-sm">
                  Episode artwork
                </span>
              </div>
            </div>

            <div className="lg:col-span-7">
              <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-black)]/40">
                Episode 006
              </p>
              <h2 className="mt-3 text-4xl sm:text-5xl tracking-tight">
                [Latest episode title placeholder]
              </h2>
              <p className="mt-6 text-lg text-[var(--color-black)]/75 leading-relaxed">
                [2-3 sentence description of the latest episode. Who&apos;s on,
                what they get into, and why it&apos;s worth your time.]
              </p>
              <a
                href="#"
                className="mt-10 inline-flex items-center bg-[var(--color-black)] text-[var(--color-yellow)] px-7 py-4 text-base font-semibold rounded-full hover:bg-[var(--color-yellow)] hover:text-[var(--color-black)] transition-colors"
              >
                Listen
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* EPISODES LIST */}
      <section className="bg-[var(--color-off-white)] border-t border-[var(--color-warm-gray)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <h2 className="text-3xl sm:text-5xl tracking-tight">All episodes</h2>

          <ul className="mt-12 divide-y divide-[var(--color-warm-gray)]">
            {episodes.map((e) => (
              <li
                key={e.number}
                className="py-8 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-start md:items-center"
              >
                <p className="md:col-span-1 font-[family-name:var(--font-display)] text-2xl text-[var(--color-black)]/40">
                  {e.number}
                </p>
                <div className="md:col-span-7">
                  <h3 className="text-xl lg:text-2xl">{e.title}</h3>
                  <p className="mt-2 text-[var(--color-black)]/70">
                    {e.description}
                  </p>
                </div>
                <p className="md:col-span-2 text-sm text-[var(--color-black)]/60">
                  {e.duration}
                </p>
                <div className="md:col-span-2 md:text-right">
                  <a
                    href={e.href}
                    className="inline-flex items-center text-sm font-semibold text-[var(--color-black)] hover:text-[var(--color-yellow)] transition-colors"
                  >
                    Listen →
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="bg-[var(--color-lime)] text-[var(--color-black)]">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 py-24 lg:py-32 text-center">
          <h2 className="text-4xl sm:text-6xl tracking-tight">
            Get new episodes by email.
          </h2>
          <p className="mt-6 text-lg lg:text-xl text-[var(--color-black)]/80 max-w-xl mx-auto">
            One short note when a new episode drops. No spam, no extras.
          </p>

          <form
            action="https://formspree.io/f/YOUR_FORM_ID"
            method="POST"
            className="mt-10 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
          >
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              placeholder="you@domain.com"
              className="flex-1 px-5 py-4 bg-[var(--color-off-white)] border-2 border-[var(--color-black)] rounded-full text-base placeholder:text-[var(--color-black)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-black)]"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center bg-[var(--color-black)] text-[var(--color-lime)] px-7 py-4 text-base font-semibold rounded-full hover:bg-[var(--color-yellow)] hover:text-[var(--color-black)] transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </Layout>
  );
}
