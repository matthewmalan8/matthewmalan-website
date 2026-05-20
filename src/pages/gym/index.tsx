import Link from "next/link";
import { useMemo, useState } from "react";
import type { GetStaticProps } from "next";
import Layout from "@/components/Layout";
import GymCalendar from "@/components/GymCalendar";
import { ChevronDownIcon } from "@/components/Icons";
import {
  getAllExerciseTemplates,
  getAllWorkouts,
  getPinnedExerciseTitles,
  getUsedExerciseTemplates,
  resolvePinnedExercises,
} from "@/lib/gym";
import {
  EXERCISE_SORTS,
  format1Rm,
  formatDuration,
  formatLongDate,
  formatShortDate,
  getCurrentGymStreak,
  getCurrentHourPlusStreak,
  getExerciseStats,
  getLongestGymStreak,
  getLongestHourPlusStreak,
  getMuscleGroups,
  getPrDates,
  getRangeStats,
  getWorkoutPrInfo,
  getTemplateLastSessionDate,
  getTemplateSessionCount,
  humanizeMuscle,
  sortTemplates,
  TIME_RANGES,
  type ExerciseSort,
  type ExerciseStats,
  type ExerciseTemplate,
  type GymWorkout,
  type TimeRange,
  type WorkoutPrMap,
} from "@/lib/gym-utils";
import { getAllGoals } from "@/lib/goals-data";
import type { Goal } from "@/lib/goals-data-types";
import { SingleGoalCard } from "@/components/GoalCard";

type PinnedExercise = {
  template: ExerciseTemplate;
  oneRmKg: number | null;
  oneRmDate: string | null;
  totalSessions: number;
};

type Props = {
  workouts: GymWorkout[];
  templates: ExerciseTemplate[];
  pinnedExercises: PinnedExercise[];
  prDates: string[];
  workoutPrInfo: WorkoutPrMap;
  sharedGoals: Goal[];
  pinnedGoal: Goal | null;
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const workouts = getAllWorkouts();
  const allTemplates = getAllExerciseTemplates();
  const templates = getUsedExerciseTemplates(workouts, allTemplates);
  const pinnedTitles = getPinnedExerciseTitles();
  const pinnedTemplates = resolvePinnedExercises(pinnedTitles, allTemplates);
  const pinnedExercises: PinnedExercise[] = pinnedTemplates.map((template) => {
    const stats: ExerciseStats = getExerciseStats(template, workouts);
    return {
      template,
      oneRmKg: stats.bestPR.oneRmKg,
      oneRmDate: stats.bestPR.oneRmDate,
      totalSessions: stats.totalSessions,
    };
  });
  const prDates = Array.from(getPrDates(workouts));
  const workoutPrInfo = getWorkoutPrInfo(workouts);
  const allGoals = getAllGoals();
  const shared = allGoals.filter(
    (g) => g.shareTo === "gym" && g.status !== "archived"
  );
  const pinnedGoal = shared.find((g) => g.pinned) ?? null;
  return {
    props: {
      workouts,
      templates,
      pinnedExercises,
      prDates,
      workoutPrInfo,
      sharedGoals: shared.filter((g) => g !== pinnedGoal),
      pinnedGoal,
    },
  };
};

