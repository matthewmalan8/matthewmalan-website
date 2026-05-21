// Server-only loader for the categorized Goals system. Reads markdown
// files from content/goals/<category>/*.md.

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type {
  Goal,
  GoalCategory,
  GoalShare,
  GoalStatus,
  GoalTimeframe,
  Metric,
  MetricEntry,
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

export function getAllMetrics(): Metric[] {
  const dir = path.join(baseDir, "metrics");
  if (!fs.existsSync(dir)) return [];
  const out: Metric[] = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".md")) continue;
    const slug = file.replace(/\.md$/, "");
    try {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);
      const fm = data as Record<string, unknown>;
      out.push({
        slug,
        name: asString(fm.name) || slug,
        unit: asString(fm.unit),
        description: content.trim(),
      });
    } catch (err) {
      console.warn(`[metrics] Failed to parse ${file}:`, err);
    }
  }
  return out;
}

export function getAllMetricEntries(): MetricEntry[] {
  const dir = path.join(baseDir, "metric-entries");
  if (!fs.existsSync(dir)) return [];
  const out: MetricEntry[] = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".md")) continue;
    const slug = file.replace(/\.md$/, "");
    try {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);
      const fm = data as Record<string, unknown>;
      out.push({
        slug,
        metricSlug: asString(fm.metric),
        date: normalizeDate(fm.date),
        value: asNumber(fm.value),
        note: content.trim(),
      });
    } catch (err) {
      console.warn(`[metric-entries] Failed to parse ${file}:`, err);
    }
  }
  return out;
}

// Sum the matching metric entries within [startDate, deadline] inclusive.
// Empty bounds default to "include everything".
function sumEntries(
  entries: MetricEntry[],
  metricSlug: string,
  startDate: string,
  deadline: string
): number {
  if (!metricSlug) return 0;
  let total = 0;
  for (const e of entries) {
    if (e.metricSlug !== metricSlug) continue;
    if (startDate && e.date < startDate) continue;
    if (deadline && e.date > deadline) continue;
    total += e.value;
  }
  return total;
}

export function getAllGoals(): Goal[] {
  if (!fs.existsSync(baseDir)) return [];
  const entries = getAllMetricEntries();
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
        const startDate = normalizeDate(fm.startDate);
        const deadline = normalizeDate(fm.deadline);
        const metricSlug = asString(fm.metricSlug);
        const manualCurrent = asNumber(fm.current);
        const computedFromMetric = metricSlug
          ? sumEntries(entries, metricSlug, startDate, deadline)
          : 0;
        // If a metric is linked, prefer the computed sum; otherwise the
        // hand-entered `current` value.
        const current = metricSlug ? computedFromMetric : manualCurrent;
        goals.push({
          slug,
          title: asString(fm.title),
          description: content.trim(),
          category: normalizeCategory(fm.category, category),
          timeframe: normalizeTimeframe(fm.timeframe),
          group: asString(fm.group),
          target: asNumber(fm.target),
          current,
          unit: asString(fm.unit),
          startDate,
          deadline,
          status: normalizeStatus(fm.status),
          pinned: asBool(fm.pinned),
          shareTo: normalizeShare(fm.shareTo),
          isPledge: asBool(fm.isPledge),
          pledgeAmount: asNumber(fm.pledgeAmount),
          pledgeRecipient: asString(fm.pledgeRecipient),
          pledgeVideoUrl: asString(fm.pledgeVideoUrl),
          pledgeProofImage: asString(fm.pledgeProofImage),
          metricSlug,
          lastUpdated: normalizeDate(fm.lastUpdated),
        });
      } catch (err) {
        console.warn(`[goals] Failed to parse ${file}:`, err);
      }
    }
  }
  return goals;
}

