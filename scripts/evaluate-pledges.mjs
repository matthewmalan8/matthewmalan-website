#!/usr/bin/env node
// Generates content/goals/cache/pledge-history.json — one entry per
// (pledge goal, day) telling whether that day succeeded or failed.
// Runs in prebuild so /goals/ + /dropshipping/ always have fresh data.
//
// For TODAY's entry the result is "pending" until 23:45 MST. After
// that the build at 23:45 captures the result.
//
// Dailty source resolution:
//   dailySource: "counter" → sum content/goals/counter-logs/ matching
//                            counterSlug for that day, compare to target
//   dailySource: "tasks"   → check content/goals/cache/tasks.json for
//                            that day; success = all tasks completed
//
// No env vars required.

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const baseDir = path.join(process.cwd(), "content", "goals");
const cacheDir = path.join(baseDir, "cache");
const outPath = path.join(cacheDir, "pledge-history.json");

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
  return String(v ?? "").slice(0, 10);
}

// MST today (Phoenix, no DST).
function mstNowDate() {
  const now = new Date();
  const mst = new Date(now.getTime() - 7 * 60 * 60 * 1000);
  return mst.toISOString().slice(0, 10);
}

// Iterate every YYYY-MM-DD from `start` to `end` inclusive.
function* daysBetween(start, end) {
  if (!start || !end) return;
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const startTs = Date.UTC(sy, sm - 1, sd);
  const endTs = Date.UTC(ey, em - 1, ed);
  for (let t = startTs; t <= endTs; t += 24 * 60 * 60 * 1000) {
    yield new Date(t).toISOString().slice(0, 10);
  }
}

function readMd(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".md")) continue;
    try {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      const { data, content } = matter(raw);
      out.push({ slug: f.replace(/\.md$/, ""), fm: data ?? {}, body: content });
    } catch (err) {
      console.warn(`[evaluate-pledges] Skipping ${f}: ${err.message}`);
    }
  }
  return out;
}

// ---- Gather counter logs by (counter, date) ---------------------------
const counterSums = new Map(); // key: `${counter}|${date}` -> number
for (const { fm } of readMd(path.join(baseDir, "counter-logs"))) {
  const date = normalizeDate(fm.date);
  const counter = asString(fm.counter);
  if (!date || !counter) continue;
  const value = asNumber(fm.value) || 1;
  const key = `${counter}|${date}`;
  counterSums.set(key, (counterSums.get(key) ?? 0) + value);
}

// ---- Gather Google Tasks success by date ------------------------------
const tasksByDate = (() => {
  const p = path.join(baseDir, "cache", "tasks.json");
  if (!fs.existsSync(p)) return {};
  try {
    const data = JSON.parse(fs.readFileSync(p, "utf8"));
    return data?.byDate ?? {};
  } catch {
    return {};
  }
})();

function tasksDayResult(date) {
  const tasks = tasksByDate[date] ?? [];
  if (tasks.length === 0) {
    return { achieved: 0, target: 1, complete: false };
  }
  const done = tasks.filter((t) => t?.status === "completed").length;
  return {
    achieved: done,
    target: tasks.length,
    complete: done === tasks.length,
  };
}

function counterDayResult(counterSlug, target, date) {
  const sum = counterSums.get(`${counterSlug}|${date}`) ?? 0;
  return {
    achieved: sum,
    target,
    complete: sum >= target,
  };
}

// ---- Walk every pledge goal + evaluate per day -----------------------
const today = mstNowDate();
const CATEGORIES = ["family", "fundamentals", "finance", "fitness"];

const evaluations = [];
for (const cat of CATEGORIES) {
  for (const { slug, fm } of readMd(path.join(baseDir, cat))) {
    const status = asString(fm.status) || "active";
    if (status === "archived") continue;
    const pledgeAmount = asNumber(fm.pledgeAmount);
    if (pledgeAmount <= 0) continue; // no pledge → no history to track

    const timeframe = asString(fm.timeframe) || "daily";
    const startDate = normalizeDate(fm.startDate);
    const deadline = normalizeDate(fm.deadline);
    const target = asNumber(fm.target) || 1;
    const dailySource = asString(fm.dailySource) || "counter";
    const counterSlug = asString(fm.counterSlug);
    const shareTo = asString(fm.shareTo) || "none";
    const recipient =
      shareTo === "dropshipping"
        ? "tiktok"
        : asString(fm.pledgeRecipient) === "tiktok"
          ? "tiktok"
          : "charity";

    // Date range to evaluate:
    //   daily goals → from startDate (or 30 days ago) to today
    //   one-shot goals → just the deadline day
    let evalStart, evalEnd;
    if (timeframe === "daily") {
      // Don't go further back than 60 days to keep the file reasonable.
      const sixtyDaysAgo = (() => {
        const d = new Date(`${today}T00:00:00Z`);
        d.setUTCDate(d.getUTCDate() - 60);
        return d.toISOString().slice(0, 10);
      })();
      evalStart =
        startDate && startDate > sixtyDaysAgo ? startDate : sixtyDaysAgo;
      evalEnd = today;
    } else {
      // Custom/week/quarter/year: evaluate once at the deadline.
      evalStart = deadline;
      evalEnd = deadline;
    }

    for (const date of daysBetween(evalStart, evalEnd)) {
      let dayResult;
      if (dailySource === "tasks") {
        dayResult = tasksDayResult(date);
      } else {
        dayResult = counterDayResult(counterSlug, target, date);
      }
      let result;
      if (date === today) {
        // Today: keep "pending" until end of day. Build at 23:45 MST
        // captures the truth.
        result = dayResult.complete ? "successful" : "pending";
      } else {
        result = dayResult.complete ? "successful" : "failed";
      }
      evaluations.push({
        goalSlug: slug,
        goalTitle: asString(fm.title) || slug,
        category: asString(fm.category),
        shareTo,
        date,
        result,
        achieved: dayResult.achieved,
        target: dayResult.target,
        pledgeAmount,
        pledgeRecipient: recipient,
      });
    }
  }
}

// Sort newest-first for convenience.
evaluations.sort((a, b) => {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return a.goalSlug.localeCompare(b.goalSlug);
});

// Aggregate totals
const totals = {
  successfulCount: evaluations.filter((e) => e.result === "successful").length,
  failedCount: evaluations.filter((e) => e.result === "failed").length,
  pendingCount: evaluations.filter((e) => e.result === "pending").length,
  totalLostUSD: evaluations
    .filter((e) => e.result === "failed")
    .reduce((s, e) => s + (e.pledgeAmount || 0), 0),
};

fs.mkdirSync(cacheDir, { recursive: true });
fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      todayMst: today,
      totals,
      evaluations,
    },
    null,
    2
  )
);
console.log(
  `[evaluate-pledges] ${evaluations.length} entries · ${totals.successfulCount} ✓ · ${totals.failedCount} ✗ · ${totals.pendingCount} pending · $${totals.totalLostUSD} lost`
);
