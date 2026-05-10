export type GuestSocials = {
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
};

export type GuestBook = {
  title: string;
  image: string;
  description: string;
  link: string;
};

export type EpisodeFrontmatter = {
  title: string;
  date: string;
  episodeNumber: number | null;
  image: string;
  imageAlt: string;
  excerpt: string;
  category: string;
  tags: string[];
  guest: string;
  guestBio: string;
  guestImage: string;
  guestSocials: GuestSocials;
  youtube: string;
  spotify: string;
  applePodcasts: string;
  book: GuestBook | null;
  featured: boolean;
};

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
  const currentTags = new Set(current.tags);
  const scored = others
    .map((e) => {
      const tagOverlap = e.tags.filter((t) => currentTags.has(t)).length;
      return { episode: e, score: tagOverlap };
    })
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.episode);
}

export function getAllCategories(episodes: EpisodeMeta[]): string[] {
  const set = new Set<string>();
  for (const e of episodes) if (e.category) set.add(e.category);
  return Array.from(set).sort();
}

export function formatEpisodeDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getYouTubeEmbedUrl(youtubeUrl: string): string | null {
  if (!youtubeUrl) return null;
  const idMatch =
    youtubeUrl.match(/[?&]v=([^&#]+)/) ||
    youtubeUrl.match(/youtu\.be\/([^?&#]+)/) ||
    youtubeUrl.match(/youtube\.com\/embed\/([^?&#]+)/);
  if (!idMatch) return null;
  return `https://www.youtube.com/embed/${idMatch[1]}`;
}
