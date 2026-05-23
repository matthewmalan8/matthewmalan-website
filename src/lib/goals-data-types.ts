// Notion-template-shaped goals data. Five collections:
//   Areas         — "Areas of Life" categories (Community, Finances, etc.)
//   Goals         — Things you're working on
//   Key Results   — Measurable sub-targets that roll up to a Goal
//   Action Items  — Discrete to-dos (optional parent goal/KR)
//   Vision Board  — Aspirational image cards tagged with areas/goals
//
// Pure types, safe to import client + server.

export type GoalType = "Finite" | "Ongoing";
export type GoalStatus = "active" | "completed" | "archived";
export type ActionStatus = "todo" | "done";

export type Area = {
  slug: string;
  name: string;
  emoji: string;
  // Display order in the "Goals Progress by Category" section. Lower = first.
  order: number;
};

export type Goal = {
  slug: string;
  title: string;
  emoji: string;
  areaSlug: string;
  type: GoalType;
  toCompleteBy: string;
  completionDate: string;
  status: GoalStatus;
  // Comma-separated vision board item slugs this goal pictures.
  visionSlugs: string[];
  // Editable Markdown content. Notion template splits "Before / After"
  // sub-headings inside this body.
  notesHtml: string;
  // Order on /goals/ tables (lower = first).
  order: number;
  // Derived at load time from associated Key Results.
  computedProgressPct: number;
  keyResultsCount: number;
  keyResultsCompleted: number;
};

export type KeyResult = {
  slug: string;
  title: string;
  emoji: string;
  // Parent goal slug.
  goalSlug: string;
  target: number;
  current: number;
  unit: string;
  toCompleteBy: string;
  status: "in-progress" | "completed";
  // Optional Toggl Track mapping. When either is set, the prebuild
  // script pulls matching time entries and overrides `current`.
  togglProjectId: number; // 0 = unset
  togglTag: string;
  // Conversion from raw Toggl seconds → unit. Default 3600 (hours).
  togglDivisor: number;
};

export type ActionItem = {
  slug: string;
  title: string;
  status: ActionStatus;
  goalSlug: string;
  keyResultSlug: string;
  order: number;
};

export type VisionBoardItem = {
  slug: string;
  title: string;
  emoji: string;
  image: string;
  imageAlt: string;
  associatedAreas: string[];
  associatedGoals: string[];
};

// % progress, clamped 0..100.
export function progressPct(current: number, target: number): number {
  if (!target || target <= 0) return 0;
  const pct = (current / target) * 100;
  if (!Number.isFinite(pct)) return 0;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

// Rolled-up area progress: average of completion % across all
// non-archived goals in that area.
export type AreaProgress = Area & {
  pct: number;
  goalCount: number;
};

export function rollupAreaProgress(
  areas: Area[],
  goals: Goal[]
): AreaProgress[] {
  return areas
    .map((a) => {
      const inArea = goals.filter(
        (g) => g.areaSlug === a.slug && g.status !== "archived"
      );
      const avg =
        inArea.length === 0
          ? 0
          : Math.round(
              inArea.reduce((s, g) => s + g.computedProgressPct, 0) /
                inArea.length
            );
      return { ...a, pct: avg, goalCount: inArea.length };
    })
    .sort((x, y) => y.pct - x.pct);
}
