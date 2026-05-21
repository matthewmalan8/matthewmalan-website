#!/usr/bin/env node
// Runs daily via the failed-goals workflow. Looks at every active goal,
// finds the ones whose deadline has passed, and emails the accountability
// buddy attached to each one (if `notifyOnFailure` is true).
//
// Required env vars (set in GitHub Actions):
//   RESEND_API_KEY       — from https://resend.com/api-keys
//   RESEND_FROM          — verified sender, e.g. "Matthew <matt@matthewmalan.com>"
//
// Optional:
//   GOAL_NOTIFY_DRY_RUN  — set to "1" to log instead of sending.
//
// This script ONLY sends emails. It does NOT change the goal's status
// in the repo — that's intentional, so you can review and decide
// whether to mark "failed" yourself (or extend this script later to
// commit the status change back).

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM;
const dryRun = process.env.GOAL_NOTIFY_DRY_RUN === "1";

if (!apiKey || !from) {
  console.log(
    "[notify] Missing RESEND_API_KEY or RESEND_FROM — skipping (no notifications sent)."
  );
  process.exit(0);
}

const baseDir = path.join(process.cwd(), "content", "goals");
const buddiesDir = path.join(baseDir, "buddies");

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalizeDate(v) {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v ?? "");
}
function asString(v) {
  return v == null ? "" : String(v);
}
function asBool(v) {
  return v === true || v === "true";
}

function readMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".md")) continue;
    const slug = f.replace(/\.md$/, "");
    try {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      const { data, content } = matter(raw);
      out.push({ slug, fm: data, body: content });
    } catch (err) {
      console.warn(`[notify] Skipping ${f}: ${err.message}`);
    }
  }
  return out;
}

const CATEGORIES = ["family", "fundamentals", "finance", "fitness"];

const buddies = new Map();
for (const { slug, fm } of readMarkdownFiles(buddiesDir)) {
  buddies.set(slug, {
    name: asString(fm.name) || slug,
    email: asString(fm.email),
  });
}

const today = todayIso();
const overdue = [];
for (const cat of CATEGORIES) {
  const dir = path.join(baseDir, cat);
  for (const { slug, fm } of readMarkdownFiles(dir)) {
    const status = asString(fm.status) || "active";
    if (status !== "active") continue;
    const deadline = normalizeDate(fm.deadline);
    if (!deadline) continue;
    if (deadline >= today) continue; // not yet
    const notify = asBool(fm.notifyOnFailure);
    if (!notify) continue;
    const buddySlug = asString(fm.accountabilityBuddy);
    const buddy = buddies.get(buddySlug);
    if (!buddy || !buddy.email) {
      console.log(
        `[notify] Goal "${asString(fm.title) || slug}" is overdue but has no buddy email — skipping.`
      );
      continue;
    }
    overdue.push({
      slug,
      title: asString(fm.title) || slug,
      category: asString(fm.category) || cat,
      timeframe: asString(fm.timeframe),
      target: fm.target,
      current: fm.current,
      unit: asString(fm.unit),
      deadline,
      pledge: asBool(fm.isPledge)
        ? `${fm.pledgeAmount}${fm.pledgeRecipient ? ` to ${asString(fm.pledgeRecipient)}` : ""}`
        : null,
      buddy,
    });
  }
}

if (overdue.length === 0) {
  console.log("[notify] No newly overdue goals with notify-on-failure set.");
  process.exit(0);
}

console.log(`[notify] Found ${overdue.length} overdue goal(s) to notify.`);

async function sendEmail(goal) {
  const subject = `Matthew missed a goal: ${goal.title}`;
  const body = [
    `Hey ${goal.buddy.name.split(/\s+/)[0]},`,
    "",
    `Matthew set this goal as something to hold him accountable to. As of today (${today}) the deadline has passed and he didn't hit it:`,
    "",
    `• ${goal.title}`,
    `• Category: ${goal.category}`,
    `• Timeframe: ${goal.timeframe}`,
    `• Progress: ${goal.current ?? 0} / ${goal.target ?? "?"}${goal.unit ? ` ${goal.unit}` : ""}`,
    `• Deadline was: ${goal.deadline}`,
    goal.pledge ? `• Pledge on the line: $${goal.pledge}` : "",
    "",
    "If you want to give him grief about it, now's the moment.",
    "",
    "— matthewmalan.com",
  ]
    .filter(Boolean)
    .join("\n");

  if (dryRun) {
    console.log(
      `[notify dry-run] Would email ${goal.buddy.email}: "${subject}"`
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: goal.buddy.email,
      subject,
      text: body,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Resend ${res.status}: ${txt}`);
  }
  console.log(`[notify] Sent → ${goal.buddy.email} ("${goal.title}")`);
}

let failures = 0;
for (const goal of overdue) {
  try {
    await sendEmail(goal);
  } catch (err) {
    failures += 1;
    console.error(
      `[notify] Failed to email about "${goal.title}": ${err.message}`
    );
  }
}

if (failures > 0) {
  process.exit(1);
}
