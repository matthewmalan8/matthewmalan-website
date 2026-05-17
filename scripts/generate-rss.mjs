#!/usr/bin/env node
// Builds public/rss.xml at build time. Standard RSS 2.0 with atom:link
// self-reference. One <item> per episode markdown file. Audio lives on
// Spotify/Apple/YouTube so we link out instead of embedding enclosures.

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const SITE = "https://matthewmalan.com";
const TITLE = "Stay Hungry Podcast";
const DESCRIPTION =
  "Conversations with people who refuse to settle — entrepreneurs, athletes, and outliers on accountability, mindset, and building something real. Hosted by Matthew Malan.";
const AUTHOR = "Matthew Malan";
const EMAIL = "matt@matthewmalan.com";
const LANGUAGE = "en-us";

function xmlEscape(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(date) {
  // RSS 2.0 wants RFC-822 dates.
  return new Date(date).toUTCString();
}

const episodesDir = path.join(process.cwd(), "content", "episodes");
const episodes = !fs.existsSync(episodesDir)
  ? []
  : fs
      .readdirSync(episodesDir)
      .filter((f) => f.endsWith(".md"))
      .map((file) => {
        const slug = file.replace(/\.md$/, "");
        const raw = fs.readFileSync(path.join(episodesDir, file), "utf8");
        const { data } = matter(raw);
        return {
          slug,
          title: data.title ?? slug,
          date: data.date ?? new Date().toISOString(),
          excerpt: data.excerpt ?? "",
          image: data.image ?? null,
          episodeNumber: data.episodeNumber ?? null,
          guest: data.guest ?? null,
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

const lastBuildDate = rfc822(new Date());
const channelPubDate =
  episodes.length > 0 ? rfc822(episodes[0].date) : lastBuildDate;

const items = episodes
  .map((ep) => {
    const url = `${SITE}/podcast/${ep.slug}/`;
    const description = ep.guest
      ? `${ep.excerpt}\n\nGuest: ${ep.guest}`
      : ep.excerpt;
    return `    <item>
      <title>${xmlEscape(ep.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${rfc822(ep.date)}</pubDate>
      <description>${xmlEscape(description)}</description>
      ${ep.image ? `<enclosure url="${SITE}${ep.image}" type="image/png" />` : ""}
    </item>`;
  })
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(TITLE)}</title>
    <link>${SITE}/podcast/</link>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${xmlEscape(DESCRIPTION)}</description>
    <language>${LANGUAGE}</language>
    <managingEditor>${EMAIL} (${AUTHOR})</managingEditor>
    <webMaster>${EMAIL} (${AUTHOR})</webMaster>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <pubDate>${channelPubDate}</pubDate>
${items}
  </channel>
</rss>
`;

const outPath = path.join(process.cwd(), "public", "rss.xml");
fs.writeFileSync(outPath, xml, "utf8");
console.log(`[rss] Wrote ${episodes.length} episodes → public/rss.xml`);
