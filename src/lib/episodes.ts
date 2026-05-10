import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const episodesDir = path.join(process.cwd(), "content", "episodes");

export type GuestSocials = {
  twitter?: string;
  linkedin?: string;
  website?: string;
};

export type EpisodeFrontmatter = {
  title: string;
  date: string;
  episodeNumber: number | null;
  image: string;
  imageAlt: string;
  excerpt: string;
  quote: string;
  category: string;
  tags: string[];
  guest: string;
  guestBio: string;
  guestImage: string;
  guestSocials: GuestSocials;
  youtube: string;
  spotify: string;
  applePodcasts: string;
  keyTakeaways: string[];
  featured: boolean;
};

export type EpisodeMeta = EpisodeFrontmatter & { slug: string };

export type Episode = EpisodeMeta & { contentHtml: string };

function normalizeDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "");
}

function asString(value: unknown): string {
  return value == null ? "" : String(value);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function asSocials(value: unknown): GuestSocials {
  if (!value || typeof value !== "object") return {};
  const v = value as Record<string, unknown>;
  return {
    twitter: v.twitter ? String(v.twitter) : undefined,
    linkedin: v.linkedin ? String(v.linkedin) : undefined,
    website: v.website ? String(v.website) : undefined,
  };
}

function readEpisode(slug: string): {
  data: EpisodeFrontmatter;
  content: string;
} {
  const raw = fs.readFileSync(path.join(episodesDir, `${slug}.md`), "utf8");
  const { data, content } = matter(raw);
  const fm = data as Record<string, unknown>;
  return {
    data: {
      title: asString(fm.title),
      date: normalizeDate(fm.date),
      episodeNumber:
        typeof fm.episodeNumber === "number" ? fm.episodeNumber : null,
      image: asString(fm.image),
      imageAlt: asString(fm.imageAlt),
      excerpt: asString(fm.excerpt),
      quote: asString(fm.quote),
      category: asString(fm.category),
      tags: asStringArray(fm.tags),
      guest: asString(fm.guest),
      guestBio: asString(fm.guestBio),
      guestImage: asString(fm.guestImage),
      guestSocials: asSocials(fm.guestSocials),
      youtube: asString(fm.youtube),
      spotify: asString(fm.spotify),
      applePodcasts: asString(fm.applePodcasts),
      keyTakeaways: asStringArray(fm.keyTakeaways),
      featured: fm.featured === true,
    },
    content,
  };
}

export function getAllEpisodeSlugs(): string[] {
  if (!fs.existsSync(episodesDir)) return [];
  return fs
    .readdirSync(episodesDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getAllEpisodes(): EpisodeMeta[] {
  return getAllEpisodeSlugs()
    .map((slug) => ({ slug, ...readEpisode(slug).data }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getEpisodeBySlug(slug: string): Promise<Episode> {
  const { data, content } = readEpisode(slug);
  const processed = await remark().use(html).process(content);
  return { slug, contentHtml: processed.toString(), ...data };
}

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
