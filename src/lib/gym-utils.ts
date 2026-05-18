export type GymSet = {
  type: string;
  weightKg: number | null;
  reps: number | null;
  distanceMeters: number | null;
  durationSeconds: number | null;
  rpe: number | null;
};

export type ExerciseInstance = {
  templateId: string;
  title: string;
  notes: string;
  sets: GymSet[];
};

export type GymWorkout = {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date (start_time)
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  durationSeconds: number;
  exercises: ExerciseInstance[];
};

export type ExerciseTemplate = {
  id: string;
  slug: string;
  title: string;
  exerciseType: string;
  primaryMuscleGroup: string;
  secondaryMuscleGroups: string[];
  equipment: string;
};

export function slugifyExerciseTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function kgToLbs(kg: number | null): number | null {
  if (kg == null) return null;
  return Math.round(kg * 2.20462 * 2) / 2; // round to nearest 0.5 lb
}

export function formatWeight(kg: number | null): string {
  const lbs = kgToLbs(kg);
  if (lbs == null || lbs <= 0) return "—";
  return `${lbs} lb`;
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatLongDate(date: string): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(date: string): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---- Streak ---------------------------------------------------------------

// Collapse multiple workouts on the same day into one bucket per ISO date,
// summing duration. Used by every streak helper below.
function daysWithTotalSeconds(workouts: GymWorkout[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const w of workouts) {
    if (!w.date) continue;
    map.set(w.date, (map.get(w.date) ?? 0) + (w.durationSeconds || 0));
  }
  return map;
}

// Pure ISO-date math — no timezone surprises (everything stays at midnight).
function shiftDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map((p) => parseInt(p, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

function todayIso(): string {
  return isoDate(new Date());
}

// Current streak ending today (with one-day grace if no workout today yet).
// `predicate` decides which days count.
function currentStreakWith(
  workouts: GymWorkout[],
  predicate: (totalSeconds: number) => boolean
): number {
  if (workouts.length === 0) return 0;
  const dayTotals = daysWithTotalSeconds(workouts);
  const qualifyingDays = new Set<string>();
  for (const [day, secs] of dayTotals.entries()) {
    if (predicate(secs)) qualifyingDays.add(day);
  }
  if (qualifyingDays.size === 0) return 0;

  let cursor = todayIso();
  // Grace day: if no qualifying workout today, start from yesterday.
  if (!qualifyingDays.has(cursor)) {
    cursor = shiftDays(cursor, -1);
  }
  let streak = 0;
  while (qualifyingDays.has(cursor)) {
    streak += 1;
    cursor = shiftDays(cursor, -1);
  }
  return streak;
}

export type StreakRecord = { length: number; lastDay: string };

function longestStreakWith(
  workouts: GymWorkout[],
  predicate: (totalSeconds: number) => boolean
): StreakRecord {
  const dayTotals = daysWithTotalSeconds(workouts);
  const qualifying = Array.from(dayTotals.entries())
    .filter(([, secs]) => predicate(secs))
    .map(([day]) => day)
    .sort();
  if (qualifying.length === 0) return { length: 0, lastDay: "" };

  let bestLength = 1;
  let bestEnd = qualifying[0];
  let runLength = 1;
  let runEnd = qualifying[0];

  for (let i = 1; i < qualifying.length; i++) {
    if (qualifying[i] === shiftDays(qualifying[i - 1], 1)) {
      runLength += 1;
      runEnd = qualifying[i];
    } else {
      if (runLength > bestLength) {
        bestLength = runLength;
        bestEnd = runEnd;
      }
      runLength = 1;
      runEnd = qualifying[i];
    }
  }
  // Final run.
  if (runLength > bestLength) {
    bestLength = runLength;
    bestEnd = runEnd;
  }
  return { length: bestLength, lastDay: bestEnd };
}

// "Worked out at all" — any duration > 0.
export function getCurrentGymStreak(workouts: GymWorkout[]): number {
  return currentStreakWith(workouts, (secs) => secs > 0);
}

export function getLongestGymStreak(workouts: GymWorkout[]): StreakRecord {
  return longestStreakWith(workouts, (secs) => secs > 0);
}

// "Worked out for at least an hour that day" — sums duration across all
// workouts on the same date, so 30m + 45m on the same day qualifies.
export const ONE_HOUR_SECONDS = 3600;

export function getCurrentHourPlusStreak(workouts: GymWorkout[]): number {
  return currentStreakWith(workouts, (secs) => secs >= ONE_HOUR_SECONDS);
}

export function getLongestHourPlusStreak(
  workouts: GymWorkout[]
): StreakRecord {
  return longestStreakWith(workouts, (secs) => secs >= ONE_HOUR_SECONDS);
}

// ---- Time totals ----------------------------------------------------------

export type TimeRange = "week" | "month" | "last3months" | "year" | "all";

export const TIME_RANGES: Array<{ value: TimeRange; label: string }> = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "last3months", label: "Last 3 months" },
  { value: "year", label: "This year" },
  { value: "all", label: "All time" },
];

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - out.getDay()); // Sunday-start week
  return out;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}

