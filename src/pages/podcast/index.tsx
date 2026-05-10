import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import type { GetStaticProps } from "next";
import Layout from "@/components/Layout";
import { getAllEpisodes } from "@/lib/episodes";
import {
  getFeaturedEpisode,
  getAllTopics,
  formatEpisodeDate,
  type EpisodeMeta,
} from "@/lib/episode-utils";

type Props = {
  episodes: EpisodeMeta[];
  featured: EpisodeMeta | null;
  recent: EpisodeMeta[];
  topics: string[];
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const episodes = getAllEpisodes();
  const featured = getFeaturedEpisode(episodes);
  const recent = episodes
    .filter((e) => !featured || e.slug !== featured.slug)
    .slice(0, 6);
  const topics = getAllTopics(episodes);
  return { props: { episodes, featured, recent, topics } };
};

export default function PodcastPage({
  episodes,
  featured,
  recent,
  topics,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const topic: string | null = (() => {
    const q = router.query.topic;
    return typeof q === "string" && q ? q : null;
  })();

  const setTopic = (newTopic: string | null) => {
    const query: Record<string, string> = {};
    if (newTopic) query.topic = newTopic;
    router.replace({ pathname: "/podcast/", query }, undefined, {
      shallow: true,
      scroll: false,
    });
  };

  // Scroll to episode list when arriving with a topic in the URL.
  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.topic && typeof window !== "undefined") {
      const el = document.getElementById("episodes");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return episodes.filter((e) => {
      const matchesSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.excerpt.toLowerCase().includes(q) ||
        e.guest.toLowerCase().includes(q) ||
        e.topics.some((t) => t.toLowerCase().includes(q));
      const matchesTopic = !topic || e.topics.includes(topic);
      return matchesSearch && matchesTopic;
    });
  }, [episodes, search, topic]);

  return (
    <Layout
      title="The Podcast"
      description="Long-form interviews with operators, artists, and outliers — hosted by Matthew Malan."
      path="/podcast/"
    >
      {/* Hero */}
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
            A weekly show where operators, artists, and outliers slow down
            enough to actually say what they mean. New episodes every Tuesday.
          </p>

          <div className="mt-12">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-yellow)]">
              Listen on
            </p>
            <ul className="mt-5 flex flex-wrap gap-3">
              {[
                { label: "Apple Podcasts", href: "https://podcasts.apple.com/" },
                { label: "Spotify", href: "https://open.spotify.com/" },
                { label: "YouTube", href: "https://youtube.com/" },
              ].map((p) => (
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

      {/* Featured episode */}
      {featured && (
        <section className="bg-[var(--color-off-white)] border-t border-[var(--color-warm-gray)]">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
              {featured.featured ? "Featured Episode" : "Latest Episode"}
            </p>
            <Link
              href={`/podcast/${featured.slug}/`}
              className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center group"
            >
              {featured.image && (
                <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-[var(--color-warm-gray)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featured.image}
                    alt={featured.imageAlt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
              )}
              <div>
                {featured.episodeNumber !== null && (
                  <p className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-black)]/30">
                    Ep. {String(featured.episodeNumber).padStart(3, "0")}
                  </p>
                )}
                <h2 className="mt-4 text-3xl sm:text-5xl tracking-tight group-hover:underline decoration-[var(--color-yellow)] decoration-2 underline-offset-4">
                  {featured.title}
                </h2>
                {featured.guest && (
                  <p className="mt-4 text-[var(--color-black)]/60">
                    with{" "}
                    <span className="font-semibold text-[var(--color-black)]">
                      {featured.guest}
                    </span>
                  </p>
                )}
                <p className="mt-6 text-lg text-[var(--color-black)]/70 leading-relaxed">
                  {featured.excerpt}
                </p>
                <p className="mt-8 text-sm font-semibold">Listen now →</p>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* More top episodes */}
      {recent.length > 0 && (
        <section className="border-t border-[var(--color-warm-gray)]">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
            <h2 className="text-3xl tracking-tight">More episodes</h2>
            <ul className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
              {recent.map((e) => (
                <li key={e.slug}>
                  <Link href={`/podcast/${e.slug}/`} className="group block">
                    {e.image && (
                      <div className="aspect-square overflow-hidden rounded-xl bg-[var(--color-warm-gray)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={e.image}
                          alt={e.imageAlt}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                          loading="lazy"
                        />
                      </div>
                    )}
                    {e.episodeNumber !== null && (
                      <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-black)]/50">
                        Ep. {String(e.episodeNumber).padStart(3, "0")}
                      </p>
                    )}
                    <p className="mt-1 text-sm font-semibold leading-snug group-hover:underline decoration-[var(--color-yellow)] decoration-2 underline-offset-2 line-clamp-3">
                      {e.title}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Search + filter + full list */}
      {episodes.length > 0 ? (
        <section
          id="episodes"
          className="bg-[var(--color-off-white)] border-t border-[var(--color-warm-gray)] scroll-mt-20"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-5xl tracking-tight">
                Search the entire library.
              </h2>
              <p className="mt-4 text-[var(--color-black)]/70">
                Find the conversation you're looking for.
              </p>
              <div className="mt-8">
                <label htmlFor="episode-search" className="sr-only">
                  Search episodes
                </label>
                <input
                  id="episode-search"
                  type="search"
                  placeholder="Search by title, guest, or topic"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-5 py-4 rounded-full border-2 border-[var(--color-black)] bg-[var(--color-off-white)] focus:outline-none focus:bg-white"
                />
              </div>
            </div>

            {topics.length > 0 && (
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setTopic(null)}
                  className={`px-5 py-2 text-sm font-semibold rounded-full border-2 transition-colors ${
                    topic === null
                      ? "bg-[var(--color-yellow)] border-[var(--color-black)] text-[var(--color-black)]"
                      : "border-[var(--color-warm-gray)] text-[var(--color-black)]/70 hover:border-[var(--color-black)]"
                  }`}
                >
                  All
                </button>
                {topics.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setTopic(t)}
                    className={`px-5 py-2 text-sm font-semibold rounded-full border-2 transition-colors ${
                      topic === t
                        ? "bg-[var(--color-yellow)] border-[var(--color-black)] text-[var(--color-black)]"
                        : "border-[var(--color-warm-gray)] text-[var(--color-black)]/70 hover:border-[var(--color-black)]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-16">
              <h3 className="text-2xl tracking-tight">
                All episodes{" "}
                <span className="text-[var(--color-black)]/40">
                  ({filtered.length})
                </span>
              </h3>
              {filtered.length === 0 ? (
                <p className="mt-8 text-[var(--color-black)]/60">
                  No episodes match that search.
                </p>
              ) : (
                <ul className="mt-10 divide-y divide-[var(--color-warm-gray)]">
                  {filtered.map((e) => (
                    <li key={e.slug}>
                      <Link
                        href={`/podcast/${e.slug}/`}
                        className="group block py-6 grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-start"
                      >
                        {e.image && (
                          <div className="sm:col-span-2 aspect-square overflow-hidden rounded-lg bg-[var(--color-warm-gray)] max-w-[120px]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={e.image}
                              alt={e.imageAlt}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="sm:col-span-7">
                          {(e.episodeNumber !== null || e.topics.length > 0) && (
                            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-black)]/50">
                              {e.episodeNumber !== null && (
                                <>Ep. {String(e.episodeNumber).padStart(3, "0")}</>
                              )}
                              {e.episodeNumber !== null && e.topics[0] && <> · </>}
                              {e.topics.slice(0, 2).join(" · ")}
                            </p>
                          )}
                          <h4 className="mt-2 text-xl tracking-tight group-hover:underline decoration-[var(--color-yellow)] decoration-2 underline-offset-2">
                            {e.title}
                          </h4>
                          <p className="mt-2 text-[var(--color-black)]/70 line-clamp-2">
                            {e.excerpt}
                          </p>
                        </div>
                        <div className="sm:col-span-3 text-sm text-[var(--color-black)]/60">
                          <time dateTime={e.date}>{formatEpisodeDate(e.date)}</time>
                          {e.guest && (
                            <p className="mt-1">
                              with{" "}
                              <span className="font-semibold text-[var(--color-black)]">
                                {e.guest}
                              </span>
                            </p>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-[var(--color-off-white)] border-t border-[var(--color-warm-gray)]">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 text-center">
            <h2 className="text-3xl tracking-tight">More episodes coming soon.</h2>
            <p className="mt-4 text-[var(--color-black)]/60">
              The archive is being built. Check back shortly.
            </p>
          </div>
        </section>
      )}
    </Layout>
  );
}
