#!/usr/bin/env node
// Builds public/sitemap.xml at build time. Lists every static page plus
// every episode, book, and gym exercise slug. Uses trailing slashes
// per the site convention.

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const SITE = "https://matthewmalan.com";

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function listSlugs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

function lastModForDir(dir) {
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => fs.statSync(path.join(dir, f)).mtimeMs);
  if (files.length === 0) return null;
  return isoDate(new Date(Math.max(...files)));
}

const today = isoDate(new Date());

const episodeSlugs = listSlugs(path.join(process.cwd(), "content", "episodes"));
const bookSlugs = listSlugs(path.join(process.cwd(), "content", "books"));

// Author slugs are derived from book frontmatter `author` fields.
function slugifyAuthor(name) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
const authorSlugs = (() => {
  const slugs = new Set();
  const booksDir = path.join(process.cwd(), "content", "books");
  if (!fs.existsSync(booksDir)) return [];
  for (const file of fs.readdirSync(booksDir)) {
    if (!file.endsWith(".md")) continue;
    try {
      const raw = fs.readFileSync(path.join(booksDir, file), "utf8");
      const { data } = matter(raw);
      if (typeof data.author === "string" && data.author.trim()) {
        const s = slugifyAuthor(data.author);
        if (s) slugs.add(s);
      }
    } catch {
      // skip
    }
  }
  return Array.from(slugs);
})();

// Gym exercise slugs come from the Hevy cache (only used templates).
let exerciseSlugs = [];
try {
  const workouts = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "content", "gym", "cache", "workouts.json"),
      "utf8"
    )
  );
  const templates = JSON.parse(
    fs.readFileSync(
      path.join(
        process.cwd(),
        "content",
        "gym",
        "cache",
        "exercise-templates.json"
      ),
      "utf8"
    )
  );
  const usedIds = new Set();
  for (const w of workouts) {
    for (const ex of w.exercises ?? []) {
      if (ex.exercise_template_id) usedIds.add(ex.exercise_template_id);
    }
  }
  exerciseSlugs = templates
    .filter((t) => usedIds.has(t.id) && typeof t.title === "string")
    .map((t) =>
      t.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    )
    .filter(Boolean);
} catch {
  // No Hevy cache yet — sitemap just won't include exercise pages.
}

const staticPages = [
  { path: "/", priority: 1.0 },
  { path: "/podcast/", priority: 0.9 },
  { path: "/books/", priority: 0.8 },
  { path: "/gym/", priority: 0.7 },
  { path: "/speaking/", priority: 0.7 },
  { path: "/dropshipping/", priority: 0.6 },
  { path: "/about/", priority: 0.5 },
  { path: "/contact/", priority: 0.5 },
];

const episodesLastMod =
  lastModForDir(path.join(process.cwd(), "content", "episodes")) ?? today;
const booksLastMod =
  lastModForDir(path.join(process.cwd(), "content", "books")) ?? today;

function urlEntry(loc, lastmod, priority) {
  return `  <url>
    <loc>${SITE}${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
}

function episodeDate(slug) {
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), "content", "episodes", `${slug}.md`),
      "utf8"
    );
    const { data } = matter(raw);
    if (data.date instanceof Date) return isoDate(data.date);
    if (typeof data.date === "string") return data.date.slice(0, 10);
  } catch {
    // fall through
  }
  return today;
}

const urls = [
  ...staticPages.map((p) =>
    urlEntry(
      p.path,
      p.path === "/podcast/"
        ? episodesLastMod
        : p.path === "/books/"
          ? booksLastMod
          : today,
      p.priority
    )
  ),
  ...episodeSlugs.map((slug) =>
    urlEntry(`/podcast/${slug}/`, episodeDate(slug), 0.8)
  ),
  ...bookSlugs.map((slug) => urlEntry(`/books/${slug}/`, booksLastMod, 0.6)),
  ...authorSlugs.map((slug) =>
    urlEntry(`/books/author/${slug}/`, booksLastMod, 0.5)
  ),
  ...exerciseSlugs.map((slug) =>
    urlEntry(`/gym/exercise/${slug}/`, today, 0.4)
  ),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

const outPath = path.join(process.cwd(), "public", "sitemap.xml");
fs.writeFileSync(outPath, xml, "utf8");
console.log(
  `[sitemap] Wrote ${urls.length} URLs (${staticPages.length} static, ${episodeSlugs.length} episodes, ${bookSlugs.length} books, ${authorSlugs.length} authors, ${exerciseSlugs.length} exercises) → public/sitemap.xml`
);
