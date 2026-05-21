#!/usr/bin/env node
// Pushes today's "successful day" status (1 if all Google Tasks for
// today are completed, 0 otherwise) to the Beeminder goal
// `successful-days`. Auto-creates that Beeminder goal with a $5
// pledge if it doesn't exist yet.
//
// "Successful day" matches the same logic used by the Success
// calendar on /goals/: today has ≥ 1 task AND every task is in
// `completed` status.
//
// Required env vars:
//   BEEMINDER_USERNAME
//   BEEMINDER_AUTH_TOKEN
//
// Optional:
//   BEEMINDER_DRY_RUN=1               — log instead of POSTing
//   SUCCESS_DAY_BEEMINDER_SLUG        — override the default slug
//                                       (defaults to "successful-days")
//
// Runs as part of `deploy:aws` so it fires at every deploy (including
// the daily 23:45 MST + midnight MST crons).

import fs from "node:fs";
import path from "node:path";

const username = process.env.BEEMINDER_USERNAME;
const authToken = process.env.BEEMINDER_AUTH_TOKEN;
const dryRun = process.env.BEEMINDER_DRY_RUN === "1";
const slug = process.env.SUCCESS_DAY_BEEMINDER_SLUG || "successful-days";

const TIMEZONE = "America/Phoenix";
const PLEDGE = 5;

if (!username || !authToken) {
  console.log(
    "[success-day] Missing BEEMINDER_USERNAME or BEEMINDER_AUTH_TOKEN — skipping."
  );
  process.exit(0);
}

// MST today (Arizona, no DST → UTC-7 always).
function mstTodayIso() {
  const now = new Date();
  const mst = new Date(now.getTime() - 7 * 60 * 60 * 1000);
  return mst.toISOString().slice(0, 10);
}
function isoToDaystamp(iso) {
  return iso.replace(/-/g, "");
}

const cachePath = path.join(
  process.cwd(),
  "content",
  "goals",
  "cache",
  "tasks.json"
);

let cache = { byDate: {} };
if (fs.existsSync(cachePath)) {
  try {
    cache = JSON.parse(fs.readFileSync(cachePath, "utf8")) ?? { byDate: {} };
  } catch (err) {
    console.warn(`[success-day] Tasks cache unparseable: ${err.message}`);
  }
}

const today = mstTodayIso();
const tasks = cache.byDate?.[today] ?? [];
const completed = tasks.filter((t) => t.status === "completed").length;
const successful = tasks.length > 0 && completed === tasks.length;
const value = successful ? 1 : 0;

console.log(
  `[success-day] ${today} (MST): ${completed}/${tasks.length} tasks done → ${
    successful ? "SUCCESS (push 1)" : "NOT successful (push 0)"
  }`
);

if (dryRun) {
  console.log(`[success-day] DRY RUN — skipping API calls.`);
  process.exit(0);
}

async function goalExists() {
  const url = `https://www.beeminder.com/api/v1/users/${encodeURIComponent(
    username
  )}/goals/${encodeURIComponent(slug)}.json?auth_token=${encodeURIComponent(
    authToken
  )}`;
  const res = await fetch(url);
  if (res.status === 404) return false;
  if (!res.ok) {
    console.warn(
      `[success-day] Existence check ${res.status} — will try create anyway.`
    );
    return false;
  }
  return true;
}

async function createGoal() {
  // Far-future goaldate so the road keeps going forever. We pick
  // (today + 1 year) at noon MST. Combined with `deadline: -60`
  // (23:59 MST evaluation) and `pledge: 5`, this gives a daily
  // do-more goal that charges $5 each time you derail.
  const now = new Date();
  const future = new Date(now);
  future.setUTCFullYear(future.getUTCFullYear() + 1);
  const goaldate = Math.floor(
    Date.UTC(
      future.getUTCFullYear(),
      future.getUTCMonth(),
      future.getUTCDate(),
      19,
      0,
      0
    ) / 1000
  );
  const params = new URLSearchParams({
    auth_token: authToken,
    slug,
    title: "Daily successful day (all tasks done)",
    goal_type: "hustler",
    gunits: "successful days",
    initval: "0",
    secret: "true",
    timezone: TIMEZONE,
    deadline: "-60",
    goalval: "365",
    goaldate: String(goaldate),
    pledge: String(PLEDGE),
  });
  const url = `https://www.beeminder.com/api/v1/users/${encodeURIComponent(
    username
  )}/goals.json`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  if (res.ok) {
    console.log(`[success-day] Created Beeminder goal "${slug}" with $${PLEDGE} pledge.`);
    return;
  }
  const txt = await res.text();
  if (res.status === 422 && /taken|exist/i.test(txt)) {
    console.log(`[success-day] Goal "${slug}" already exists — proceeding.`);
    return;
  }
  throw new Error(`Beeminder CREATE ${slug}: ${res.status} ${txt}`);
}

async function pushDatapoint() {
  const url = `https://www.beeminder.com/api/v1/users/${encodeURIComponent(
    username
  )}/goals/${encodeURIComponent(slug)}/datapoints.json`;
  const params = new URLSearchParams({
    auth_token: authToken,
    daystamp: isoToDaystamp(today),
    value: String(value),
    comment: successful
      ? `All ${tasks.length} tasks done ✓`
      : `${completed}/${tasks.length} tasks done — incomplete`,
    requestid: `mm-success-day-${today}`,
  });
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  if (!res.ok) {
    throw new Error(`Beeminder DATAPOINT ${slug}: ${res.status} ${await res.text()}`);
  }
  console.log(`[success-day] Pushed value=${value} for ${today} to "${slug}".`);
}

try {
  if (!(await goalExists())) {
    await createGoal();
  }
  await pushDatapoint();
} catch (err) {
  console.error(`[success-day] ${err.message}`);
  // Non-fatal so build/deploy still succeed.
}
