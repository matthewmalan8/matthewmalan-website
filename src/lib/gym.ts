import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type {
  ExerciseInstance,
  ExerciseTemplate,
  GymSet,
  GymWorkout,
} from "./gym-utils";
import { isoDate, slugifyExerciseTitle } from "./gym-utils";

export type { ExerciseTemplate, GymWorkout };

const cacheDir = path.join(process.cwd(), "content", "gym", "cache");
const workoutsFile = path.join(cacheDir, "workouts.json");
const templatesFile = path.join(cacheDir, "exercise-templates.json");
const overridesDir = path.join(process.cwd(), "content", "gym", "overrides");
const pinnedFile = path.join(
  process.cwd(),
  "content",
  "gym",
  "pinned-exercises.md"
);

type HevyRawSet = {
  type?: string;
  weight_kg?: number | null;
  reps?: number | null;
  distance_meters?: number | null;
  duration_seconds?: number | null;
  rpe?: number | null;
};

type HevyRawExercise = {
  exercise_template_id?: string;
  title?: string;
  notes?: string;
  sets?: HevyRawSet[];
};

type HevyRawWorkout = {
  id?: string;
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  exercises?: HevyRawExercise[];
};

type HevyRawTemplate = {
  id?: string;
  title?: string;
  exercise_type?: string;
  primary_muscle_group?: string;
  secondary_muscle_groups?: string[];
  equipment?: string;
};

function readJson<T>(file: string, fallback: T): T {
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function parseSet(raw: HevyRawSet): GymSet {
  return {
    type: typeof raw.type === "string" ? raw.type : "normal",
    weightKg:
      typeof raw.weight_kg === "number" && Number.isFinite(raw.weight_kg)
        ? raw.weight_kg
        : null,
    reps:
      typeof raw.reps === "number" && Number.isFinite(raw.reps)
        ? raw.reps
        : null,
    distanceMeters:
      typeof raw.distance_meters === "number" &&
      Number.isFinite(raw.distance_meters)
        ? raw.distance_meters
        : null,
    durationSeconds:
      typeof raw.duration_seconds === "number" &&
      Number.isFinite(raw.duration_seconds)
        ? raw.duration_seconds
        : null,
    rpe:
      typeof raw.rpe === "number" && Number.isFinite(raw.rpe) ? raw.rpe : null,
  };
}

function parseExercise(raw: HevyRawExercise): ExerciseInstance {
  return {
    templateId: typeof raw.exercise_template_id === "string"
      ? raw.exercise_template_id
      : "",
    title: typeof raw.title === "string" ? raw.title : "",
    notes: typeof raw.notes === "string" ? raw.notes : "",
    sets: Array.isArray(raw.sets) ? raw.sets.map(parseSet) : [],
  };
}

function parseWorkout(raw: HevyRawWorkout): GymWorkout | null {
  const start = typeof raw.start_time === "string" ? raw.start_time : "";
  const end = typeof raw.end_time === "string" ? raw.end_time : "";
  if (!start) return null;
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : startMs;
  const durationSeconds =
    endMs > startMs ? Math.round((endMs - startMs) / 1000) : 0;
  return {
    id: typeof raw.id === "string" ? raw.id : "",
    title: typeof raw.title === "string" ? raw.title : "Workout",
    description: typeof raw.description === "string" ? raw.description : "",
    date: isoDate(new Date(start)),
    startTime: start,
    endTime: end,
    durationSeconds,
    exercises: Array.isArray(raw.exercises)
      ? raw.exercises.map(parseExercise)
      : [],
  };
}

function parseTemplate(raw: HevyRawTemplate): ExerciseTemplate | null {
  const id = typeof raw.id === "string" ? raw.id : "";
  const title = typeof raw.title === "string" ? raw.title : "";
  if (!id || !title) return null;
  return {
    id,
    title,
    slug: slugifyExerciseTitle(title),
    exerciseType: typeof raw.exercise_type === "string" ? raw.exercise_type : "",
    primaryMuscleGroup:
      typeof raw.primary_muscle_group === "string"
        ? raw.primary_muscle_group
        : "",
    secondaryMuscleGroups: Array.isArray(raw.secondary_muscle_groups)
      ? raw.secondary_muscle_groups.filter(
          (g): g is string => typeof g === "string"
        )
      : [],
    equipment: typeof raw.equipment === "string" ? raw.equipment : "",
  };
}

type OverrideSet = {
  weightLb?: number;
  reps?: number;
  durationSeconds?: number;
  distanceMeters?: number;
  type?: string;
};

type OverrideExercise = {
  title?: string;
  templateId?: string;
  notes?: string;
  sets?: OverrideSet[];
};

type WorkoutOverride = {
  date: string;
  title: string;
  description: string;
  exercises: ExerciseInstance[];
};

function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 100) / 100;
}

