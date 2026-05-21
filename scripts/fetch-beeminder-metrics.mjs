#!/usr/bin/env node
// Pulls Beeminder data into the local cache. Two passes:
//
// 1. ALL goals (GET /users/{user}/goals.json). Saves a snapshot per
//    goal: title, curval, pledge, losedate, safebuf, rate, etc. This
//    powers the "Money on the line" dashboard on /goals/.
//
// 2. Datapoints for every metric with a non-empty `beeminderSource`
//    (e.g. focusmate-sessions ← `focusmate` Beeminder goal). Those
//    datapoints flow back through the goals loader so website goals
//    linked to the metric auto-update their progress.
//
// Both pieces live in content/goals/cache/beeminder-metrics.json so
// the website can read everything it needs from one place.
//
// Required env vars (same as sync-beeminder.mjs):
//   BEEMINDER_USERNAME
//   BEEMINDER_AUTH_TOKEN
//
// Fails open if creds are missing — local builds still work.

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const username = process.env.BEEMINDER_USERNAME;
const authToken = process.env.BEEMINDER_AUTH_TOKEN;

const cacheDir = path.join(process.cwd(), "content", "goals", "cache");
const outPath = path.join(cacheDir, "beeminder-metrics.json");

function writeEmpty(reason) {
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        byMetric: {},
        byBeeminderGoal: {},
      },
      null,
      2
    )
  );
  console.log(`[bm-fetch] ${reason} — wrote empty cache.`);
}

if (!username || !authToken) {
  writeEmpty("Missing BEEMINDER_USERNAME or BEEMINDER_AUTH_TOKEN");
  process.exit(0);
}

// ---------- 1. Fetch all goals (snapshots) ----------

const byBeeminderGoal = {};
try {
  const url = `https://www.beeminder.com/api/v1/users/${encodeURIComponent(
    username
  )}/goals.json?auth_token=${encodeURIComponent(authToken)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${res.status} ${await res.text()}`);
  }
  const goals = await res.json();
  if (Array.isArray(goals)) {
    for (const g of goals) {
      if (!g?.slug) continue;
      // Skip archived (won_or_lost && in graveyard). Beeminder marks
      // these via `won` / `lost` flags but easiest filter is
      // `frozen: true` (no longer being tracked).
      if (g.frozen === true) continue;
      byBeeminderGoal[g.slug] = {
        slug: g.slug,
        title: g.title || g.slug,
        goalval: typeof g.goalval === "number" ? g.goalval : null,
        curval: typeof g.curval === "number" ? g.curval : 0,
        pledge: typeof g.pledge === "number" ? g.pledge : 0,
        losedate: typeof g.losedate === "number" ? g.losedate : 0,
        safebuf: typeof g.safebuf === "number" ? g.safebuf : 0,
        rate: typeof g.rate === "number" ? g.rate : null,
        runits: g.runits || "",
        gunits: g.gunits || "",
        goalType: g.goal_type || "",
        url: `https://www.beeminder.com/${encodeURIComponent(
          username
        )}/${encodeURIComponent(g.slug)}/`,
      };
    }
    console.log(
      `[bm-fetch] Pulled snapshots for ${Object.keys(byBeeminderGoal).length} active Beeminder goal(s).`
    );
  }
} catch (err) {
  console.error(`[bm-fetch] Failed to fetch goals list: ${err.message}`);
}

// ---------- 2. Datapoints for metrics with beeminderSource ----------

const metricsDir = path.join(process.cwd(), "content", "goals", "metrics");
const sources = [];
if (fs.existsSync(metricsDir)) {
  for (const f of fs.readdirSync(metricsDir)) {
    if (!f.endsWith(".md")) continue;
    try {
      const raw = fs.readFileSync(path.join(metricsDir, f), "utf8");
      const { data } = matter(raw);
      const beeminderSource = String(data?.beeminderSource ?? "").trim();
      if (!beeminderSource) continue;
      sources.push({
        metricSlug: f.replace(/\.md$/, ""),
        beeminderSource,
      });
    } catch (err) {
      console.warn(`[bm-fetch] Skipping metric ${f}: ${err.message}`);
    }
  }
}

const byMetric = {};
let dpFailures = 0;
for (const { metricSlug, beeminderSource } of sources) {
  const url = `https://www.beeminder.com/api/v1/users/${encodeURIComponent(
    username
  )}/goals/${encodeURIComponent(
    beeminderSource
  )}/datapoints.json?auth_token=${encodeURIComponent(authToken)}&count=10000`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`${res.status} ${await res.text()}`);
    }
    const datapoints = await res.json();
    if (!Array.isArray(datapoints)) {
      throw new Error("Datapoints response wasn't an array.");
    }
    byMetric[metricSlug] = datapoints.map((dp) => ({
      id: dp?.id ?? "",
      date:
        typeof dp?.daystamp === "string" && dp.daystamp.length === 8
          ? `${dp.daystamp.slice(0, 4)}-${dp.daystamp.slice(4, 6)}-${dp.daystamp.slice(6, 8)}`
          : "",
      value: Number(dp?.value) || 0,
      comment: dp?.comment ?? "",
    }));
    console.log(
      `[bm-fetch] ${metricSlug} ← ${beeminderSource}: pulled ${byMetric[metricSlug].length} datapoint(s).`
    );
  } catch (err) {
    dpFailures += 1;
    console.error(
      `[bm-fetch] Failed to pull datapoints from ${beeminderSource}: ${err.message}`
    );
  }
}

fs.mkdirSync(cacheDir, { recursive: true });
fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      byMetric,
      byBeeminderGoal,
    },
    null,
    2
  )
);
console.log(`[bm-fetch] Wrote ${outPath}.`);

if (dpFailures > 0) {
  console.error(
    `[bm-fetch] ${dpFailures} metric source(s) failed datapoint fetch. Non-fatal — partial cache written.`
  );
}
