#!/usr/bin/env node
// Fetches Google Tasks from every task list owned by the authed user and
// caches them grouped by completion date in content/dropshipping/cache/tasks.json.
//
// Required env vars (set as GitHub Actions secrets):
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET
//   GOOGLE_TASKS_REFRESH_TOKEN
//
// If any are missing the script writes an empty cache and exits 0 so local
// builds without credentials still succeed (mirrors fetch-hevy.mjs behavior).
//
// See docs/google-tasks-setup.md for a one-time setup walkthrough.

import fs from "node:fs";
import path from "node:path";

const cacheDir = path.join(process.cwd(), "content", "dropshipping", "cache");
const outPath = path.join(cacheDir, "tasks.json");

function writeEmpty(reason) {
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(
    outPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), byDate: {} }, null, 2)
  );
  console.log(`[tasks] ${reason} — wrote empty cache.`);
}

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_TASKS_REFRESH_TOKEN;

if (!clientId || !clientSecret || !refreshToken) {
  writeEmpty(
    "Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_TASKS_REFRESH_TOKEN"
  );
  process.exit(0);
}

async function getAccessToken() {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function gfetch(url, token) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`GET ${url} → ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function isoDay(iso) {
  // Google returns full RFC-3339 timestamps; we just want YYYY-MM-DD.
  if (!iso) return null;
  return iso.slice(0, 10);
}

try {
  const token = await getAccessToken();

  // 1. List all task lists.
  const listsRes = await gfetch(
    "https://tasks.googleapis.com/tasks/v1/users/@me/lists?maxResults=100",
    token
  );
  const lists = listsRes.items ?? [];

  // 2. Pull tasks (including completed + hidden) from each list.
  const byDate = {};
  let total = 0;
  for (const list of lists) {
    let pageToken = null;
    do {
      const url = new URL(
        `https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks`
      );
      url.searchParams.set("showCompleted", "true");
      url.searchParams.set("showHidden", "true");
      url.searchParams.set("maxResults", "100");
      if (pageToken) url.searchParams.set("pageToken", pageToken);
      const page = await gfetch(url.toString(), token);
      for (const task of page.items ?? []) {
        // Group by completion date if completed, else by due date, else by
        // updated date (fallback so nothing is invisible).
        const key =
          isoDay(task.completed) ??
          isoDay(task.due) ??
          isoDay(task.updated);
        if (!key) continue;
        if (!byDate[key]) byDate[key] = [];
        byDate[key].push({
          id: task.id,
          listId: list.id,
          listTitle: list.title,
          title: task.title ?? "(untitled task)",
          notes: task.notes ?? "",
          status: task.status, // "needsAction" or "completed"
          completed: task.completed ?? null,
          due: task.due ?? null,
          updated: task.updated,
        });
        total++;
      }
      pageToken = page.nextPageToken ?? null;
    } while (pageToken);
  }

  // Sort each day's tasks: completed first (newest done at top), then pending.
  for (const day of Object.keys(byDate)) {
    byDate[day].sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === "completed" ? -1 : 1;
      }
      const at = a.completed ?? a.updated;
      const bt = b.completed ?? b.updated;
      return bt.localeCompare(at);
    });
  }

  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        lists: lists.map((l) => ({ id: l.id, title: l.title })),
        byDate,
      },
      null,
      2
    )
  );
  console.log(
    `[tasks] Wrote ${total} tasks across ${Object.keys(byDate).length} days (${lists.length} lists) → ${outPath}`
  );
} catch (err) {
  console.error("[tasks] Fetch failed:", err.message);
  // Don't fail the build — write empty cache so the page still renders.
  writeEmpty("Fetch failed");
}
