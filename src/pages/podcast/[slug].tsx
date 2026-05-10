import Link from "next/link";
import type { GetStaticPaths, GetStaticProps } from "next";
import Layout from "@/components/Layout";
import {
  getAllEpisodeSlugs,
  getAllEpisodes,
  getEpisodeBySlug,
  getRelatedEpisodes,
  getYouTubeEmbedUrl,
  formatEpisodeDate,
  type Episode,
  type EpisodeMeta,
} from "@/lib/episodes";

type Props = {
  episode: Episode;
  related: EpisodeMeta[];
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: getAllEpisodeSlugs().map((slug) => ({ params: { slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  const episode = await getEpisodeBySlug(slug);
  const related = getRelatedEpisodes(episode, getAllEpisodes(), 3);
  return { props: { episode, related } };
};

const PLATFORMS: Array<{
  key: keyof Pick<Episode, "spotify" | "applePodcasts" | "youtube">;
  label: string;
}> = [
  { key: "spotify", label: "Spotify" },
  { key: "applePodcasts", label: "Apple Podcasts" },
  { key: "youtube", label: "YouTube" },
];

export default function EpisodePage({ episode, related }: Props) {
  const youtubeEmbed = getYouTubeEmbedUrl(episode.youtube);

  return (
    <Layout
      title={episode.title}
      description={episode.excerpt}
      path={`/podcast/${episode.slug}/`}
      ogImage={episode.image}
      ogType="article"
    >
      <article className="pb-24">
        {/* Header */}
        <header className="bg-[var(--color-black)] text-[var(--color-off-white)]">
          <div className="max-w-5xl mx-auto px-6 lg:px-10 py-16">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-yellow)]">
              <Link href="/podcast/" className="hover:underline">
                The Podcast
              </Link>
              {episode.episodeNumber !== null && (
                <>
                  {" "}· Episode {String(episode.episodeNumber).padStart(3, "0")}
                </>
              )}
            </p>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl tracking-tight">
              {episode.title}
            </h1>
            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-warm-gray)]">
              <time dateTime={episode.date}>
                {formatEpisodeDate(episode.date)}
              </time>
              {episode.guest && (
                <>
                  <span aria-hidden>·</span>
                  <span>
                    with{" "}
                    <span className="text-[var(--color-off-white)] font-medium">
                      {episode.guest}
                    </span>
                  </span>
                </>
              )}
              {episode.category && (
                <>
                  <span aria-hidden>·</span>
                  <span>{episode.category}</span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Embed */}
        {youtubeEmbed && (
          <section className="bg-[var(--color-black)]">
            <div className="max-w-5xl mx-auto px-6 lg:px-10 pb-12">
              <div className="aspect-video overflow-hidden rounded-2xl bg-black">
                <iframe
                  src={youtubeEmbed}
                  title={episode.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </section>
        )}

        {/* Pull quote */}
        {episode.quote && (
          <section className="max-w-3xl mx-auto px-6 lg:px-10 mt-12">
            <blockquote className="border-l-4 border-[var(--color-yellow)] pl-6 py-2">
              <p className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl leading-snug text-[var(--color-black)]">
                &ldquo;{episode.quote}&rdquo;
              </p>
              {episode.guest && (
                <footer className="mt-4 text-sm text-[var(--color-black)]/60">
                  — {episode.guest}
                </footer>
              )}
            </blockquote>
          </section>
        )}

        {/* Listen on */}
        {(episode.spotify || episode.applePodcasts || episode.youtube) && (
          <section className="max-w-3xl mx-auto px-6 lg:px-10 mt-12">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
              Listen, watch, or subscribe
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {PLATFORMS.map(({ key, label }) =>
                episode[key] ? (
                  <a
                    key={key}
                    href={episode[key] as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-[var(--color-black)] text-[var(--color-yellow)] px-5 py-3 text-sm font-semibold rounded-full hover:bg-[var(--color-yellow)] hover:text-[var(--color-black)] transition-colors"
                  >
                    {label}
                  </a>
                ) : null
              )}
            </div>
          </section>
        )}

        {/* Featured image */}
        {episode.image && (
          <section className="max-w-3xl mx-auto px-6 lg:px-10 mt-12">
            <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-[var(--color-warm-gray)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={episode.image}
                alt={episode.imageAlt}
                className="w-full h-full object-cover"
              />
            </div>
          </section>
        )}

        {/* Show notes */}
        {episode.contentHtml.trim() && (
          <section className="max-w-3xl mx-auto px-6 lg:px-10 mt-12">
            <div
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: episode.contentHtml }}
            />
          </section>
        )}

        {/* Key takeaways */}
        {episode.keyTakeaways.length > 0 && (
          <section className="max-w-3xl mx-auto px-6 lg:px-10 mt-16">
            <h2 className="text-2xl sm:text-3xl tracking-tight">
              Key takeaways
            </h2>
            <ul className="mt-6 space-y-3">
              {episode.keyTakeaways.map((takeaway, i) => (
                <li key={i} className="flex gap-4">
                  <span
                    aria-hidden
                    className="mt-2 flex-shrink-0 w-2 h-2 rounded-full bg-[var(--color-yellow)]"
                  />
                  <span className="text-[var(--color-black)]/85 leading-relaxed">
                    {takeaway}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Guest bio */}
        {episode.guest && (episode.guestBio || episode.guestImage) && (
          <section className="max-w-3xl mx-auto px-6 lg:px-10 mt-16">
            <div className="bg-[var(--color-off-white)] border border-[var(--color-warm-gray)] rounded-2xl p-8">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
                About the guest
              </h2>
              <div className="mt-6 flex gap-6 items-start">
                {episode.guestImage && (
                  <div className="flex-shrink-0 w-24 h-24 rounded-full overflow-hidden bg-[var(--color-warm-gray)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={episode.guestImage}
                      alt={episode.guest}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-[family-name:var(--font-display)] text-2xl">
                    {episode.guest}
                  </p>
                  {episode.guestBio && (
                    <p className="mt-3 text-[var(--color-black)]/75 leading-relaxed">
                      {episode.guestBio}
                    </p>
                  )}
                  {(episode.guestSocials.twitter ||
                    episode.guestSocials.linkedin ||
                    episode.guestSocials.website) && (
                    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
                      {episode.guestSocials.twitter && (
                        <li>
                          <a
                            href={episode.guestSocials.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[var(--color-black)]/60"
                          >
                            Twitter / X →
                          </a>
                        </li>
                      )}
                      {episode.guestSocials.linkedin && (
                        <li>
                          <a
                            href={episode.guestSocials.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[var(--color-black)]/60"
                          >
                            LinkedIn →
                          </a>
                        </li>
                      )}
                      {episode.guestSocials.website && (
                        <li>
                          <a
                            href={episode.guestSocials.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-[var(--color-black)]/60"
                          >
                            Website →
                          </a>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Related episodes */}
        {related.length > 0 && (
          <section className="max-w-5xl mx-auto px-6 lg:px-10 mt-20 pt-12 border-t border-[var(--color-warm-gray)]">
            <h2 className="text-2xl sm:text-3xl tracking-tight">
              You may also like
            </h2>
            <ul className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
              {related.map((e) => (
                <li key={e.slug}>
                  <Link href={`/podcast/${e.slug}/`} className="group block">
                    {e.image && (
                      <div className="aspect-[4/3] overflow-hidden rounded-xl bg-[var(--color-warm-gray)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={e.image}
                          alt={e.imageAlt}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                          loading="lazy"
                        />
                      </div>
                    )}
                    {e.episodeNumber !== null && (
                      <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-black)]/50">
                        Ep. {String(e.episodeNumber).padStart(3, "0")}
                      </p>
                    )}
                    <p className="mt-1 text-lg tracking-tight group-hover:underline decoration-[var(--color-yellow)] decoration-2 underline-offset-2">
                      {e.title}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Back link */}
        <div className="max-w-3xl mx-auto px-6 lg:px-10 mt-16">
          <Link
            href="/podcast/"
            className="inline-flex items-center text-sm font-semibold hover:text-[var(--color-black)]/60 transition-colors"
          >
            ← Back to all episodes
          </Link>
        </div>
      </article>
    </Layout>
  );
}