export default function GymPage({
  workouts,
  templates,
  pinnedExercises,
  prDates,
  workoutPrInfo,
  sharedGoals,
  pinnedGoal,
}: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState<string | null>(null);
  const [exerciseSort, setExerciseSort] =
    useState<ExerciseSort>("most-sessions");
  const [showAllExercises, setShowAllExercises] = useState(false);

  const hasActiveExerciseFilter =
    search.trim().length > 0 || muscle !== null;
  const shouldShowExerciseList =
    hasActiveExerciseFilter || showAllExercises;

  const currentStreak = useMemo(
    () => getCurrentGymStreak(workouts),
    [workouts]
  );
  const longestStreak = useMemo(
    () => getLongestGymStreak(workouts),
    [workouts]
  );
  const currentHourPlusStreak = useMemo(
    () => getCurrentHourPlusStreak(workouts),
    [workouts]
  );
  const longestHourPlusStreak = useMemo(
    () => getLongestHourPlusStreak(workouts),
    [workouts]
  );
  const rangeStats = useMemo(
    () => getRangeStats(workouts, timeRange),
    [workouts, timeRange]
  );
  const muscleGroups = useMemo(() => getMuscleGroups(templates), [templates]);

  const sessionCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of templates) {
      map.set(t.id, getTemplateSessionCount(t.id, workouts));
    }
    return map;
  }, [templates, workouts]);

  const lastSessionDates = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const t of templates) {
      map.set(t.id, getTemplateLastSessionDate(t.id, workouts));
    }
    return map;
  }, [templates, workouts]);

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = templates.filter((t) => {
      const matchesSearch = !q || t.title.toLowerCase().includes(q);
      const matchesMuscle = !muscle || t.primaryMuscleGroup === muscle;
      return matchesSearch && matchesMuscle;
    });
    return sortTemplates(filtered, exerciseSort, sessionCounts, lastSessionDates);
  }, [templates, search, muscle, exerciseSort, sessionCounts, lastSessionDates]);

  return (
    <Layout
      title="Gym"
      description="Workouts, streaks, and personal records — pulled live from my Hevy log."
      path="/gym/"
      ogImage="/og/gym.png"
    >
      {/* Hero */}
      <section className="bg-[var(--color-black)] text-[var(--color-off-white)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-12 lg:pt-28">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-yellow)]">
            Training Log
          </p>
          <h1 className="mt-6 text-5xl sm:text-7xl tracking-tight">Gym</h1>
          <p className="mt-6 max-w-2xl text-lg text-[var(--color-warm-gray)] leading-relaxed">
            Every session. Every set. Pulled straight from Hevy.
          </p>
          <div className="mt-8">
            <a
              href="https://hevy.com/user/mattmalan6"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-[var(--color-yellow)] text-[var(--color-black)] px-6 py-3 text-sm font-semibold rounded-full hover:bg-[#FFF04D] transition-colors"
            >
              Follow me on Hevy →
            </a>
          </div>
        </div>
      </section>

      {workouts.length === 0 ? (
        <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
          <p className="text-[var(--color-black)]/60">
            No workouts loaded yet. Once HEVY_API_KEY is set in CI and the next
            build runs, your workouts will appear here.
          </p>
        </section>
      ) : (
        <>
          {/* Pinned fitness goal */}
          {pinnedGoal && (
            <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-12">
              <SingleGoalCard goal={pinnedGoal} featured />
            </section>
          )}

          {/* Pinned exercises */}
          {pinnedExercises.length > 0 && (
            <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-12">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60 mb-4">
                Pinned exercises
              </h2>
              <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {pinnedExercises.map(
                  ({ template, oneRmKg, oneRmDate }) => (
                    <li key={template.id}>
                      <Link
                        href={`/gym/exercise/${template.slug}/`}
                        className="group block h-full rounded-2xl border-2 border-[var(--color-warm-gray)] hover:border-[var(--color-black)] bg-[var(--color-off-white)] p-4 transition-colors"
                      >
                        <p className="text-sm font-semibold tracking-tight leading-tight line-clamp-2 group-hover:underline decoration-[var(--color-yellow)] decoration-2 underline-offset-2 min-h-[2.5em]">
                          {template.title}
                        </p>
                        <p className="mt-3 text-[10px] uppercase tracking-wider text-[var(--color-black)]/55">
                          Best 1RM
                        </p>
                        <p className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
                          {format1Rm(oneRmKg)}
                        </p>
                        <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--color-black)]/55">
                          {oneRmDate
                            ? `Last: ${formatShortDate(oneRmDate)}`
                            : "No weighted PR yet"}
                        </p>
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </section>
          )}

          {/* Shared fitness goals */}
          {sharedGoals.length > 0 && (
            <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-12">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60 mb-4">
                Goals
              </h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {sharedGoals.map((g) => (
                  <li key={g.slug}>
                    <SingleGoalCard goal={g} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Stats */}
          <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Streaks (any-workout + 1+ hr) */}
              <div className="bg-[var(--color-yellow)] text-[var(--color-black)] rounded-2xl p-6 lg:p-8 flex flex-col gap-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/70">
                    Gym streak
                  </p>
                  <div className="mt-3 flex items-baseline gap-2 flex-wrap">
                    <p className="font-[family-name:var(--font-display)] text-4xl lg:text-5xl tracking-tight leading-none">
                      {currentStreak}{" "}
                      <span className="text-xl font-normal text-[var(--color-black)]/70">
                        {currentStreak === 1 ? "day" : "days"}
                      </span>
                    </p>
                  </div>
                  {longestStreak.length > 0 && (
                    <p className="mt-1.5 text-xs text-[var(--color-black)]/65">
                      Longest: <strong>{longestStreak.length}</strong>{" "}
                      {longestStreak.length === 1 ? "day" : "days"}
                      {longestStreak.lastDay && (
                        <>
                          {" "}
                          <span className="text-[var(--color-black)]/50">
                            (last achieved {formatLongDate(longestStreak.lastDay)})
                          </span>
                        </>
                      )}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-[var(--color-black)]/15">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/70">
                    1+ hr streak
                  </p>
                  <div className="mt-3 flex items-baseline gap-2 flex-wrap">
                    <p className="font-[family-name:var(--font-display)] text-4xl lg:text-5xl tracking-tight leading-none">
                      {currentHourPlusStreak}{" "}
                      <span className="text-xl font-normal text-[var(--color-black)]/70">
                        {currentHourPlusStreak === 1 ? "day" : "days"}
                      </span>
                    </p>
                  </div>
                  {longestHourPlusStreak.length > 0 ? (
                    <p className="mt-1.5 text-xs text-[var(--color-black)]/65">
                      Longest: <strong>{longestHourPlusStreak.length}</strong>{" "}
                      {longestHourPlusStreak.length === 1 ? "day" : "days"}
                      {longestHourPlusStreak.lastDay && (
                        <>
                          {" "}
                          <span className="text-[var(--color-black)]/50">
                            (last achieved {formatLongDate(longestHourPlusStreak.lastDay)})
                          </span>
                        </>
                      )}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-[var(--color-black)]/50 italic">
                      No 1+ hour days logged yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Time logged with range filter */}
              <div className="bg-[var(--color-black)] text-[var(--color-off-white)] rounded-2xl p-6 lg:p-8">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-yellow)]">
                    Time logged
                  </p>
                  <div className="relative">
                    <label htmlFor="time-range" className="sr-only">
                      Time range
                    </label>
                    <select
                      id="time-range"
                      value={timeRange}
                      onChange={(e) =>
                        setTimeRange(e.target.value as TimeRange)
                      }
                      style={{ colorScheme: "light" }}
                      className="appearance-none pl-4 pr-10 py-2 rounded-full border border-[var(--color-warm-gray)]/40 bg-[var(--color-black)] text-xs font-semibold uppercase tracking-wider text-[var(--color-off-white)] focus:outline-none focus:border-[var(--color-yellow)] hover:border-[var(--color-yellow)]/70 cursor-pointer transition-colors"
                    >
                      {TIME_RANGES.map((r) => (
                        <option
                          key={r.value}
                          value={r.value}
                          style={{
                            backgroundColor: "#FFFDF9",
                            color: "#1C1400",
                          }}
                        >
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-[var(--color-yellow)]" />
                  </div>
                </div>
                <p className="mt-4 font-[family-name:var(--font-display)] text-5xl lg:text-6xl tracking-tight">
                  {formatDuration(rangeStats.totalSeconds)}
                </p>
                {rangeStats.workoutCount > 0 ? (
                  <dl className="mt-6 pt-5 border-t border-[var(--color-off-white)]/15 grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <dt className="uppercase tracking-wider text-[var(--color-off-white)]/60">
                        Workouts
                      </dt>
                      <dd className="mt-1 text-2xl font-[family-name:var(--font-display)] tracking-tight text-[var(--color-yellow)]">
                        {rangeStats.workoutCount}
                      </dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-wider text-[var(--color-off-white)]/60">
                        Days
                      </dt>
                      <dd className="mt-1 text-2xl font-[family-name:var(--font-display)] tracking-tight text-[var(--color-yellow)]">
                        {rangeStats.uniqueDays}
                      </dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-wider text-[var(--color-off-white)]/60">
                        Avg / workout
                      </dt>
                      <dd className="mt-1 text-2xl font-[family-name:var(--font-display)] tracking-tight text-[var(--color-yellow)]">
                        {formatDuration(rangeStats.averageSeconds)}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-6 pt-5 border-t border-[var(--color-off-white)]/15 text-sm text-[var(--color-off-white)]/60 italic">
                    No workouts in this range.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Calendar */}
          <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-12">
            <h2 className="text-3xl sm:text-4xl tracking-tight mb-6">
              Workout calendar
            </h2>
            <GymCalendar
              workouts={workouts}
              prDates={prDates}
              workoutPrInfo={workoutPrInfo}
            />
          </section>

          {/* Exercise library */}
          <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-16 mb-24">
            <h2 className="text-3xl sm:text-4xl tracking-tight">Exercises</h2>
            <p className="mt-2 text-[var(--color-black)]/70 max-w-2xl">
              Click any exercise to see your full history and personal record.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <label htmlFor="exercise-search" className="sr-only">
                  Search exercises
                </label>
                <input
                  id="exercise-search"
                  type="search"
                  placeholder="Search exercises by name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 min-w-0 px-5 py-3 rounded-full border-2 border-[var(--color-black)] bg-[var(--color-off-white)] focus:outline-none focus:bg-white"
                />
                <label htmlFor="exercise-sort" className="sr-only">
                  Sort exercises
                </label>
                <div className="relative">
                  <select
                    id="exercise-sort"
                    value={exerciseSort}
                    onChange={(e) =>
                      setExerciseSort(e.target.value as ExerciseSort)
                    }
                    className="appearance-none pl-5 pr-11 py-3 rounded-full border-2 border-[var(--color-black)] bg-[var(--color-off-white)] text-sm font-semibold focus:outline-none cursor-pointer w-full sm:w-auto"
                  >
                    {EXERCISE_SORTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        Sort: {s.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-black)] pointer-events-none" />
                </div>
              </div>
              {muscleGroups.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setMuscle(null)}
                    className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full border-2 transition-colors cursor-pointer ${
                      muscle === null
                        ? "bg-[var(--color-yellow)] border-[var(--color-black)] text-[var(--color-black)]"
                        : "border-[var(--color-warm-gray)] text-[var(--color-black)]/70 hover:border-[var(--color-black)]"
                    }`}
                  >
                    All
                  </button>
                  {muscleGroups.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setMuscle(g)}
                      className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full border-2 transition-colors cursor-pointer ${
                        muscle === g
                          ? "bg-[var(--color-yellow)] border-[var(--color-black)] text-[var(--color-black)]"
                          : "border-[var(--color-warm-gray)] text-[var(--color-black)]/70 hover:border-[var(--color-black)]"
                      }`}
                    >
                      {humanizeMuscle(g)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!shouldShowExerciseList ? (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAllExercises(true)}
                  className="inline-flex items-center bg-[var(--color-black)] text-[var(--color-yellow)] px-6 py-3 text-sm font-semibold rounded-full hover:bg-[var(--color-yellow)] hover:text-[var(--color-black)] transition-colors cursor-pointer"
                >
                  Show all {templates.length} exercises →
                </button>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <p className="mt-8 text-[var(--color-black)]/60">
                No exercises match that filter.
              </p>
            ) : (
              <>
                <ul className="mt-8 divide-y divide-[var(--color-warm-gray)] border-y border-[var(--color-warm-gray)]">
                  {filteredTemplates.map((t) => {
                    const sessions = sessionCounts.get(t.id) ?? 0;
                    return (
                      <li key={t.id}>
                        <Link
                          href={`/gym/exercise/${t.slug}/`}
                          className="group flex items-center justify-between gap-4 py-4"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold tracking-tight truncate group-hover:underline decoration-[var(--color-yellow)] decoration-2 underline-offset-2">
                              {t.title}
                            </p>
                            <p className="mt-0.5 text-xs uppercase tracking-wider text-[var(--color-black)]/50">
                              {humanizeMuscle(t.primaryMuscleGroup) || "—"}
                              {sessions > 0 && (
                                <span className="ml-2">
                                  · {sessions}{" "}
                                  {sessions === 1 ? "session" : "sessions"}
                                </span>
                              )}
                            </p>
                          </div>
                          <span className="text-[var(--color-black)]/50 text-sm font-semibold flex-shrink-0">
                            →
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                {showAllExercises && !hasActiveExerciseFilter && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowAllExercises(false)}
                      className="text-sm font-semibold text-[var(--color-black)]/60 hover:text-[var(--color-black)] cursor-pointer"
                    >
                      ↑ Hide list
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}
    </Layout>
  );
}
