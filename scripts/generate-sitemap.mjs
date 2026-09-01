#!/usr/bin/env node
// Builds public/sitemap.xml at build time. The site is currently a single
// placeholder page — this just lists the home page. Uses trailing slashes
// per the site convention.

import fs from "node:fs";
import path from "node:path";

const SITE = "https://matthewmalan.com";

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

const today = isoDate(new Date());

function urlEntry(loc, lastmod, priority) {
  return `  <url>
    <loc>${SITE}${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
}

const urls = [urlEntry("/", today, 1.0)];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

const outPath = path.join(process.cwd(), "public", "sitemap.xml");
fs.writeFileSync(outPath, xml, "utf8");
console.log(`[sitemap] Wrote ${urls.length} URL(s) → public/sitemap.xml`);
