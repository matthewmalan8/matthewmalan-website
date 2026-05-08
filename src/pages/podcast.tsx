import Layout from "@/components/Layout";

const episodes = [
  {
    number: "042",
    title: "The art of the second question",
    guest: "Lena Park, founder of Riverline",
    blurb:
      "On the difference between curious and nosy, and how the best operators interview their own assumptions.",
  },
  {
    number: "041",
    title: "Building things that don't apologize",
    guest: "Jordan Reyes, designer & writer",
    blurb:
      "Why softening is the most expensive mistake — and how to ship work with a spine.",
  },
  {
    number: "040",
    title: "Quiet leadership in loud rooms",
    guest: "Amari Okonkwo, CEO of Hatch Labs",
    blurb:
      "A master class on calm decisions, slow words, and the kind of authority you can't fake.",
  },
];

export default function PodcastPage() {
  return (
    <Layout
      title="The Podcast"
      description="Long-form interviews with operators, artists, and outliers — hosted by Matthew Malan."
      path="/podcast/"
    >
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-16">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
          The Podcast
        </p>
        <h1 className="mt-6 text-5xl sm:text-7xl tracking-tight max-w-4xl">
          Long conversations.{" "}
          <span className="bg-[var(--color-yellow)] px-2">Real ones</span>.
        </h1>
        <p className="mt-8 max-w-2xl text-lg text-[var(--color-black)]/70 leading-relaxed">
          A weekly show where operators, artists, and outliers slow down enough
          to actually say what they mean. New episodes every Tuesday.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href="https://podcasts.apple.com"
            className="inline-flex items-center border-2 border-[var(--color-black)] text-[var(--color-black)] px-5 py-3 text-sm font-semibold rounded-full hover:bg-[var(--color-black)] hover:text-[var(--color-yellow)] transition-colors"
          >
            Apple Podcasts
          </a>
          <a
            href="https://open.spotify.com"
            className="inline-flex items-center border-2 border-[var(--color-black)] text-[var(--color-black)] px-5 py-3 text-sm font-semibold rounded-full hover:bg-[var(--color-black)] hover:text-[var(--color-yellow)] transition-colors"
          >
            Spotify
          </a>
          <a
            href="https://overcast.fm"
            className="inline-flex items-center border-2 border-[var(--color-black)] text-[var(--color-black)] px-5 py-3 text-sm font-semibold rounded-full hover:bg-[var(--color-black)] hover:text-[var(--color-yellow)] transition-colors"
          >
            Overcast
          </a>
        </div>
      </section>

      <section className="bg-[var(--color-off-white)] border-t border-[var(--color-warm-gray)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
          <h2 className="text-3xl lg:text-5xl tracking-tight">Recent episodes</h2>
          <ul className="mt-12 divide-y divide-[var(--color-warm-gray)]">
            {episodes.map((e) => (
              <li key={e.number} className="py-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <p className="md:col-span-2 font-[family-name:var(--font-display)] text-3xl text-[var(--color-black)]/40">
                  {e.number}
                </p>
                <div className="md:col-span-7">
                  <h3 className="text-2xl">{e.title}</h3>
                  <p className="mt-2 text-[var(--color-black)]/70">{e.blurb}</p>
                </div>
                <p className="md:col-span-3 text-sm text-[var(--color-black)]/60">
                  with <span className="font-semibold text-[var(--color-black)]">{e.guest}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Layout>
  );
}