function loadOverrides(): Map<string, WorkoutOverride> {
  const map = new Map<string, WorkoutOverride>();
  if (!fs.existsSync(overridesDir)) return map;
  const files = fs.readdirSync(overridesDir).filter((f) => f.endsWith(".md"));
  for (const f of files) {
    try {
      const raw = fs.readFileSync(path.join(overridesDir, f), "utf8");
      const { data } = matter(raw);
      const fm = data as Record<string, unknown>;
      let date = "";
      if (fm.date instanceof Date) {
        date = isoDate(fm.date);
      } else if (typeof fm.date === "string") {
        // Normalize to YYYY-MM-DD
        const d = new Date(fm.date);
        date = isNaN(d.getTime())
          ? fm.date.slice(0, 10)
          : isoDate(d);
      }
      if (!date) continue;
      const title = typeof fm.title === "string" ? fm.title : "Manual workout";
      const description =
        typeof fm.description === "string" ? fm.description : "";
      const rawExercises = Array.isArray(fm.exercises)
        ? (fm.exercises as OverrideExercise[])
        : [];
      const exercises: ExerciseInstance[] = rawExercises.map((ex) => ({
        templateId: typeof ex.templateId === "string" ? ex.templateId : "",
        title: typeof ex.title === "string" ? ex.title : "",
        notes: typeof ex.notes === "string" ? ex.notes : "",
        sets: Array.isArray(ex.sets)
          ? ex.sets.map((s): GymSet => ({
              type: typeof s.type === "string" ? s.type : "normal",
              weightKg:
                typeof s.weightLb === "number" && Number.isFinite(s.weightLb)
                  ? lbsToKg(s.weightLb)
                  : null,
              reps:
                typeof s.reps === "number" && Number.isFinite(s.reps)
                  ? s.reps
                  : null,
              distanceMeters:
                typeof s.distanceMeters === "number" &&
                Number.isFinite(s.distanceMeters)
                  ? s.distanceMeters
                  : null,
              durationSeconds:
                typeof s.durationSeconds === "number" &&
                Number.isFinite(s.durationSeconds)
                  ? s.durationSeconds
                  : null,
              rpe: null,
            }))
          : [],
      }));
      map.set(date, { date, title, description, exercises });
    } catch {
      // skip malformed override files
    }
  }
  return map;
}

export function getAllWorkouts(): GymWorkout[] {
  const raw = readJson<HevyRawWorkout[]>(workoutsFile, []);
  const parsed: GymWorkout[] = [];
  for (const w of raw) {
    const p = parseWorkout(w);
    if (p) parsed.push(p);
  }

  // Merge in manual overrides keyed by date.
  const overrides = loadOverrides();
  if (overrides.size > 0) {
    const merged: GymWorkout[] = [];
    const seenDates = new Set<string>();
    for (const w of parsed) {
      const override = overrides.get(w.date);
      if (override) {
        merged.push({
          ...w,
          title: override.title || w.title,
          description: override.description || w.description,
          exercises:
            override.exercises.length > 0 ? override.exercises : w.exercises,
        });
        seenDates.add(w.date);
      } else {
        merged.push(w);
      }
    }
    // Add any overrides for dates with no matching Hevy workout.
    for (const [date, override] of overrides) {
      if (seenDates.has(date)) continue;
      const start = `${date}T12:00:00Z`;
      merged.push({
        id: `manual-${date}`,
        title: override.title,
        description: override.description,
        date,
        startTime: start,
        endTime: start,
        durationSeconds: 0,
        exercises: override.exercises,
      });
    }
    parsed.length = 0;
    parsed.push(...merged);
  }

  // Sort newest first.
  return parsed.sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
}

export function getAllExerciseTemplates(): ExerciseTemplate[] {
  const raw = readJson<HevyRawTemplate[]>(templatesFile, []);
  const parsed: ExerciseTemplate[] = [];
  for (const t of raw) {
    const p = parseTemplate(t);
    if (p) parsed.push(p);
  }
  // Sort alphabetically.
  return parsed.sort((a, b) => a.title.localeCompare(b.title));
}

// Only return templates that the user has actually used at least once,
// to keep the library page focused on real history rather than the full
// Hevy catalog.
export function getUsedExerciseTemplates(
  workouts: GymWorkout[],
  templates: ExerciseTemplate[]
): ExerciseTemplate[] {
  const usedIds = new Set<string>();
  for (const w of workouts) {
    for (const ex of w.exercises) {
      if (ex.templateId) usedIds.add(ex.templateId);
    }
  }
  return templates.filter((t) => usedIds.has(t.id));
}

export function getPinnedExerciseTitles(): string[] {
  if (!fs.existsSync(pinnedFile)) return [];
  try {
    const raw = fs.readFileSync(pinnedFile, "utf8");
    const { data } = matter(raw);
    const fm = data as Record<string, unknown>;
    const list = Array.isArray(fm.exercises) ? fm.exercises : [];
    return list
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((s) => s.trim())
      .slice(0, 5);
  } catch {
    return [];
  }
}

export function resolvePinnedExercises(
  titles: string[],
  templates: ExerciseTemplate[]
): ExerciseTemplate[] {
  // Match by exact (case-insensitive) title.
  const byTitle = new Map<string, ExerciseTemplate>();
  for (const t of templates) {
    byTitle.set(t.title.toLowerCase(), t);
  }
  const resolved: ExerciseTemplate[] = [];
  for (const title of titles) {
    const found = byTitle.get(title.toLowerCase());
    if (found) resolved.push(found);
  }
  return resolved;
}