function rangeCutoff(range: TimeRange): Date | null {
  const now = new Date();
  if (range === "week") return startOfWeek(now);
  if (range === "month") return startOfMonth(now);
  if (range === "last3months") {
    const c = new Date(now);
    c.setMonth(c.getMonth() - 3);
    return c;
  }
  if (range === "year") return startOfYear(now);
  return null;
}

export function getWorkoutsInRange(
  workouts: GymWorkout[],
  range: TimeRange
): GymWorkout[] {
  const cutoff = rangeCutoff(range);
  if (!cutoff) return workouts;
  return workouts.filter(
    (w) => new Date(w.startTime).getTime() >= cutoff.getTime()
  );
}

export function getTotalSecondsInRange(
  workouts: GymWorkout[],
  range: TimeRange
): number {
  return getWorkoutsInRange(workouts, range).reduce(
    (sum, w) => sum + w.durationSeconds,
    0
  );
}

export function getRangeStats(
  workouts: GymWorkout[],
  range: TimeRange
): {
  totalSeconds: number;
  workoutCount: number;
  averageSeconds: number;
  uniqueDays: number;
} {
  const inRange = getWorkoutsInRange(workouts, range);
  const totalSeconds = inRange.reduce(
    (sum, w) => sum + (w.durationSeconds || 0),
    0
  );
  const workoutCount = inRange.length;
  const days = new Set<string>();
  for (const w of inRange) if (w.date) days.add(w.date);
  return {
    totalSeconds,
    workoutCount,
    averageSeconds: workoutCount > 0 ? Math.round(totalSeconds / workoutCount) : 0,
    uniqueDays: days.size,
  };
}

export function isSetEmpty(set: GymSet): boolean {
  return (
    (set.weightKg == null || set.weightKg <= 0) &&
    (set.reps == null || set.reps <= 0) &&
    (set.durationSeconds == null || set.durationSeconds <= 0) &&
    (set.distanceMeters == null || set.distanceMeters <= 0)
  );
}

export function isWorkoutIncomplete(workout: GymWorkout): boolean {
  if (workout.exercises.length === 0) return true;
  for (const ex of workout.exercises) {
    for (const set of ex.sets) {
      if (!isSetEmpty(set)) return false;
    }
  }
  return true;
}

export function formatSetSummary(set: GymSet): string {
  const parts: string[] = [];
  if (set.weightKg != null && set.weightKg > 0) {
    parts.push(formatWeight(set.weightKg));
  }
  if (set.reps != null && set.reps > 0) {
    parts.push(`${set.reps} reps`);
  }
  if (set.durationSeconds != null && set.durationSeconds > 0) {
    parts.push(formatDuration(set.durationSeconds));
  }
  if (set.distanceMeters != null && set.distanceMeters > 0) {
    const meters = set.distanceMeters;
    parts.push(
      meters >= 1000
        ? `${(meters / 1000).toFixed(2)} km`
        : `${Math.round(meters)} m`
    );
  }
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0];
  if (parts[0].endsWith(" lb") && parts[1].endsWith(" reps")) {
    return `${parts[0]} × ${parts[1]}`;
  }
  return parts.join(" · ");
}

// ---- Exercise stats -------------------------------------------------------

export type ExerciseHistoryEntry = {
  workoutId: string;
  workoutTitle: string;
  date: string;
  sets: GymSet[];
};

export type BestPR = {
  /** Estimated 1RM (Epley): weight × (1 + reps/30). */
  oneRmKg: number | null;
  oneRmWeightKg: number | null;
  oneRmReps: number | null;
  oneRmDate: string | null;

  /** Single-set volume: weight × reps. */
  volumeKg: number | null;
  volumeWeightKg: number | null;
  volumeReps: number | null;
  volumeDate: string | null;

  /** Best total volume in one session (sum of weight × reps across all
   * non-warmup sets of this exercise in that workout). */
  sessionVolumeKg: number | null;
  sessionVolumeSetCount: number | null;
  sessionVolumeDate: string | null;
};

