// Server-only loader for the categorized Goals system. Reads markdown
// files from content/goals/*.

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type {
  CounterLog,
  DailySource,
  Goal,
  GoalCategory,
  GoalShare,
  GoalStatus,
  GoalTimeframe,
  Metric,
  MetricEntry,
  PledgeEvaluation,
  PledgeProof,
  PledgeRecipient,
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
  return String(v ?? "").slice(0, 10);
}

function normalizeStatus(v: unknown): GoalStatus {
  const s = String(v ?? "active");
  if (s === "successful" || s === "failed" || s === "archived") return s;
  return "active";
}
function normalizeTimeframe(v: unknown): GoalTimeframe {
  const s = String(v ?? "daily");
  if (
    s === "daily" ||
    s === "quarter" ||
    s === "year" ||
    s === "custom" ||
    s === "week"
  ) {
    return s;
  }
  return "daily";
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
function normalizeRecipient(
  v: unknown,
  shareTo: GoalShare
): PledgeRecipient {
  // Hard rule: shareTo: dropshipping → tiktok (never charity)
  if (shareTo === "dropshipping") return "tiktok";
  const s = String(v ?? "charity");
  if (s === "tiktok") return "tiktok";
  return "charity";
}
function normalizeDailySource(v: unknown): DailySource {
  const s = String(v ?? "counter");
  if (s === "tasks") return "tasks";
  return "counter";
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

// ----- Counter logs (manual ticks for pledge evaluation) ----------------

export function getAllCounterLogs(): CounterLog[] {
  const dir = path.join(baseDir, "counter-logs");
  if (!fs.existsSync(dir)) return [];
  const out: CounterLog[] = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".md")) continue;
    const slug = file.replace(/\.md$/, "");
    try {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);
      const fm = data as Record<string, unknown>;
      out.push({
        slug,
        date: normalizeDate(fm.date),
        counter: asString(fm.counter),
        value: asNumber(fm.value) || 1,
        note: content.trim(),
      });
    } catch (err) {
      console.warn(`[counter-logs] Failed to parse ${file}:`, err);
    }
  }
  return out;
}

// ----- Pledge proofs ---------------------------------------------------

export function getAllPledgeProofs(): PledgeProof[] {
  const dir = path.join(baseDir, "pledge-proofs");
  if (!fs.existsSync(dir)) return [];
  const out: PledgeProof[] = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".md")) continue;
    const slug = file.replace(/\.md$/, "");
    try {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);
      const fm = data as Record<string, unknown>;
      out.push({
        slug,
        date: normalizeDate(fm.date),
        goalSlug: asString(fm.goalSlug),
        tiktokUsername: asString(fm.tiktokUsername),
        tiktokAvatar: asString(fm.tiktokAvatar),
        tiktokProfileUrl: asString(fm.tiktokProfileUrl),
        screenshot: asString(fm.screenshot),
        note: content.trim(),
      });
    } catch (err) {
      console.warn(`[pledge-proofs] Failed to parse ${file}:`, err);
    }
  }
  return out;
}

// ----- Auto-source metric entries (existing) ----------------------------

function fmDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string") return value.slice(0, 10);
  return "";
}
function fmNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function autoEntriesDropshippingHours(): MetricEntry[] {
  const dir = path.join(process.cwd(), "content", "dropshipping", "daily");
  if (!fs.existsSync(dir)) return [];
  const out: MetricEntry[] = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".md")) continue;
    try {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data } = matter(raw);
      const fm = data as Record<string, unknown>;
      const date = fmDate(fm.date);
      if (!date) continue;
      const hours = fmNumber(fm.hoursWorked) + fmNumber(fm.minutesWorked) / 60;
      if (hours <= 0) continue;
      out.push({
        slug: `auto-dropshipping-hours-${date}`,
        metricSlug: "dropshipping-hours",
        date,
        value: hours,
        note: "",
      });
    } catch {
      // skip
    }
  }
  return out;
}

function autoEntriesGymVisits(): MetricEntry[] {
  const cachePath = path.join(
    process.cwd(),
    "content",
    "gym",
    "cache",
    "workouts.json"
  );
  if (!fs.existsSync(cachePath)) return [];
  let workouts: Array<{ start_time?: string; date?: string }>;
  try {
    workouts = JSON.parse(fs.readFileSync(cachePath, "utf8"));
  } catch {
    return [];
  }
  if (!Array.isArray(workouts)) return [];
  const uniqueDates = new Set<string>();
  for (const w of workouts) {
    const start = typeof w.start_time === "string" ? w.start_time : "";
    if (start) {
      const d = new Date(start);
      if (!Number.isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        uniqueDates.add(`${y}-${m}-${day}`);
        continue;
      }
    }
    if (typeof w.date === "string" && w.date)
      uniqueDates.add(w.date.slice(0, 10));
  }
  return Array.from(uniqueDates).map((date) => ({
    slug: `auto-gym-visits-${date}`,
    metricSlug: "gym-visits",
    date,
    value: 1,
    note: "",
  }));
}

function autoEntriesPodcastEpisodes(): MetricEntry[] {
  const dir = path.join(process.cwd(), "content", "episodes");
  if (!fs.existsSync(dir)) return [];
  const out: MetricEntry[] = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".md")) continue;
    try {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data } = matter(raw);
      const fm = data as Record<string, unknown>;
      const date = fmDate(fm.date);
      if (!date) continue;
      out.push({
        slug: `auto-podcast-${file.replace(/\.md$/, "")}`,
        metricSlug: "podcast-episodes-uploaded",
        date,
        value: 1,
        note: "",
      });
    } catch {
      // skip
    }
  }
  return out;
}

function getAutoEntries(): MetricEntry[] {
  return [
    ...autoEntriesDropshippingHours(),
    ...autoEntriesGymVisits(),
    ...autoEntriesPodcastEpisodes(),
  ];
}

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

// ----- Goal loader ------------------------------------------------------

export function getAllGoals(): Goal[] {
  if (!fs.existsSync(baseDir)) return [];
  const entries = [...getAllMetricEntries(), ...getAutoEntries()];
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
        const current = metricSlug ? computedFromMetric : manualCurrent;
        const shareTo = normalizeShare(fm.shareTo);
        goals.push({
          slug,
          title: asString(fm.title),
          description: content.trim(),
          subDescription: asString(fm.subDescription),
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
          shareTo,
          pledgeAmount: asNumber(fm.pledgeAmount),
          pledgeRecipient: normalizeRecipient(fm.pledgeRecipient, shareTo),
          dailySource: normalizeDailySource(fm.dailySource),
          counterSlug: asString(fm.counterSlug),
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

// ----- Pledge history (computed at build time) -------------------------

export function getPledgeHistory(): PledgeEvaluation[] {
  const cachePath = path.join(baseDir, "cache", "pledge-history.json");
  if (!fs.existsSync(cachePath)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    if (!Array.isArray(data?.evaluations)) return [];
    return data.evaluations as PledgeEvaluation[];
  } catch {
    return [];
  }
}
