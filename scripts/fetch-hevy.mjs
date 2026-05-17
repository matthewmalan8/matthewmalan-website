#!/usr/bin/env node
// Fetches workouts + exercise templates from Hevy (https://api.hevyapp.com)
// at build time. Cache files are gitignored — regenerated on every build.
//
// Set HEVY_API_KEY in GitHub Actions secrets (or a local .env) before
// running. If the key is missing the script writes empty arrays and exits
// successfully so the build doesn't fail.

import fs from "node:fs";
import path from "node:path";

const apiKey = process.env.HEVY_API_KEY;
const cacheDir = path.join(process.cwd(), "content", "gym", "cache");
const workoutsFile = path.join(cacheDir, "workouts.json");
const templatesFile = path.join(cacheDir, "exercise-templates.json");

fs.mkdirSync(cacheDir, { recursive: true });

function writeEmptyCacheIfMissing() {
  if (!fs.existsSync(workoutsFile)) fs.writeFileSync(workoutsFile, "[]");
  if (!fs.existsSync(templatesFile)) fs.writeFileSync(templatesFile, "[]");
}

if (!apiKey) {
  console.warn(
    "[hevy] HEVY_API_KEY not set — skipping fetch. /gym/ will render the empty state."
  );
  writeEmptyCacheIfMissing();
  process.exit(0);
}

const BASE = "https://api.hevyapp.com/v1";
const headers = { "api-key": apiKey, accept: "application/json" };

async function fetchPaginated(endpoint, listKey) {
  const items = [];
  let page = 1;
  // Hevy caps pageSize at 10 for workouts and 100 for exercise templates;
  // pageSize=10 is safe everywhere.
  const pageSize = 10;
  while (true) {
    const url = `${BASE}/${endpoint}?page=${page}&pageSize=${pageSize}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Hevy API ${endpoint} page ${page} returned ${res.status}: ${body}`
      );
    }
    const data = await res.json();
    const batch = data[listKey] || [];
    items.push(...batch);
    const pageCount = data.page_count ?? data.pageCount ?? 1;
    if (page >= pageCount || batch.length === 0) break;
    page += 1;
    if (page > 500) {
      // Safety stop in case the API ever returns a misleading page_count.
      console.warn(`[hevy] ${endpoint}: stopping after 500 pages`);
      break;
    }
  }
  return items;
}

try {
  console.log("[hevy] Fetching workouts...");
  const workouts = await fetchPaginated("workouts", "workouts");
  fs.writeFileSync(workoutsFile, JSON.stringify(workouts));
  console.log(`[hevy] Wrote ${workouts.length} workouts.`);

  console.log("[hevy] Fetching exercise templates...");
  const templates = await fetchPaginated(
    "exercise_templates",
    "exercise_templates"
  );
  fs.writeFileSync(templatesFile, JSON.stringify(templates));
  console.log(`[hevy] Wrote ${templates.length} exercise templates.`);
} catch (err) {
  console.error(`[hevy] Fetch failed: ${err.message}`);
  writeEmptyCacheIfMissing();
  // Don't fail the build — keep going with whatever cache exists.
  process.exit(0);
}