export type ExerciseStats = {
  template: ExerciseTemplate;
  totalSessions: number;
  lastSessionDate: string | null;
  highestPrKg: number | null;
  highestPrDate: string | null;
  bestPR: BestPR;
  history: ExerciseHistoryEntry[];
};

function epleyOneRm(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  return weightKg * (1 + reps / 30);
}

export function getExerciseStats(
  template: ExerciseTemplate,
  workouts: GymWorkout[]
): ExerciseStats {
  const history: ExerciseHistoryEntry[] = [];
  let highestPrKg: number | null = null;
  let highestPrDate: string | null = null;
  let lastSessionDate: string | null = null;

  const bestPR: BestPR = {
    oneRmKg: null,
    oneRmWeightKg: null,
    oneRmReps: null,
    oneRmDate: null,
    volumeKg: null,
    volumeWeightKg: null,
    volumeReps: null,
    volumeDate: null,
    sessionVolumeKg: null,
    sessionVolumeSetCount: null,
    sessionVolumeDate: null,
  };

  for (const workout of workouts) {
    for (const ex of workout.exercises) {
      if (ex.templateId !== template.id) continue;
      history.push({
        workoutId: workout.id,
        workoutTitle: workout.title,
        date: workout.startTime,
        sets: ex.sets,
      });
      if (
        lastSessionDate === null ||
        new Date(workout.startTime).getTime() >
          new Date(lastSessionDate).getTime()
      ) {
        lastSessionDate = workout.startTime;
      }

      // Accumulate this session's total volume across all working sets.
      let sessionVolume = 0;
      let sessionSetCount = 0;

      for (const set of ex.sets) {
        if (set.type === "warmup") continue;
        if (set.weightKg == null || set.weightKg <= 0) continue;

        // Highest single-set weight (legacy PR)
        if (highestPrKg == null || set.weightKg > highestPrKg) {
          highestPrKg = set.weightKg;
          highestPrDate = workout.startTime;
        }

        // 1RM and volume require reps
        if (set.reps == null || set.reps <= 0) continue;

        const oneRm = epleyOneRm(set.weightKg, set.reps);
        if (bestPR.oneRmKg == null || oneRm > bestPR.oneRmKg) {
          bestPR.oneRmKg = oneRm;
          bestPR.oneRmWeightKg = set.weightKg;
          bestPR.oneRmReps = set.reps;
          bestPR.oneRmDate = workout.startTime;
        }

        const volume = set.weightKg * set.reps;
        if (bestPR.volumeKg == null || volume > bestPR.volumeKg) {
          bestPR.volumeKg = volume;
          bestPR.volumeWeightKg = set.weightKg;
          bestPR.volumeReps = set.reps;
          bestPR.volumeDate = workout.startTime;
        }

        sessionVolume += volume;
        sessionSetCount += 1;
      }

      if (
        sessionVolume > 0 &&
        (bestPR.sessionVolumeKg == null ||
          sessionVolume > bestPR.sessionVolumeKg)
      ) {
        bestPR.sessionVolumeKg = sessionVolume;
        bestPR.sessionVolumeSetCount = sessionSetCount;
        bestPR.sessionVolumeDate = workout.startTime;
      }
    }
  }

  history.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return {
    template,
    totalSessions: history.length,
    lastSessionDate,
    highestPrKg,
    highestPrDate,
    bestPR,
    history,
  };
}

export function getTemplateSessionCount(
  templateId: string,
  workouts: GymWorkout[]
): number {
  let count = 0;
  for (const w of workouts) {
    for (const ex of w.exercises) {
      if (ex.templateId === templateId) {
        count += 1;
        break;
      }
    }
  }
  return count;
}

export function getTemplateLastSessionDate(
  templateId: string,
  workouts: GymWorkout[]
): string | null {
  // workouts are pre-sorted newest first by getAllWorkouts, but don't depend on it.
  let latest: string | null = null;
  for (const w of workouts) {
    for (const ex of w.exercises) {
      if (ex.templateId !== templateId) continue;
      if (latest === null || new Date(w.startTime).getTime() > new Date(latest).getTime()) {
        latest = w.startTime;
      }
      break;
    }
  }
  return latest;
}

export type ExerciseSort =
  | "most-sessions"
  | "least-sessions"
  | "newest"
  | "oldest"
  | "alpha";

export const EXERCISE_SORTS: Array<{ value: ExerciseSort; label: string }> = [
  { value: "most-sessions", label: "Most sessions" },
  { value: "least-sessions", label: "Least sessions" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "alpha", label: "A → Z" },
];

