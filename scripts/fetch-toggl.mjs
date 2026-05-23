#!/usr/bin/env node
// Pulls time entries from Toggl Track and caches per-(project, tag)
// total seconds into content/goals/cache/toggl.json. The Key Results
// loader uses this overlay to override `current` for any KR with
// togglProjectId or togglTag set.
//
// Required env vars:
//   TOGGL_API_TOKEN — from https://track.toggl.com/profile (bottom of page)
//
// Optional:
//   TOGGL_SINCE — ISO date (YYYY-MM-DD). Defaults to 365 days ago.
//
// Fails open if creds are missing — local builds + dev still work.

import fs from "node:fs";
import path from "node:path";

const token = process.env.TOGGL_API_TOKEN;

const cacheDir = path.join(process.cwd(), "content", "goals", "cache");
const outPath = path.join(cacheDir, "toggl.json");

function writeEmpty(reason) {
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), byKey: {}, note: reason },
      null,
      2
    )
  );
  console.log(`[toggl] ${reason} — wrote empty cache.`);
}

if (!token) {
  writeEmpty("Missing TOGGL_API_TOKEN");
  process.exit(0);
}

// Toggl uses HTTP Basic auth: base64("{token}:api_token").
const auth = Buffer.from(`${token}:api_token`).toString("base64");

function isoDaysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

const since = process.env.TOGGL_SINCE || isoDaysAgo(365);
const until = new Date().toISOString().slice(0, 10);

async function tg(url) {
  const res = await fetch(url, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) {
    throw new Error(`Toggl GET ${url}: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

try {
  // v9 endpoint: /me/time_entries supports start_date + end_date.
  const url = `https://api.track.toggl.com/api/v9/me/time_entries?start_date=${since}&end_date=${until}`;
  const entries = await tg(url);
  if (!Array.isArray(entries)) {
    throw new Error("Time entries response wasn't an array.");
  }

  // Bucket by (project, tag). One entry contributes to:
  //   `proj:{project_id}|tag:` (project alone, no tag filter)
  //   `proj:0|tag:{tagname}` (tag alone, any project)
  //   `proj:{project_id}|tag:{tagname}` (combined match)
  // The loader picks whichever combo a KR specifies.
  const byKey = {};
  function bump(key, seconds) {
    byKey[key] = (byKey[key] ?? 0) + seconds;
  }

  let total = 0;
  for (const e of entries) {
    const seconds = Number(e?.duration);
    if (!Number.isFinite(seconds) || seconds <= 0) continue; // running timer = negative
    const projectId = Number(e?.project_id ?? e?.pid ?? 0) || 0;
    const tags = Array.isArray(e?.tags) ? e.tags : [];
    total += seconds;
    // Bucket project alone (no tag).
    if (projectId > 0) {
      bump(`proj:${projectId}|tag:`, seconds);
    }
    // For every tag on the entry, bucket tag-alone + combined.
    for (const tag of tags) {
      bump(`proj:0|tag:${tag}`, seconds);
      if (projectId > 0) {
        bump(`proj:${projectId}|tag:${tag}`, seconds);
      }
    }
  }

  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        since,
        until,
        entryCount: entries.length,
        totalSeconds: total,
        byKey,
      },
      null,
      2
    )
  );
  console.log(
    `[toggl] Wrote ${entries.length} entries across ${Object.keys(byKey).length} (project, tag) buckets · ${Math.round(total / 3600)} total hours → ${outPath}`
  );
} catch (err) {
  console.error(`[toggl] Fetch failed: ${err.message}`);
  writeEmpty("Fetch failed");
}
