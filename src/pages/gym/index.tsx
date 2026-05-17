import Link from "next/link";
import { useMemo, useState } from "react";
import type { GetStaticProps } from "next";
import Layout from "@/components/Layout";
import GymCalendar from "@/components/GymCalendar";
import { ChevronDownIcon } from "@/components/Icons";
import {
  getAllExerciseTemplates,
  getAllWorkouts,
  getUsedExerciseTemplates,
} from "@/lib/gym";
import {
  formatDuration,
  getCurrentGymStreak,
  getMuscleGroups,
  getTemplateSessionCount,
  getTotalSecondsInRange,
  humanizeMuscle,
  TIME_RANGES,
  type ExerciseTemplate,
  type GymWorkout,
  type TimeRange,
} from "@/lib/gym-utils";

type Props = {
  workouts: GymWorkout[];
  templates: ExerciseTemplate[];
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const workouts = getAllWorkouts();
  const allTemplates = getAllExerciseTemplates();
  const templates = getUsedExerciseTemplates(workouts, allTemplates);
  return { props: { workouts, templates } };
};

export default function GymPage({ workouts, templates }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState<string | null>(null);

  const currentStreak = useMemo(
    () => getCurrentGymStreak(workouts),
    [workouts]
  );
  const totalSecondsInRange = useMemo(
    () => getTotalSecondsInRange(workouts, timeRange),
    [workouts, timeRange]
  );
  const muscleGroups = useMemo(() => getMuscleGroups(templates), [templates]);

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      const matchesSearch = !q || t.title.toLowerCase().includes(q);
      const matchesMuscle = !muscle || t.primaryMuscleGroup === muscle;
      return matchesSearch && matchesMuscle;
    });
  }, [templates, search, muscle]);

  const sessionCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of templates) {
      map.set(t.id, getTemplateSessionCount(t.id, workouts));
    }
    return map;
  }, [templates, workouts]);

  return (
    <Layout
      title="Gym"
      description="Workouts, streaks, and personal records — pulled live from my Hevy log."
      path="/gym/"
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
          {/* Stats */}
          <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Streak */}
              <div className="bg-[var(--color-yellow)] text-[var(--color-black)] rounded-2xl p-6 lg:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/70">
                  Current gym streak
                </p>
                <p className="mt-4 font-[family-name:var(--font-display)] text-5xl lg:text-6xl tracking-tight">
                  {currentStreak}{" "}
                  <span className="text-2xl font-normal text-[var(--color-black)]/70">
                    {currentStreak === 1 ? "day" : "days"}
                  </span>
                </p>
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
                      className="appearance-none pl-4 pr-10 py-2 rounded-full border border-[var(--color-warm-gray)]/40 bg-[var(--color-black)] text-xs font-semibold uppercase tracking-wider text-[var(--color-off-white)] focus:outline-none focus:border-[var(--color-yellow)] hover:border-[var(--color-yellow)]/70 cursor-pointer transition-colors"
                    >
                      {TIME_RANGES.map((r) => (
                        <option
                          key={r.value}
                          value={r.value}
                          className="text-[var(--color-black)] normal-case"
                        >
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-[var(--color-yellow)]" />
                  </div>
                </div>
                <p className="mt-4 font-[family-name:var(--font-display)] text-5xl lg:text-6xl tracking-tight">
                  {formatDuration(totalSecondsInRange)}
                </p>
              </div>
            </div>
          </section>

          {/* Calendar */}
          <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-12">
            <h2 className="text-3xl sm:text-4xl tracking-tight mb-6">
              Workout calendar
            </h2>
            <GymCalendar workouts={workouts} />
          </section>

          {/* Exercise library */}
          <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-16 mb-24">
            <h2 className="text-3xl sm:text-4xl tracking-tight">Exercises</h2>
            <p className="mt-2 text-[var(--color-black)]/70 max-w-2xl">
              Click any exercise to see your full history and personal record.
            </p>

            <div className="mt-8 space-y-4">
              <div>
                <label htmlFor="exercise-search" className="sr-only">
                  Search exercises
                </label>
                <input
                  id="exercise-search"
                  type="search"
                  placeholder="Search exercises by name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-5 py-3 rounded-full border-2 border-[var(--color-black)] bg-[var(--color-off-white)] focus:outline-none focus:bg-white"
                />
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

            {filteredTemplates.length === 0 ? (
              <p className="mt-8 text-[var(--color-black)]/60">
                No exercises match that filter.
              </p>
            ) : (
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
            )}
          </section>
        </>
      )}
    </Layout>
  );
}
