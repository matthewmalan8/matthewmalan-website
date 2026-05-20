// Pure types + math for the /goals/ Success calendar. Safe to import
// from client components — no fs. The fs-using loader lives in
// goals-server.ts.

export type GoogleTask = {
  id: string;
  listId: string;
  listTitle: string;
  title: string;
  notes: string;
  status: "needsAction" | "completed";
  completed: string | null;
  due: string | null;
  updated: string;
};

export type GoalTaskCache = {
  generatedAt: string;
  lists?: Array<{ id: string; title: string }>;
  byDate: Record<string, GoogleTask[]>;
};

// ---- Success / streak math ------------------------------------------------

// A day is "successful" if it had at least one task AND all of that day's
// tasks are completed. Days with no tasks at all don't count toward
// either numerator or denominator.
export function isSuccessfulDay(tasks: GoogleTask[]): boolean {
  if (tasks.length === 0) return false;
  return tasks.every((t) => t.status === "completed");
}

export function isPartialOrFailedDay(tasks: GoogleTask[]): boolean {
  if (tasks.length === 0) return false;
  return tasks.some((t) => t.status !== "completed");
}

export type SuccessSummary = {
  totalDaysWithTasks: number;
  successfulDays: number;
  successRatePct: number;
};

export function computeSuccessSummary(cache: GoalTaskCache): SuccessSummary {
  let totalDaysWithTasks = 0;
  let successfulDays = 0;
  for (const tasks of Object.values(cache.byDate)) {
    if (tasks.length === 0) continue;
    totalDaysWithTasks += 1;
    if (isSuccessfulDay(tasks)) successfulDays += 1;
  }
  return {
    totalDaysWithTasks,
    successfulDays,
    successRatePct:
      totalDaysWithTasks > 0
        ? Math.round((successfulDays / totalDaysWithTasks) * 100)
        : 0,
  };
}

// ---- Streak utilities -----------------------------------------------------

function shiftDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map((p) => parseInt(p, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type StreakRecord = { length: number; lastDay: string };

// Current streak: walk backwards from today, only counting consecutive
// successful days. If today has no tasks yet OR is partial, we apply a
// one-day grace (start counting from yesterday) so the user isn't punished
// for the streak resetting at midnight before they finish their day.
export function computeCurrentSuccessStreak(cache: GoalTaskCache): number {
  const successDays = new Set<string>();
  const partialDays = new Set<string>();
  for (const [day, tasks] of Object.entries(cache.byDate)) {
    if (tasks.length === 0) continue;
    if (isSuccessfulDay(tasks)) successDays.add(day);
    else partialDays.add(day);
  }
  if (successDays.size === 0) return 0;

  let cursor = todayIso();
  // Grace day: if today has no tasks tracked yet OR is still partial,
  // start the count at yesterday.
  if (!successDays.has(cursor)) {
    cursor = shiftDays(cursor, -1);
  }

  let streak = 0;
  while (successDays.has(cursor)) {
    streak += 1;
    cursor = shiftDays(cursor, -1);
    // A partial/failed day breaks the streak; an empty day (no tasks)
    // is also a break — we don't want streaks to span untracked gaps.
    if (partialDays.has(cursor)) break;
  }
  return streak;
}

export function computeLongestSuccessStreak(
  cache: GoalTaskCache
): StreakRecord {
  const days = Object.entries(cache.byDate)
    .filter(([, tasks]) => tasks.length > 0 && isSuccessfulDay(tasks))
    .map(([day]) => day)
    .sort();
  if (days.length === 0) return { length: 0, lastDay: "" };

  let bestLength = 1;
  let bestEnd = days[0];
  let runLength = 1;
  let runEnd = days[0];
  for (let i = 1; i < days.length; i++) {
    if (days[i] === shiftDays(days[i - 1], 1)) {
      runLength += 1;
      runEnd = days[i];
    } else {
      if (runLength > bestLength) {
        bestLength = runLength;
        bestEnd = runEnd;
      }
      runLength = 1;
      runEnd = days[i];
    }
  }
  if (runLength > bestLength) {
    bestLength = runLength;
    bestEnd = runEnd;
  }
  return { length: bestLength, lastDay: bestEnd };
}
