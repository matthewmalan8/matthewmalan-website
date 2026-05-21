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

// Gather active Beeminder-linked goals (all fields we might need for
// auto-create + datapoint sync).
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
      category: cat,
      beeminderSlug,
      beeminderPledge: asNumber(fm.beeminderPledge),
      target: asNumber(fm.target),
      current,
      unit: asString(fm.unit) || "things",
      deadline,
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

// Beeminder timezone — Matthew is in Mesa, AZ which is UTC-7 year-round
// (Arizona doesn't observe DST). Pinning this per-goal so Beeminder
// can't fall back to an account default that drifts.
const BEEMINDER_TIMEZONE = "America/Phoenix";

// The contract:
//   Website deadline "YYYY-MM-DD" means 23:59 MST that day.
//   Beeminder must enforce at THE SAME MOMENT — 23:59 MST that same day.
//   (The nightly sync runs at 23:45 MST so all data is in Beeminder
//    14 minutes before the enforcement moment.)
// Example:
//   Website: 2026-05-22  →  Beeminder: 2026-05-22 23:59 MST
//
// Two parts:
//   1. `goaldate` is set to noon MST on the website deadline day. That
//      puts the timestamp squarely inside the right calendar day in
//      MST (Date.UTC(y, m-1, d, 19, 0) = noon MST).
//   2. The goal's `deadline` field is set to -60 (see beeminderCreate
//      below), which makes Beeminder evaluate at 23:59:00 of that
//      day in the goal's timezone.
// Together: Beeminder charges at precisely 23:59 MST on the website
// deadline date — no buffer.
function beeminderGoaldate(websiteDeadline) {
  if (!websiteDeadline) return null;
  const [y, m, d] = websiteDeadline.split("-").map((p) => parseInt(p, 10));
  if (!y || !m || !d) return null;
  return Math.floor(Date.UTC(y, m - 1, d, 19, 0, 0) / 1000);
}

async function beeminderGet(slug) {
  const url = `https://www.beeminder.com/api/v1/users/${encodeURIComponent(
    username
  )}/goals/${encodeURIComponent(slug)}.json?auth_token=${encodeURIComponent(
    authToken
  )}`;
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Beeminder GET ${slug}: ${res.status} ${txt}`);
  }
  return res.json();
}

async function beeminderCreate(goal) {
  // "hustler" = Do More by date. Works for every kind of goal we have
  // (sessions, hours, episodes, $). User can change goal type on
  // Beeminder's UI after creation if they want a different road shape.
  const goaldate = beeminderGoaldate(goal.deadline);
  const params = {
    auth_token: authToken,
    slug: goal.beeminderSlug,
    title: goal.title,
    goal_type: "hustler",
    gunits: goal.unit.slice(0, 64),
    // initval is the starting value at goal creation time.
    initval: goal.current,
    secret: "true", // private to you on Beeminder; flip on UI if you want public
    // Pin the timezone so Beeminder evaluates day boundaries in MST,
    // not whatever account-wide default might be set.
    timezone: BEEMINDER_TIMEZONE,
    // Daily deadline: 60 seconds BEFORE midnight = 23:59:00 of the
    // goaldate's local day. Combined with the +1 day offset baked into
    // beeminderGoaldate(), this means Beeminder charges at exactly
    // 23:59 MST on (websiteDeadline + 1 day).
    deadline: "-60",
    // Exactly two of goaldate/goalval/rate are required. We provide
    // goaldate + goalval; Beeminder computes the required rate.
  };
  if (goaldate) params.goaldate = goaldate;
  if (goal.target > 0) params.goalval = goal.target;
  // Beeminder starting pledge (USD). Only applied at create time.
  if (goal.beeminderPledge > 0) params.pledge = goal.beeminderPledge;

  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) body.set(k, String(v));

  const url = `https://www.beeminder.com/api/v1/users/${encodeURIComponent(
    username
  )}/goals.json`;

  if (dryRun) {
    const enforcement = goaldate
      ? new Date(goaldate * 1000).toLocaleString("en-US", {
          timeZone: BEEMINDER_TIMEZONE,
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "(no deadline)";
    const pledgeStr =
      goal.beeminderPledge > 0 ? `, pledge=$${goal.beeminderPledge}` : "";
    console.log(
      `[beeminder dry-run] Would CREATE ${goal.beeminderSlug} (title="${goal.title}", target=${goal.target} ${goal.unit}${pledgeStr}, beeminder enforces 23:59 MST on ${enforcement})`
    );
    return true;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (res.ok) {
    console.log(
      `[beeminder] Created goal ${goal.beeminderSlug} — title="${goal.title}", target=${goal.target} ${goal.unit}, goaldate=${goal.deadline}+1d.`
    );
    return true;
  }
  const txt = await res.text();
  // 422 + "Slug has already been taken" can happen if the goal was
  // created in a previous run and our GET cache missed it. Treat as
  // "already exists" and proceed to sync datapoint.
  if (res.status === 422 && /taken|exist/i.test(txt)) {
    console.log(
      `[beeminder] Goal ${goal.beeminderSlug} already existed (422) — continuing to datapoint sync.`
    );
    return true;
  }
  throw new Error(
    `Beeminder CREATE ${goal.beeminderSlug}: ${res.status} ${txt}`
  );
}

async function beeminderPushDatapoint(goal) {
  const url = `https://www.beeminder.com/api/v1/users/${encodeURIComponent(
    username
  )}/goals/${encodeURIComponent(goal.beeminderSlug)}/datapoints.json`;
  const body = new URLSearchParams({
    auth_token: authToken,
    daystamp: daystamp(),
    value: String(goal.current),
    comment: `matthewmalan.com sync · ${goal.title} (${goal.goalSlug})`,
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

async function processGoal(goal) {
  // Step 1: Does the Beeminder goal exist?
  let existing = null;
  if (!dryRun) {
    try {
      existing = await beeminderGet(goal.beeminderSlug);
    } catch (err) {
      console.error(
        `[beeminder] GET check for ${goal.beeminderSlug} failed (${err.message}) — assuming missing and trying create.`
      );
    }
  }

  // Step 2: Create if missing.
  if (!existing) {
    await beeminderCreate(goal);
  }

  // Step 3: Push today's datapoint regardless.
  await beeminderPushDatapoint(goal);
}

let failures = 0;
for (const goal of targets) {
  try {
    await processGoal(goal);
  } catch (err) {
    failures += 1;
    console.error(`[beeminder] ${err.message}`);
  }
}

if (failures > 0) {
  // Non-fatal — we'll retry on the next run.
  console.error(
    `[beeminder] ${failures} sync error(s) — non-fatal, will retry on next run.`
  );
}