export function sortTemplates(
  templates: ExerciseTemplate[],
  sort: ExerciseSort,
  sessionCounts: Map<string, number>,
  lastSessionDates: Map<string, string | null>
): ExerciseTemplate[] {
  const out = [...templates];
  switch (sort) {
    case "most-sessions":
      out.sort(
        (a, b) =>
          (sessionCounts.get(b.id) ?? 0) - (sessionCounts.get(a.id) ?? 0) ||
          a.title.localeCompare(b.title)
      );
      break;
    case "least-sessions":
      out.sort(
        (a, b) =>
          (sessionCounts.get(a.id) ?? 0) - (sessionCounts.get(b.id) ?? 0) ||
          a.title.localeCompare(b.title)
      );
      break;
    case "newest":
      out.sort((a, b) => {
        const da = lastSessionDates.get(a.id);
        const db = lastSessionDates.get(b.id);
        const ta = da ? new Date(da).getTime() : 0;
        const tb = db ? new Date(db).getTime() : 0;
        return tb - ta || a.title.localeCompare(b.title);
      });
      break;
    case "oldest":
      out.sort((a, b) => {
        const da = lastSessionDates.get(a.id);
        const db = lastSessionDates.get(b.id);
        const ta = da ? new Date(da).getTime() : Number.MAX_SAFE_INTEGER;
        const tb = db ? new Date(db).getTime() : Number.MAX_SAFE_INTEGER;
        return ta - tb || a.title.localeCompare(b.title);
      });
      break;
    case "alpha":
      out.sort((a, b) => a.title.localeCompare(b.title));
      break;
  }
  return out;
}

export function formatVolume(totalKg: number | null): string {
  if (totalKg == null || totalKg <= 0) return "—";
  const lbs = totalKg * 2.20462;
  return `${Math.round(lbs).toLocaleString()} lb`;
}

export function format1Rm(oneRmKg: number | null): string {
  if (oneRmKg == null || oneRmKg <= 0) return "—";
  const lbs = Math.round(oneRmKg * 2.20462 * 2) / 2;
  return `${lbs} lb`;
}

/** Format a positive PR improvement in lb (rounded). */
export function formatPrDeltaLb(deltaKg: number): string {
  const lb = (kgToLbs(deltaKg) ?? 0);
  return lb >= 10
    ? `${Math.round(lb)}`
    : `${(Math.round(lb * 2) / 2).toString()}`;
}

/** Format a PR's new absolute value in lb (rounded whole). */
export function formatPrNewLb(newKg: number): string {
  const lb = kgToLbs(newKg) ?? 0;
  return `${Math.round(lb).toLocaleString()}`;
}

export type ExercisePrInfo = {
  oneRm?: { newKg: number; deltaKg: number };
  setVolume?: { newKg: number; deltaKg: number };
  sessionVolume?: { newKg: number; deltaKg: number };
};

/** Keyed by `${workoutId}|${templateId}`. */
export type WorkoutPrMap = Record<string, ExercisePrInfo>;

/**
 * Walks each exercise's history chronologically, tracking running
 * maxes for 1RM, set volume, and session volume. For every session
 * (after the first) that beats one of those records, returns the new
 * value and the delta over the previous best. Keyed by workout id +
 * exercise template id so the calendar can attach the badge to a
 * specific exercise inside a workout.
 */
