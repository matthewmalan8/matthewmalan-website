#!/usr/bin/env node
// Computes the next episode number from existing episodes and updates
// the CMS config so the "Episode Number" field is pre-filled when
// creating a new episode. Runs before each build via the `prebuild`
// script in package.json. Modifies the deployed copy of config.yml
// only — the source file in the repo keeps the placeholder.

import fs from "node:fs";
import path from "node:path";

const episodesDir = path.join(process.cwd(), "content", "episodes");
const configPath = path.join(process.cwd(), "public", "admin", "config.yml");
const MARKER = "# AUTO-EPISODE-NUMBER";

let max = 0;
if (fs.existsSync(episodesDir)) {
  for (const f of fs.readdirSync(episodesDir)) {
    if (!f.endsWith(".md")) continue;
    const content = fs.readFileSync(path.join(episodesDir, f), "utf8");
    const m = content.match(/^episodeNumber:\s*(\d+)/m);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
}
const next = max + 1;

const config = fs.readFileSync(configPath, "utf8");
const updated = config.replace(
  /default:\s*\d+,\s*# AUTO-EPISODE-NUMBER/,
  `default: ${next}, ${MARKER}`
);

if (updated === config) {
  console.warn(
    `Did not find "${MARKER}" marker in ${configPath} — leaving config unchanged.`
  );
} else {
  fs.writeFileSync(configPath, updated, "utf8");
  console.log(`CMS default episode number set to ${next} (found ${max} existing episodes).`);
}
