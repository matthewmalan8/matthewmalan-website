import { formatLocalDate } from "./date-utils";

export type GuestSocials = {
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
};

export type GuestBook = {
  // "book" = full Featured Book card. "offer" = Special Offer card
  // (description-only, used for guest promo codes).
  mode: "book" | "offer";
  title: string;
  image: string;
  description: string;
  link: string;
};

export type EpisodeClip = {
  title: string;
  videoUrl: string;
  scheduledFor: string;
  isScheduled: boolean;
};

export function formatScheduledClipDate(dateStr: string): string {
  return formatLocalDate(dateStr, { month: "short", day: "numeric" });
}

export type EpisodeFrontmatter = {
  title: string;
  date: string;
  episodeNumber: number | null;
  image: string;
  imageAlt: string;
  excerpt: string;
  topics: string[];
  guest: string;
  guestBio: string;
  guestImage: string;
  guestSocials: GuestSocials;
  youtube: string;
  spotify: string;
  applePodcasts: string;
  book: GuestBook | null;
  clips: EpisodeClip[];
  featured: boolean;
};

export const ALL_TOPICS = [
  "Leadership",
  "Mindset",
  "Decision-Making",
  "Strategy",
  "Team Building",
  "Culture",
  "Hiring & Talent",
  "Communication",
  "Public Speaking",
  "Storytelling",
  "Negotiation",
  "Entrepreneurship",
  "Sales",
  "Marketing",
  "Money",
  "Investing",
  "Supply Chain",
  "Productivity",
  "Habits",
  "Focus & Attention",
  "Time Management",
  "Resilience",
  "Wellness",
  "Career Growth",
  "Creativity",
  "Authenticity",
  "Faith",
  "AI",
  "Technology",
] as const;

export type EpisodeMeta = EpisodeFrontmatter & { slug: string };

export type Episode = EpisodeMeta & { contentHtml: string };

export function getFeaturedEpisode(
  episodes: EpisodeMeta[]
): EpisodeMeta | null {
  if (episodes.length === 0) return null;
  return episodes.find((e) => e.featured) ?? episodes[0];
}

export function getRelatedEpisodes(
  current: EpisodeMeta,
  all: EpisodeMeta[],
  limit = 3
): EpisodeMeta[] {
  const others = all.filter((e) => e.slug !== current.slug);
  const currentTopics = new Set(current.topics);
  const scored = others
    .map((e) => {
      const overlap = e.topics.filter((t) => currentTopics.has(t)).length;
      return { episode: e, score: overlap };
    })
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.episode);
}

export function getAllTopics(episodes: EpisodeMeta[]): string[] {
  const set = new Set<string>();
  for (const e of episodes) for (const t of e.topics) set.add(t);
  return ALL_TOPICS.filter((t) => set.has(t));
}

export function formatEpisodeDate(date: string): string {
  return formatLocalDate(date, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getYouTubeId(youtubeUrl: string): string | null {
  if (!youtubeUrl) return null;
  const idMatch =
    youtubeUrl.match(/[?&]v=([^&#]+)/) ||
    youtubeUrl.match(/youtu\.be\/([^?&#]+)/) ||
    youtubeUrl.match(/youtube\.com\/embed\/([^?&#]+)/) ||
    youtubeUrl.match(/youtube\.com\/shorts\/([^?&#]+)/);
  return idMatch ? idMatch[1] : null;
}

export function getYouTubeEmbedUrl(youtubeUrl: string): string | null {
  const id = getYouTubeId(youtubeUrl);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export function getYouTubeThumbnailUrl(youtubeUrl: string): string | null {
  const id = getYouTubeId(youtubeUrl);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
