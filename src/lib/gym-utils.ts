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

export function getCurrentGymStreak(workouts: GymWorkout[]): number {
  if (workouts.length === 0) return 0;
  const days = new Set(workouts.map((w) => w.date));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let cursor = new Date(today);
  // Grace day: if no workout today, start the count from yesterday.
  if (!days.has(isoDate(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (days.has(isoDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// ---- Time totals ----------------------------------------------------------

export type TimeRange = "week" | "month" | "year" | "all";

export const TIME_RANGES: Array<{ value: TimeRange; label: string }> = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
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

export function getTotalSecondsInRange(
  workouts: GymWorkout[],
  range: TimeRange
): number {
  const now = new Date();
  let cutoff: Date | null = null;
  if (range === "week") cutoff = startOfWeek(now);
  else if (range === "month") cutoff = startOfMonth(now);
  else if (range === "year") cutoff = startOfYear(now);

  return workouts.reduce((sum, w) => {
    if (cutoff && new Date(w.startTime).getTime() < cutoff.getTime())
      return sum;
    return sum + w.durationSeconds;
  }, 0);
}

// ---- Exercise stats -------------------------------------------------------

export type ExerciseHistoryEntry = {
  workoutId: string;
  workoutTitle: string;
  date: string;
  sets: GymSet[];
};

export type ExerciseStats = {
  template: ExerciseTemplate;
  totalSessions: number;
  highestPrKg: number | null;
  highestPrDate: string | null;
  history: ExerciseHistoryEntry[];
};

export function getExerciseStats(
  template: ExerciseTemplate,
  workouts: GymWorkout[]
): ExerciseStats {
  const history: ExerciseHistoryEntry[] = [];
  let highestPrKg: number | null = null;
  let highestPrDate: string | null = null;

  for (const workout of workouts) {
    for (const ex of workout.exercises) {
      if (ex.templateId !== template.id) continue;
      history.push({
        workoutId: workout.id,
        workoutTitle: workout.title,
        date: workout.startTime,
        sets: ex.sets,
      });
      // Find this exercise's heaviest non-warmup set in this workout
      for (const set of ex.sets) {
        if (set.type === "warmup") continue;
        if (set.weightKg == null) continue;
        if (highestPrKg == null || set.weightKg > highestPrKg) {
          highestPrKg = set.weightKg;
          highestPrDate = workout.startTime;
        }
      }
    }
  }

  history.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return {
    template,
    totalSessions: history.length,
    highestPrKg,
    highestPrDate,
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
