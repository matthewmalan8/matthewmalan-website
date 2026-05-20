// Server-only loader for the categorized Goals system. Reads markdown
// files from content/goals/<category>/*.md.

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type {
  AccountabilityBuddy,
  Goal,
  GoalCategory,
  GoalShare,
  GoalStatus,
  GoalTimeframe,
} from "./goals-data-types";
import { CATEGORIES } from "./goals-data-types";

const baseDir = path.join(process.cwd(), "content", "goals");

function asString(v: unknown): string {
  return v == null ? "" : String(v);
}
function asNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function asBool(v: unknown): boolean {
  return v === true || v === "true";
}
function normalizeDate(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v ?? "");
}

function normalizeStatus(v: unknown): GoalStatus {
  const s = String(v ?? "active");
  if (s === "successful" || s === "failed" || s === "archived") return s;
  return "active";
}
function normalizeTimeframe(v: unknown): GoalTimeframe {
  const s = String(v ?? "week");
  if (s === "quarter" || s === "year" || s === "custom") return s;
  return "week";
}
function normalizeCategory(v: unknown, fallback: GoalCategory): GoalCategory {
  const s = String(v ?? "");
  return CATEGORIES.includes(s as GoalCategory)
    ? (s as GoalCategory)
    : fallback;
}
function normalizeShare(v: unknown): GoalShare {
  const s = String(v ?? "none");
  if (s === "dropshipping" || s === "gym") return s;
  return "none";
}

export function getAllGoals(): Goal[] {
  if (!fs.existsSync(baseDir)) return [];
  const goals: Goal[] = [];
  for (const category of CATEGORIES) {
    const dir = path.join(baseDir, category.toLowerCase());
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".md")) continue;
      const slug = file.replace(/\.md$/, "");
      try {
        const raw = fs.readFileSync(path.join(dir, file), "utf8");
        const { data, content } = matter(raw);
        const fm = data as Record<string, unknown>;
        goals.push({
          slug,
          title: asString(fm.title),
          description: content.trim(),
          category: normalizeCategory(fm.category, category),
          timeframe: normalizeTimeframe(fm.timeframe),
          group: asString(fm.group),
          target: asNumber(fm.target),
          current: asNumber(fm.current),
          unit: asString(fm.unit),
          startDate: normalizeDate(fm.startDate),
          deadline: normalizeDate(fm.deadline),
          status: normalizeStatus(fm.status),
          pinned: asBool(fm.pinned),
          shareTo: normalizeShare(fm.shareTo),
          accountabilityBuddy: asString(fm.accountabilityBuddy),
          notifyOnFailure: asBool(fm.notifyOnFailure),
          isPledge: asBool(fm.isPledge),
          pledgeAmount: asNumber(fm.pledgeAmount),
          pledgeRecipient: asString(fm.pledgeRecipient),
          pledgeVideoUrl: asString(fm.pledgeVideoUrl),
          pledgeProofImage: asString(fm.pledgeProofImage),
          lastUpdated: normalizeDate(fm.lastUpdated),
        });
      } catch (err) {
        console.warn(`[goals] Failed to parse ${file}:`, err);
      }
    }
  }
  return goals;
}

export function getAccountabilityBuddies(): AccountabilityBuddy[] {
  const dir = path.join(baseDir, "buddies");
  if (!fs.existsSync(dir)) return [];
  const buddies: AccountabilityBuddy[] = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".md")) continue;
    const slug = file.replace(/\.md$/, "");
    try {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);
      const fm = data as Record<string, unknown>;
      buddies.push({
        slug,
        name: asString(fm.name),
        email: asString(fm.email),
        notes: content.trim(),
      });
    } catch (err) {
      console.warn(`[buddies] Failed to parse ${file}:`, err);
    }
  }
  return buddies;
}
