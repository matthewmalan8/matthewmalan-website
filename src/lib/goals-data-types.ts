// Pure types + helpers for the new categorized Goals system.
// Safe to import from client + server.

export type GoalCategory = "Family" | "Fundamentals" | "Finance" | "Fitness";
export type GoalTimeframe = "week" | "quarter" | "year" | "custom";
export type GoalStatus = "active" | "successful" | "failed" | "archived";
export type GoalShare = "none" | "dropshipping" | "gym";

export type Goal = {
  slug: string;
  title: string;
  description: string;
  category: GoalCategory;
  timeframe: GoalTimeframe;
  // Optional rollup: goals with the same `group` value (e.g. "family-w-2026-w20")
  // are surfaced together on the /goals/ page as a single grouped KPI.
  group: string;
  target: number;
  // `current` is the manually entered fallback. If `metricSlug` is set and
  // entries exist within [startDate, deadline], the computed metric total
  // overrides this value at load time.
  current: number;
  unit: string;
  startDate: string;
  deadline: string;
  status: GoalStatus;
  pinned: boolean;
  shareTo: GoalShare;
  // Pledge fields (Finance only)
  isPledge: boolean;
  pledgeAmount: number;
  pledgeRecipient: string;
  pledgeVideoUrl: string;
  pledgeProofImage: string;
  // Optional metric link — when set, progress is summed from metric
  // entries within [startDate, deadline].
  metricSlug: string;
  lastUpdated: string;
};

export type Metric = {
  slug: string;
  name: string;
  unit: string;
  description: string;
};

export type MetricEntry = {
  slug: string;
  metricSlug: string;
  date: string; // YYYY-MM-DD
  value: number;
  note: string;
};

export const CATEGORIES: GoalCategory[] = [
  "Family",
  "Fundamentals",
  "Finance",
  "Fitness",
];

export const TIMEFRAMES: Array<{ value: GoalTimeframe; label: string }> = [
  { value: "week", label: "Week" },
  { value: "quarter", label: "Quarter" },
  { value: "year", label: "Year" },
  { value: "custom", label: "Custom" },
];

export const TIMEFRAME_ORDER: Record<GoalTimeframe, number> = {
  week: 0,
  quarter: 1,
  year: 2,
  custom: 3,
};

// % progress, clamped 0..100. Treats zero/negative targets as not yet
// computable (returns 0).
export function progressPct(goal: Goal): number {
  if (!goal.target || goal.target <= 0) return 0;
  const pct = (goal.current / goal.target) * 100;
  if (!Number.isFinite(pct)) return 0;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function isActive(goal: Goal): boolean {
  return goal.status === "active";
}

export function daysUntil(iso: string): number {
  if (!iso) return 0;
  const target = new Date(iso).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

// Group active goals: same category + same timeframe + same `group` value
// become one rolled-up KPI on the /goals/ page. Goals without a `group`
// are returned as singleton groups (one goal per group).
export type GoalGroup = {
  key: string;
  category: GoalCategory;
  timeframe: GoalTimeframe;
  // Combined progress across all goals in the group (average of each
  // goal's individual progressPct). A grouped KPI is "complete" only
  // when every member hits 100%.
  combinedPct: number;
  goals: Goal[];
};

export function groupGoals(goals: Goal[]): GoalGroup[] {
  const buckets = new Map<string, GoalGroup>();
  for (const g of goals) {
    const key = g.group
      ? `${g.category}|${g.timeframe}|${g.group}`
      : `${g.category}|${g.timeframe}|${g.slug}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        key,
        category: g.category,
        timeframe: g.timeframe,
        combinedPct: 0,
        goals: [],
      };
      buckets.set(key, bucket);
    }
    bucket.goals.push(g);
  }
  for (const b of buckets.values()) {
    if (b.goals.length === 0) continue;
    const sum = b.goals.reduce((s, g) => s + progressPct(g), 0);
    b.combinedPct = Math.round(sum / b.goals.length);
  }
  return Array.from(buckets.values()).sort((a, b) => {
    if (a.category !== b.category) {
      return CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category);
    }
    return TIMEFRAME_ORDER[a.timeframe] - TIMEFRAME_ORDER[b.timeframe];
  });
}
