#!/usr/bin/env node
// Pulls datapoints from Beeminder goals listed as a metric's
// `beeminderSource`. Caches them to content/goals/cache/beeminder-metrics.json
// so the goals loader can fold them into the metric's progress sum.
//
// This is how FocusMate sessions flow to the website: FocusMate has a
// built-in Beeminder integration that posts a +1 datapoint per
// completed session to a chosen Beeminder goal. We just mirror those
// datapoints into the matching website metric.
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
    JSON.stringify({ generatedAt: new Date().toISOString(), byMetric: {} }, null, 2)
  );
  console.log(`[bm-metrics] ${reason} — wrote empty cache.`);
}

if (!username || !authToken) {
  writeEmpty("Missing BEEMINDER_USERNAME or BEEMINDER_AUTH_TOKEN");
  process.exit(0);
}

// 1. Walk the metrics folder for any with beeminderSource set.
const metricsDir = path.join(process.cwd(), "content", "goals", "metrics");
if (!fs.existsSync(metricsDir)) {
  writeEmpty("No metrics dir");
  process.exit(0);
}

const sources = [];
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
    console.warn(`[bm-metrics] Skipping ${f}: ${err.message}`);
  }
}

if (sources.length === 0) {
  writeEmpty("No metrics reference a Beeminder source");
  process.exit(0);
}

console.log(
  `[bm-metrics] Pulling datapoints for ${sources.length} metric(s): ${sources
    .map((s) => `${s.metricSlug}←${s.beeminderSource}`)
    .join(", ")}`
);

// 2. For each, GET /users/{user}/goals/{slug}/datapoints.json
const byMetric = {};
let failures = 0;
for (const { metricSlug, beeminderSource } of sources) {
  const url = `https://www.beeminder.com/api/v1/users/${encodeURIComponent(
    username
  )}/goals/${encodeURIComponent(
    beeminderSource
  )}/datapoints.json?auth_token=${encodeURIComponent(authToken)}&count=10000`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`${res.status} ${txt}`);
    }
    const datapoints = await res.json();
    if (!Array.isArray(datapoints)) {
      throw new Error("Datapoints response wasn't an array.");
    }
    // Beeminder datapoints carry `daystamp` (YYYYMMDD), `value`, `id`.
    // Convert to {date: "YYYY-MM-DD", value, id}.
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
      `[bm-metrics] ${metricSlug}: pulled ${byMetric[metricSlug].length} datapoint(s).`
    );
  } catch (err) {
    failures += 1;
    console.error(
      `[bm-metrics] Failed to pull ${beeminderSource}: ${err.message}`
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
    },
    null,
    2
  )
);
console.log(`[bm-metrics] Wrote ${outPath}.`);

if (failures > 0) {
  // Non-fatal — we still write the partial cache.
  console.error(
    `[bm-metrics] ${failures} source(s) failed. Their metrics will show 0 until next run.`
  );
}
