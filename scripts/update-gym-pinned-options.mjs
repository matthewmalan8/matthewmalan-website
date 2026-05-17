#!/usr/bin/env node
// Generates the dropdown options for the "Pinned Exercises" field
// in /gym-admin/. Reads from the Hevy cache and writes a YAML
// `select` widget with all of the user's actually-used exercise
// titles into public/gym-admin/config.yml between the AUTO markers.

import fs from "node:fs";
import path from "node:path";

const cacheDir = path.join(process.cwd(), "content", "gym", "cache");
const workoutsFile = path.join(cacheDir, "workouts.json");
const templatesFile = path.join(cacheDir, "exercise-templates.json");
const configFile = path.join(
  process.cwd(),
  "public",
  "gym-admin",
  "config.yml"
);

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

const workouts = readJson(workoutsFile, []);
const templates = readJson(templatesFile, []);

const usedIds = new Set();
for (const w of workouts) {
  for (const ex of w.exercises ?? []) {
    if (ex.exercise_template_id) usedIds.add(ex.exercise_template_id);
  }
}

const titles = Array.from(
  new Set(
    templates
      .filter((t) => usedIds.has(t.id) && typeof t.title === "string")
      .map((t) => t.title.trim())
      .filter(Boolean)
  )
).sort((a, b) => a.localeCompare(b));

const indent = "              ";
const optionsYaml = titles
  .map((title) => `${indent}  - ${JSON.stringify(title)}`)
  .join("\n");

const replacement =
  titles.length > 0
    ? `${indent}# AUTO-EXERCISE-OPTIONS-START
${indent}field:
${indent}  label: "Exercise Name"
${indent}  name: "title"
${indent}  widget: "select"
${indent}  options:
${optionsYaml}
${indent}# AUTO-EXERCISE-OPTIONS-END`
    : `${indent}# AUTO-EXERCISE-OPTIONS-START
${indent}field: { label: "Exercise Name", name: "title", widget: "string" }
${indent}# AUTO-EXERCISE-OPTIONS-END`;

if (!fs.existsSync(configFile)) {
  console.warn(`[gym-pin] ${configFile} not found — skipping.`);
  process.exit(0);
}

const config = fs.readFileSync(configFile, "utf8");
const updated = config.replace(
  /[ \t]*# AUTO-EXERCISE-OPTIONS-START[\s\S]*?# AUTO-EXERCISE-OPTIONS-END/,
  replacement
);

if (updated === config) {
  console.warn(
    "[gym-pin] AUTO-EXERCISE-OPTIONS markers not found in config.yml — leaving unchanged."
  );
} else {
  fs.writeFileSync(configFile, updated, "utf8");
  console.log(
    `[gym-pin] Wrote ${titles.length} exercises into the pinned dropdown.`
  );
}
