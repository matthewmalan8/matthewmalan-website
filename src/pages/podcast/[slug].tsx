import Link from "next/link";
import { useState, type MouseEvent } from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Layout from "@/components/Layout";
import {
  ApplePodcastsIcon,
  CheckIcon,
  EmailIcon,
  FacebookIcon,
  GlobeIcon,
  InstagramIcon,
  LinkedInIcon,
  LinkIcon,
  SmsIcon,
  SpotifyIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/Icons";
import { siteConfig } from "@/lib/seoConfig";
import {
  getAllEpisodeSlugs,
  getAllEpisodes,
  getEpisodeBySlug,
} from "@/lib/episodes";
import {
  getRelatedEpisodes,
  getYouTubeEmbedUrl,
  formatEpisodeDate,
  type Episode,
  type EpisodeMeta,
} from "@/lib/episode-utils";

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
  verb: string;
  Icon: (props: { className?: string }) => React.ReactElement;
}> = [
  { key: "spotify", label: "Spotify", verb: "Listen on", Icon: SpotifyIcon },
  {
    key: "applePodcasts",
    label: "Apple Podcasts",
    verb: "Listen on",
    Icon: ApplePodcastsIcon,
  },
  { key: "youtube", label: "YouTube", verb: "Watch on", Icon: YouTubeIcon },
];

function ShareSection({ title, slug }: { title: string; slug: string }) {
  const url = `${siteConfig.domain}/podcast/${slug}/`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const subject = encodeURIComponent(`Stay Hungry: ${title}`);
  const body = encodeURIComponent(`${title}\n\n${url}`);
  const smsBody = encodeURIComponent(`${title} — ${url}`);

  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without Clipboard API or denied permission
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Last resort — let the user manually copy
        window.prompt("Copy this link:", url);
      }
      document.body.removeChild(textarea);
    }
  };

  const openPopup =
    (popupUrl: string) =>
    (e: MouseEvent<HTMLAnchorElement>) => {
      const left = Math.round(window.screenX + (window.outerWidth - 600) / 2);
      const top = Math.round(window.screenY + (window.outerHeight - 600) / 2);
      const popup = window.open(
        popupUrl,
        "share-popup",
        `width=600,height=600,left=${left},top=${top},scrollbars=yes,resizable=yes,noopener=no`
      );
      // If the popup was blocked, let the default link behavior take over.
      if (popup) {
        e.preventDefault();
        popup.focus();
      }
    };

  const popupTargets = [
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      Icon: LinkedInIcon,
    },
    {
      label: "X",
      href: `https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      Icon: XIcon,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      Icon: FacebookIcon,
    },
  ];

  return (
    <section className="max-w-3xl mx-auto px-6 lg:px-10 mt-16 pt-10 border-t border-[var(--color-warm-gray)]">
      <h2 className="text-lg font-semibold">Share this episode</h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {/* Copy Link — universal, always works */}
        <li>
          <button
            type="button"
            onClick={copyLink}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
              copied
                ? "border-[var(--color-black)] bg-[var(--color-yellow)] text-[var(--color-black)]"
                : "border-[var(--color-warm-gray)] text-[var(--color-black)] hover:bg-[var(--color-warm-gray)]/20"
            }`}
            aria-live="polite"
          >
            {copied ? (
              <CheckIcon className="w-4 h-4" />
            ) : (
              <LinkIcon className="w-4 h-4" />
            )}
            <span>{copied ? "Copied!" : "Copy link"}</span>
          </button>
        </li>

        {/* Social share popups */}
        {popupTargets.map(({ label, href, Icon }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={openPopup(href)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-warm-gray)] text-[var(--color-black)] text-sm font-medium hover:bg-[var(--color-warm-gray)]/20 transition-colors"
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </a>
          </li>
        ))}

        {/* Email */}
        <li>
          <a
            href={`mailto:?subject=${subject}&body=${body}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-warm-gray)] text-[var(--color-black)] text-sm font-medium hover:bg-[var(--color-warm-gray)]/20 transition-colors"
          >
            <EmailIcon className="w-4 h-4" />
            <span>Email</span>
          </a>
        </li>

        {/* SMS — mobile only */}
        <li className="sm:hidden">
          <a
            href={`sms:?body=${smsBody}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-warm-gray)] text-[var(--color-black)] text-sm font-medium hover:bg-[var(--color-warm-gray)]/20 transition-colors"
          >
            <SmsIcon className="w-4 h-4" />
            <span>Text</span>
          </a>
        </li>
      </ul>
    </section>
  );
}

