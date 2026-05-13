import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import type { Book, BookFrontmatter, BookMeta } from "./book-utils";

export type { Book, BookFrontmatter, BookMeta };

const booksDir = path.join(process.cwd(), "content", "books");

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

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^(https?:)?\/\//i.test(trimmed)) return trimmed;
  if (/^(mailto:|tel:|sms:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function readBook(slug: string): {
  data: BookFrontmatter;
  content: string;
} {
  const raw = fs.readFileSync(path.join(booksDir, `${slug}.md`), "utf8");
  const { data, content } = matter(raw);
  const fm = data as Record<string, unknown>;
  const ratingRaw = Number(fm.rating);
  return {
    data: {
      title: asString(fm.title),
      author: asString(fm.author),
      coverImage: asString(fm.coverImage),
      coverImageAlt: asString(fm.coverImageAlt),
      rating: Number.isFinite(ratingRaw) ? Math.max(0, Math.min(5, ratingRaw)) : 0,
      readOn: normalizeDate(fm.readOn),
      amazonLink: normalizeUrl(asString(fm.amazonLink)),
      tags: asStringArray(fm.tags),
    },
    content,
  };
}

export function getAllBookSlugs(): string[] {
  if (!fs.existsSync(booksDir)) return [];
  return fs
    .readdirSync(booksDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function getAllBooks(): BookMeta[] {
  return getAllBookSlugs()
    .map((slug) => ({ slug, ...readBook(slug).data }))
    .sort((a, b) => new Date(b.readOn).getTime() - new Date(a.readOn).getTime());
}

export async function getBookBySlug(slug: string): Promise<Book> {
  const { data, content } = readBook(slug);
  const processed = await remark().use(html).process(content);
  return { slug, reviewHtml: processed.toString(), ...data };
}
