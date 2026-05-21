#!/usr/bin/env node
// Injects "current week", "current quarter", "current year" labels into the
// hint text of each goal collection in public/goals-admin/config.yml so
// the Decap admin always shows the right label when you're creating a
// new goal. Runs at build time.

import fs from "node:fs";
import path from "node:path";

const configPath = path.join(
  process.cwd(),
  "public",
  "goals-admin",
  "config.yml"
);
if (!fs.existsSync(configPath)) {
  console.log("[goals-hint] config.yml not found — skipping.");
  process.exit(0);
}

function startOfWeekSunday(d) {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - out.getDay());
  return out;
}

function endOfWeekSaturday(start) {
  const out = new Date(start);
  out.setDate(out.getDate() + 6);
  return out;
}

function weekNumberOfYear(d) {
  // ISO-ish week number — Sunday-based for our calendar. Count Sundays
  // that have occurred this calendar year up to and including the
  // Sunday of `d`'s week.
  const firstOfYear = new Date(d.getFullYear(), 0, 1);
  const firstSunday = startOfWeekSunday(firstOfYear);
  // If Jan 1 wasn't a Sunday, jump forward to the next one for "week 1".
  if (firstSunday < firstOfYear) {
    firstSunday.setDate(firstSunday.getDate() + 7);
  }
  const thisSunday = startOfWeekSunday(d);
  const diff = Math.floor(
    (thisSunday.getTime() - firstSunday.getTime()) / (1000 * 60 * 60 * 24 * 7)
  );
  return diff + 1; // week 1, 2, 3, …
}

function shortDate(d) {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function iso(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const now = new Date();
const sunday = startOfWeekSunday(now);
const saturday = endOfWeekSaturday(sunday);
const weekNum = weekNumberOfYear(now);
const year = now.getFullYear();
const month = now.getMonth();
const quarter = Math.floor(month / 3) + 1;
const quarterStart = new Date(year, (quarter - 1) * 3, 1);
const quarterEnd = new Date(year, quarter * 3, 0);

const weekLabel = `Week ${weekNum} of ${year} (${shortDate(sunday)}–${shortDate(saturday)} · ${iso(sunday)} → ${iso(saturday)})`;
const quarterLabel = `Q${quarter} ${year} (${shortDate(quarterStart)}–${shortDate(quarterEnd)} · ${iso(quarterStart)} → ${iso(quarterEnd)})`;
const yearLabel = `Year ${year} (${iso(new Date(year, 0, 1))} → ${iso(new Date(year, 11, 31))})`;

const banner = `Current week: ${weekLabel}. Current quarter: ${quarterLabel}. Current year: ${yearLabel}.`;

// We inject after the Timeframe hint via a literal AUTO marker. If the
// marker isn't present we add it once per collection.
let src = fs.readFileSync(configPath, "utf8");

const MARKER = "# AUTO-TIMEFRAME-HINT";
const HINT_LINE = `          hint: "${banner}", ${MARKER}`;

const original = src;

// Replace any existing AUTO-TIMEFRAME-HINT line (regardless of content).
src = src.replace(
  new RegExp(`^ {10}hint: ".*?", ${MARKER}$`, "gm"),
  HINT_LINE
);

// If no AUTO marker exists yet, inject one right after each Timeframe
// `default: "week",` line.
if (!src.includes(MARKER)) {
  src = src.replace(
    /(name: "timeframe",[\s\S]*?default: "week",)/g,
    (m) => `${m}\n${HINT_LINE}`
  );
}

if (src === original) {
  console.log("[goals-hint] No changes needed.");
} else {
  fs.writeFileSync(configPath, src, "utf8");
  console.log(`[goals-hint] Updated timeframe hints → ${banner}`);
}