export default function EpisodePage({ episode, related }: Props) {
  const youtubeEmbed = getYouTubeEmbedUrl(episode.youtube);

  return (
    <Layout
      title={episode.title}
      description={episode.excerpt}
      path={`/podcast/${episode.slug}/`}
      ogImage={episode.image}
      ogImageAlt={episode.imageAlt || episode.title}
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
            </div>
            {episode.topics.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {episode.topics.map((t) => (
                  <li key={t}>
                    <Link
                      href={`/podcast/?topic=${encodeURIComponent(t)}#episodes`}
                      className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border border-[var(--color-warm-gray)]/40 text-[var(--color-warm-gray)] hover:bg-[var(--color-yellow)] hover:text-[var(--color-black)] hover:border-[var(--color-yellow)] transition-colors"
                    >
                      {t}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
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

        {/* Listen on */}
        {(episode.spotify || episode.applePodcasts || episode.youtube) && (
          <section className="max-w-3xl mx-auto px-6 lg:px-10 mt-12">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
              Listen, watch, or subscribe
            </p>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PLATFORMS.map(({ key, label, verb, Icon }) =>
                episode[key] ? (
                  <a
                    key={key}
                    href={episode[key] as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 bg-[var(--color-black)] text-[var(--color-off-white)] rounded-2xl px-5 py-4 hover:opacity-90 transition-opacity"
                  >
                    <Icon className="w-9 h-9 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-[var(--color-warm-gray)] leading-tight">
                        {verb}
                      </p>
                      <p className="text-base sm:text-lg font-bold leading-tight truncate">
                        {label}
                      </p>
                    </div>
                  </a>
                ) : null
              )}
            </div>
          </section>
        )}

        {/* Featured image */}
        {episode.image && (
          <section className="max-w-3xl mx-auto px-6 lg:px-10 mt-12">
            <div className="overflow-hidden rounded-2xl bg-[var(--color-warm-gray)] flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={episode.image}
                alt={episode.imageAlt}
                className="w-auto max-w-full h-auto max-h-[80vh] object-contain"
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

        {/* Guest's book */}
        {episode.book && (
          <section className="max-w-4xl mx-auto px-6 lg:px-10 mt-16">
            <div className="bg-[var(--color-yellow)] rounded-3xl overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12 p-8 md:p-12 items-center">
                {episode.book.image && (
                  <div className="md:col-span-2">
                    <div
                      className="aspect-[2/3] overflow-hidden rounded-lg bg-[var(--color-black)]/10"
                      style={{
                        boxShadow:
                          "0 25px 50px -12px rgba(28, 20, 0, 0.45), 0 8px 16px -4px rgba(28, 20, 0, 0.25)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={episode.book.image}
                        alt={episode.book.title || "Book cover"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
                <div className={episode.book.image ? "md:col-span-3" : "md:col-span-5"}>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
                    Featured Book
                  </p>
                  {episode.book.title && (
                    <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl md:text-4xl tracking-tight text-[var(--color-black)]">
                      {episode.book.title}
                    </h2>
                  )}
                  {episode.book.description && (
                    <p className="mt-5 text-[var(--color-black)]/80 leading-relaxed">
                      {episode.book.description}
                    </p>
                  )}
                  {episode.book.link && (
                    <>
                      <a
                        href={episode.book.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-7 inline-flex items-center bg-[var(--color-black)] text-[var(--color-yellow)] px-6 py-3 text-sm font-semibold rounded-full hover:bg-[var(--color-yellow)] hover:text-[var(--color-black)] transition-colors"
                      >
                        Get the book →
                      </a>
                      <p className="mt-4 text-xs text-[var(--color-black)]/60 italic">
                        As an Amazon Associate, I earn from qualifying
                        purchases at no extra cost to you.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Guest bio */}
        {episode.guest && (episode.guestBio || episode.guestImage) && (
          <section className="max-w-3xl mx-auto px-6 lg:px-10 mt-16">
            <div className="bg-[var(--color-off-white)] border border-[var(--color-warm-gray)] rounded-2xl p-8">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
                About the guest
              </h2>
              <div className="mt-6 flex flex-col sm:flex-row gap-5 sm:gap-6 items-center sm:items-start">
                {episode.guestImage && (
                  <div className="flex-shrink-0 w-32 h-32 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-[var(--color-warm-gray)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={episode.guestImage}
                      alt={episode.guest}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 w-full">
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
                    episode.guestSocials.instagram ||
                    episode.guestSocials.facebook ||
                    episode.guestSocials.website) && (
                    <ul className="mt-5 flex flex-wrap gap-3 items-center">
                      {episode.guestSocials.twitter && (
                        <li>
                          <a
                            href={episode.guestSocials.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Twitter / X"
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[var(--color-warm-gray)] text-[var(--color-black)] hover:scale-110 hover:border-[var(--color-black)] transition-all"
                          >
                            <XIcon className="w-4 h-4" />
                          </a>
                        </li>
                      )}
                      {episode.guestSocials.instagram && (
                        <li>
                          <a
                            href={episode.guestSocials.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Instagram"
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[var(--color-warm-gray)] hover:scale-110 hover:border-[var(--color-black)] transition-all"
                          >
                            <InstagramIcon className="w-5 h-5" />
                          </a>
                        </li>
                      )}
                      {episode.guestSocials.linkedin && (
                        <li>
                          <a
                            href={episode.guestSocials.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="LinkedIn"
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[var(--color-warm-gray)] hover:scale-110 hover:border-[var(--color-black)] transition-all"
                          >
                            <LinkedInIcon className="w-5 h-5" />
                          </a>
                        </li>
                      )}
                      {episode.guestSocials.facebook && (
                        <li>
                          <a
                            href={episode.guestSocials.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Facebook"
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[var(--color-warm-gray)] hover:scale-110 hover:border-[var(--color-black)] transition-all"
                          >
                            <FacebookIcon className="w-5 h-5" />
                          </a>
                        </li>
                      )}
                      {episode.guestSocials.website && (
                        <li>
                          <a
                            href={episode.guestSocials.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Website"
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[var(--color-warm-gray)] text-[var(--color-black)]/70 hover:scale-110 hover:border-[var(--color-black)] hover:text-[var(--color-black)] transition-all"
                          >
                            <GlobeIcon className="w-5 h-5" />
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

        {/* Share */}
        <ShareSection title={episode.title} slug={episode.slug} />

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
