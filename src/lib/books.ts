import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import type {
  Book,
  BookFrontmatter,
  BookMeta,
  Reading,
  ReadingMeta,
} from "./book-utils";

export type { Book, BookFrontmatter, BookMeta, Reading, ReadingMeta };

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

type RawReading = { date: string; notes: string; videoUrl: string };

function readBookRaw(slug: string): {
  data: BookFrontmatter;
  readings: RawReading[];
} {
  const raw = fs.readFileSync(path.join(booksDir, `${slug}.md`), "utf8");
  const { data, content } = matter(raw);
  const fm = data as Record<string, unknown>;
  const ratingRaw = Number(fm.rating);

  let readings: RawReading[];
  if (Array.isArray(fm.readings)) {
    readings = fm.readings
      .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
      .map((r) => ({
        date: normalizeDate(r.date),
        notes: asString(r.notes),
        videoUrl: normalizeUrl(asString(r.videoUrl)),
      }));
  } else if (fm.readOn || content.trim()) {
    // Legacy: single reading derived from readOn frontmatter + body markdown
    readings = [
      {
        date: normalizeDate(fm.readOn),
        notes: content,
        videoUrl: "",
      },
    ];
  } else {
    readings = [];
  }
  // Sort chronologically — oldest first.
  readings.sort((a, b) => {
    const ta = new Date(a.date).getTime();
    const tb = new Date(b.date).getTime();
    return (isNaN(ta) ? 0 : ta) - (isNaN(tb) ? 0 : tb);
  });

  return {
    data: {
      title: asString(fm.title),
      author: asString(fm.author),
      authorPhoto: asString(fm.authorPhoto),
      authorPhotoAlt: asString(fm.authorPhotoAlt),
      coverImage: asString(fm.coverImage),
      coverImageAlt: asString(fm.coverImageAlt),
      rating: Number.isFinite(ratingRaw)
        ? Math.max(0, Math.min(5, ratingRaw))
        : 0,
      amazonLink: normalizeUrl(asString(fm.amazonLink)),
      tags: asStringArray(fm.tags),
    },
    readings,
  };
}

function computeLastReadOn(readings: RawReading[]): string {
  if (readings.length === 0) return "";
  return readings[readings.length - 1].date;
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
    .map((slug) => {
      const { data, readings } = readBookRaw(slug);
      const readingDates: ReadingMeta[] = readings.map((r) => ({
        date: r.date,
        videoUrl: r.videoUrl,
      }));
      return {
        slug,
        ...data,
        readings: readingDates,
        lastReadOn: computeLastReadOn(readings),
      };
    })
    .sort(
      (a, b) =>
        new Date(b.lastReadOn).getTime() - new Date(a.lastReadOn).getTime()
    );
}

export async function getBookBySlug(slug: string): Promise<Book> {
  const { data, readings } = readBookRaw(slug);
  const rendered: Reading[] = await Promise.all(
    readings.map(async (r) => {
      const processed = await remark().use(html).process(r.notes || "");
      return {
        date: r.date,
        notesHtml: processed.toString(),
        videoUrl: r.videoUrl,
      };
    })
  );
  return {
    slug,
    ...data,
    readings: rendered,
    lastReadOn: computeLastReadOn(readings),
  };
}
