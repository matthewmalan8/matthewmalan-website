import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import type {
  Episode,
  EpisodeFrontmatter,
  EpisodeMeta,
  GuestBook,
  GuestSocials,
} from "./episode-utils";

export type { Episode, EpisodeFrontmatter, EpisodeMeta, GuestBook, GuestSocials };

const episodesDir = path.join(process.cwd(), "content", "episodes");

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
  const result: GuestSocials = {};
  if (v.twitter) result.twitter = String(v.twitter);
  if (v.linkedin) result.linkedin = String(v.linkedin);
  if (v.instagram) result.instagram = String(v.instagram);
  if (v.website) result.website = String(v.website);
  return result;
}

function asBook(value: unknown): GuestBook | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const title = asString(v.title);
  const image = asString(v.image);
  const description = asString(v.description);
  const link = asString(v.link);
  if (!title && !image && !description && !link) return null;
  return { title, image, description, link };
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
      category: asString(fm.category),
      tags: asStringArray(fm.tags),
      guest: asString(fm.guest),
      guestBio: asString(fm.guestBio),
      guestImage: asString(fm.guestImage),
      guestSocials: asSocials(fm.guestSocials),
      youtube: asString(fm.youtube),
      spotify: asString(fm.spotify),
      applePodcasts: asString(fm.applePodcasts),
      book: asBook(fm.book),
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
