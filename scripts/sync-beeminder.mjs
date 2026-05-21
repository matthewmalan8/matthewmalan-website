#!/usr/bin/env node
// Pushes a datapoint to Beeminder for every active goal that has a
// `beeminderSlug` set. Runs as part of the daily build (and on demand
// via the dedicated workflow).
//
// Required env vars:
//   BEEMINDER_USERNAME       — your Beeminder username
//   BEEMINDER_AUTH_TOKEN     — from https://www.beeminder.com/settings/account#account-permissions
//
// Optional:
//   BEEMINDER_DRY_RUN=1      — log instead of POSTing
//
// Behavior:
// - Reads every goal file. For each `active` goal with a non-empty
//   `beeminderSlug`, computes the "current value" the same way the
//   website does (manual `current` field OR sum of metric entries
//   incl. auto sources).
// - Sends one datapoint per goal:
//     daystamp = today (YYYYMMDD)
//     value    = current value
//     comment  = goal title + slug
//   Beeminder UPSERTs by comment, so re-running the script overwrites
//   today's datapoint instead of stacking up duplicates.
//
// Fails open if creds aren't set so dev/local builds don't break.

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const username = process.env.BEEMINDER_USERNAME;
const authToken = process.env.BEEMINDER_AUTH_TOKEN;
const dryRun = process.env.BEEMINDER_DRY_RUN === "1";

if (!username || !authToken) {
  console.log(
    "[beeminder] Missing BEEMINDER_USERNAME or BEEMINDER_AUTH_TOKEN — skipping sync."
  );
  process.exit(0);
}

const baseDir = path.join(process.cwd(), "content", "goals");

function asString(v) {
  return v == null ? "" : String(v);
}
function asNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function asBool(v) {
  return v === true || v === "true";
}
function normalizeDate(v) {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v ?? "");
}

function readMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".md")) continue;
    const slug = f.replace(/\.md$/, "");
    try {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      const { data, content } = matter(raw);
      out.push({ slug, fm: data ?? {}, body: content });
    } catch (err) {
      console.warn(`[beeminder] Skipping ${f}: ${err.message}`);
    }
  }
  return out;
}

const CATEGORIES = ["family", "fundamentals", "finance", "fitness"];

// Load every manual metric entry.
const manualEntries = readMarkdown(path.join(baseDir, "metric-entries")).map(
  ({ slug, fm }) => ({
    slug,
    metricSlug: asString(fm.metric),
    date: normalizeDate(fm.date),
    value: asNumber(fm.value),
  })
);

// Auto entries (mirror src/lib/goals-data.ts logic so values match the
// website).
function autoEntriesDropshippingHours() {
  const dir = path.join(process.cwd(), "content", "dropshipping", "daily");
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".md")) continue;
    try {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      const { data } = matter(raw);
      const fm = data ?? {};
      const dateRaw =
        fm.date instanceof Date
          ? fm.date.toISOString().slice(0, 10)
          : asString(fm.date).slice(0, 10);
      if (!dateRaw) continue;
      const hours = asNumber(fm.hoursWorked) + asNumber(fm.minutesWorked) / 60;
      if (hours <= 0) continue;
      out.push({ metricSlug: "dropshipping-hours", date: dateRaw, value: hours });
    } catch {
      // skip
    }
  }
  return out;
}

function autoEntriesGymVisits() {
  const cachePath = path.join(
    process.cwd(),
    "content",
    "gym",
    "cache",
    "workouts.json"
  );
  if (!fs.existsSync(cachePath)) return [];
  let workouts;
  try {
    workouts = JSON.parse(fs.readFileSync(cachePath, "utf8"));
  } catch {
    return [];
  }
  if (!Array.isArray(workouts)) return [];
  const dates = new Set();
  for (const w of workouts) {
    const start = typeof w?.start_time === "string" ? w.start_time : "";
    if (start) {
      const d = new Date(start);
      if (!Number.isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        dates.add(`${y}-${m}-${day}`);
        continue;
      }
    }
    if (typeof w?.date === "string" && w.date) {
      dates.add(w.date.slice(0, 10));
    }
  }
  return Array.from(dates).map((date) => ({
    metricSlug: "gym-visits",
    date,
    value: 1,
  }));
}

function autoEntriesPodcastEpisodes() {
  const dir = path.join(process.cwd(), "content", "episodes");
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".md")) continue;
    try {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      const { data } = matter(raw);
      const fm = data ?? {};
      const dateRaw =
        fm.date instanceof Date
          ? fm.date.toISOString().slice(0, 10)
          : asString(fm.date).slice(0, 10);
      if (!dateRaw) continue;
      out.push({
        metricSlug: "podcast-episodes-uploaded",
        date: dateRaw,
        value: 1,
      });
    } catch {
      // skip
    }
  }
  return out;
}

const allEntries = [
  ...manualEntries,
  ...autoEntriesDropshippingHours(),
  ...autoEntriesGymVisits(),
  ...autoEntriesPodcastEpisodes(),
];

function sumEntries(metricSlug, startDate, deadline) {
  if (!metricSlug) return 0;
  let total = 0;
  for (const e of allEntries) {
    if (e.metricSlug !== metricSlug) continue;
    if (startDate && e.date < startDate) continue;
    if (deadline && e.date > deadline) continue;
    total += e.value;
  }
  return total;
}

// Gather active Beeminder-linked goals.
const targets = [];
for (const cat of CATEGORIES) {
  const dir = path.join(baseDir, cat);
  for (const { slug, fm } of readMarkdown(dir)) {
    const beeminderSlug = asString(fm.beeminderSlug);
    if (!beeminderSlug) continue;
    const status = asString(fm.status) || "active";
    if (status !== "active") continue;
    const metricSlug = asString(fm.metricSlug);
    const startDate = normalizeDate(fm.startDate);
    const deadline = normalizeDate(fm.deadline);
    const current = metricSlug
      ? sumEntries(metricSlug, startDate, deadline)
      : asNumber(fm.current);
    targets.push({
      goalSlug: slug,
      title: asString(fm.title) || slug,
      beeminderSlug,
      current,
    });
  }
}

if (targets.length === 0) {
  console.log("[beeminder] No goals have a beeminderSlug set — nothing to sync.");
  process.exit(0);
}

function daystamp() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

async function sync(goal) {
  const url = `https://www.beeminder.com/api/v1/users/${encodeURIComponent(
    username
  )}/goals/${encodeURIComponent(goal.beeminderSlug)}/datapoints.json`;
  const body = new URLSearchParams({
    auth_token: authToken,
    daystamp: daystamp(),
    value: String(goal.current),
    comment: `matthewmalan.com sync · ${goal.title} (${goal.goalSlug})`,
    // requestid keeps re-runs idempotent: same id → upsert today's point.
    requestid: `mm-${goal.goalSlug}-${daystamp()}`,
  });
  if (dryRun) {
    console.log(
      `[beeminder dry-run] Would push ${goal.current} → ${goal.beeminderSlug} (${goal.title})`
    );
    return;
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Beeminder ${res.status} for ${goal.beeminderSlug}: ${txt}`);
  }
  console.log(
    `[beeminder] Synced ${goal.current} → ${goal.beeminderSlug} (${goal.title})`
  );
}

let failures = 0;
for (const goal of targets) {
  try {
    await sync(goal);
  } catch (err) {
    failures += 1;
    console.error(`[beeminder] ${err.message}`);
  }
}

if (failures > 0) {
  // Don't fail the build over a Beeminder hiccup; we'll retry next day.
  console.error(
    `[beeminder] ${failures} sync error(s) — non-fatal, will retry on next run.`
  );
}