export function getWorkoutPrInfo(workouts: GymWorkout[]): WorkoutPrMap {
  const result: WorkoutPrMap = {};

  type Entry = { workout: GymWorkout; exercise: ExerciseInstance };
  const perTemplate = new Map<string, Entry[]>();
  for (const w of workouts) {
    for (const ex of w.exercises) {
      if (!ex.templateId) continue;
      const list = perTemplate.get(ex.templateId) ?? [];
      list.push({ workout: w, exercise: ex });
      perTemplate.set(ex.templateId, list);
    }
  }

  for (const [templateId, list] of perTemplate.entries()) {
    list.sort(
      (a, b) =>
        new Date(a.workout.startTime).getTime() -
        new Date(b.workout.startTime).getTime()
    );

    let maxOneRm = 0;
    let maxSetVolume = 0;
    let maxSessionVolume = 0;
    let isFirstEntry = true;

    for (const { workout, exercise } of list) {
      let bestSetOneRm = 0;
      let bestSetVolume = 0;
      let sessionVolume = 0;

      for (const set of exercise.sets) {
        if (set.type === "warmup") continue;
        if (set.weightKg == null || set.weightKg <= 0) continue;
        if (set.reps == null || set.reps <= 0) continue;
        const oneRm = set.weightKg * (1 + set.reps / 30);
        const vol = set.weightKg * set.reps;
        if (oneRm > bestSetOneRm) bestSetOneRm = oneRm;
        if (vol > bestSetVolume) bestSetVolume = vol;
        sessionVolume += vol;
      }

      const info: ExercisePrInfo = {};
      if (!isFirstEntry) {
        if (bestSetOneRm > maxOneRm) {
          info.oneRm = {
            newKg: bestSetOneRm,
            deltaKg: bestSetOneRm - maxOneRm,
          };
        }
        if (bestSetVolume > maxSetVolume) {
          info.setVolume = {
            newKg: bestSetVolume,
            deltaKg: bestSetVolume - maxSetVolume,
          };
        }
        if (sessionVolume > maxSessionVolume) {
          info.sessionVolume = {
            newKg: sessionVolume,
            deltaKg: sessionVolume - maxSessionVolume,
          };
        }
      }

      if (info.oneRm || info.setVolume || info.sessionVolume) {
        const key = `${workout.id}|${templateId}`;
        result[key] = info;
      }

      if (bestSetOneRm > maxOneRm) maxOneRm = bestSetOneRm;
      if (bestSetVolume > maxSetVolume) maxSetVolume = bestSetVolume;
      if (sessionVolume > maxSessionVolume) maxSessionVolume = sessionVolume;
      isFirstEntry = false;
    }
  }

  return result;
}

/**
 * Returns the set of ISO dates where the user hit a NEW PR (1RM,
 * set volume, or session volume) on any exercise. The first time an
 * exercise is performed doesn't count as a PR — improvements over a
 * previous best do.
 */
export function getPrDates(workouts: GymWorkout[]): Set<string> {
  const prDates = new Set<string>();

  // Bucket each exercise instance with its parent workout, then iterate
  // per-template chronologically (oldest → newest) so we can detect
  // when each PR was actually broken.
  type Entry = { workout: GymWorkout; exercise: ExerciseInstance };
  const perTemplate = new Map<string, Entry[]>();
  for (const w of workouts) {
    for (const ex of w.exercises) {
      if (!ex.templateId) continue;
      const list = perTemplate.get(ex.templateId) ?? [];
      list.push({ workout: w, exercise: ex });
      perTemplate.set(ex.templateId, list);
    }
  }

  for (const list of perTemplate.values()) {
    list.sort(
      (a, b) =>
        new Date(a.workout.startTime).getTime() -
        new Date(b.workout.startTime).getTime()
    );

    let maxOneRm = 0;
    let maxSetVolume = 0;
    let maxSessionVolume = 0;
    let isFirstEntry = true;

    for (const { workout, exercise } of list) {
      let bestSetOneRm = 0;
      let bestSetVolume = 0;
      let sessionVolume = 0;

      for (const set of exercise.sets) {
        if (set.type === "warmup") continue;
        if (set.weightKg == null || set.weightKg <= 0) continue;
        if (set.reps == null || set.reps <= 0) continue;
        const oneRm = set.weightKg * (1 + set.reps / 30);
        const vol = set.weightKg * set.reps;
        if (oneRm > bestSetOneRm) bestSetOneRm = oneRm;
        if (vol > bestSetVolume) bestSetVolume = vol;
        sessionVolume += vol;
      }

      // Skip the very first appearance of this exercise — there's
      // nothing to beat yet, so flagging it as a PR is noise.
      if (
        !isFirstEntry &&
        (bestSetOneRm > maxOneRm ||
          bestSetVolume > maxSetVolume ||
          sessionVolume > maxSessionVolume)
      ) {
        prDates.add(workout.date);
      }

      // Always update the running maxes (including the first session).
      if (bestSetOneRm > maxOneRm) maxOneRm = bestSetOneRm;
      if (bestSetVolume > maxSetVolume) maxSetVolume = bestSetVolume;
      if (sessionVolume > maxSessionVolume) maxSessionVolume = sessionVolume;

      isFirstEntry = false;
    }
  }

  return prDates;
}

export function getMuscleGroups(templates: ExerciseTemplate[]): string[] {
  const set = new Set<string>();
  for (const t of templates) {
    if (t.primaryMuscleGroup) set.add(t.primaryMuscleGroup);
  }
  return Array.from(set).sort();
}

export function humanizeMuscle(group: string): string {
  if (!group) return "";
  return group
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
