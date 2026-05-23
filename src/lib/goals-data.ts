// Server-only loader for the Notion-template goals system.

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import type {
  ActionItem,
  Area,
  Goal,
  GoalStatus,
  GoalType,
  KeyResult,
  VisionBoardItem,
} from "./goals-data-types";
import { progressPct } from "./goals-data-types";

const baseDir = path.join(process.cwd(), "content", "goals");

function asString(v: unknown): string {
  return v == null ? "" : String(v);
}
function asNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function normalizeDate(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v ?? "").slice(0, 10);
}
function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  const s = asString(v).trim();
  if (!s) return [];
  return s
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}
function normalizeStatus(v: unknown): GoalStatus {
  const s = String(v ?? "active");
  if (s === "completed" || s === "archived") return s;
  return "active";
}
function normalizeType(v: unknown): GoalType {
  return String(v ?? "Finite") === "Ongoing" ? "Ongoing" : "Finite";
}

function readMarkdownDir(dir: string) {
  if (!fs.existsSync(dir)) return [];
  const out: Array<{
    slug: string;
    data: Record<string, unknown>;
    body: string;
  }> = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".md")) continue;
    const slug = file.replace(/\.md$/, "");
    try {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);
      out.push({ slug, data: (data as Record<string, unknown>) ?? {}, body: content });
    } catch (err) {
      console.warn(`[goals-data] Skipping ${file}:`, err);
    }
  }
  return out;
}

// ---- Toggl auto-overlay -----------------------------------------------

type TogglOverlay = Record<string, number>; // key: `proj:{id}|tag:{name}` → seconds

function loadTogglOverlay(): TogglOverlay {
  const p = path.join(baseDir, "cache", "toggl.json");
  if (!fs.existsSync(p)) return {};
  try {
    const data = JSON.parse(fs.readFileSync(p, "utf8"));
    return (data?.byKey ?? {}) as TogglOverlay;
  } catch {
    return {};
  }
}

function togglMatchedSeconds(
  overlay: TogglOverlay,
  projectId: number,
  tag: string
): number {
  const key = `proj:${projectId || 0}|tag:${tag || ""}`;
  return overlay[key] ?? 0;
}

// ---- Areas ------------------------------------------------------------

export function getAllAreas(): Area[] {
  return readMarkdownDir(path.join(baseDir, "areas"))
    .map(({ slug, data }) => ({
      slug,
      name: asString(data.name) || slug,
      emoji: asString(data.emoji) || "•",
      order: asNumber(data.order),
    }))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

// ---- Key Results ------------------------------------------------------

export function getAllKeyResults(): KeyResult[] {
  const overlay = loadTogglOverlay();
  return readMarkdownDir(path.join(baseDir, "key-results")).map(
    ({ slug, data }) => {
      const togglProjectId = asNumber(data.togglProjectId);
      const togglTag = asString(data.togglTag);
      const togglDivisor = asNumber(data.togglDivisor) || 3600;
      let current = asNumber(data.current);
      if (togglProjectId > 0 || togglTag) {
        const seconds = togglMatchedSeconds(overlay, togglProjectId, togglTag);
        if (seconds > 0) {
          current = Math.round((seconds / togglDivisor) * 100) / 100;
        }
      }
      const target = asNumber(data.target);
      const completionRatio = target > 0 ? current / target : 0;
      return {
        slug,
        title: asString(data.title) || slug,
        emoji: asString(data.emoji) || "🎯",
        goalSlug: asString(data.goal),
        target,
        current,
        unit: asString(data.unit),
        toCompleteBy: normalizeDate(data.toCompleteBy),
        status:
          completionRatio >= 1 || asString(data.status) === "completed"
            ? "completed"
            : "in-progress",
        togglProjectId,
        togglTag,
        togglDivisor,
      };
    }
  );
}

// ---- Goals ------------------------------------------------------------

export async function getAllGoals(): Promise<Goal[]> {
  const krs = getAllKeyResults();
  const raw = readMarkdownDir(path.join(baseDir, "goals"));
  const rendered: Goal[] = await Promise.all(
    raw.map(async ({ slug, data, body }) => {
      const processed = await remark().use(html).process(body || "");
      const notesHtml = processed.toString();
      const ourKrs = krs.filter((k) => k.goalSlug === slug);
      const completedCount = ourKrs.filter(
        (k) => k.status === "completed"
      ).length;
      const computedProgressPct =
        ourKrs.length === 0
          ? 0
          : Math.round(
              ourKrs.reduce(
                (s, k) => s + progressPct(k.current, k.target),
                0
              ) / ourKrs.length
            );
      return {
        slug,
        title: asString(data.title) || slug,
        emoji: asString(data.emoji) || "🎯",
        areaSlug: asString(data.area),
        type: normalizeType(data.type),
        toCompleteBy: normalizeDate(data.toCompleteBy),
        completionDate: normalizeDate(data.completionDate),
        status: normalizeStatus(data.status),
        visionSlugs: asStringArray(data.visions),
        notesHtml,
        order: asNumber(data.order),
        computedProgressPct,
        keyResultsCount: ourKrs.length,
        keyResultsCompleted: completedCount,
      };
    })
  );
  return rendered.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

// ---- Action Items -----------------------------------------------------

export function getAllActionItems(): ActionItem[] {
  return readMarkdownDir(path.join(baseDir, "action-items"))
    .map(({ slug, data }): ActionItem => ({
      slug,
      title: asString(data.title) || slug,
      status: asString(data.status) === "done" ? "done" : "todo",
      goalSlug: asString(data.goal),
      keyResultSlug: asString(data.keyResult),
      order: asNumber(data.order),
    }))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

// ---- Vision Board -----------------------------------------------------

export function getAllVisionBoard(): VisionBoardItem[] {
  return readMarkdownDir(path.join(baseDir, "vision-board")).map(
    ({ slug, data }) => ({
      slug,
      title: asString(data.title) || slug,
      emoji: asString(data.emoji) || "✨",
      image: asString(data.image),
      imageAlt: asString(data.imageAlt),
      associatedAreas: asStringArray(data.associatedAreas),
      associatedGoals: asStringArray(data.associatedGoals),
    })
  );
}
