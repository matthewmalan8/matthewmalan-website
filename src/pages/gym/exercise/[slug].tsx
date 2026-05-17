import Link from "next/link";
import type { GetStaticPaths, GetStaticProps } from "next";
import Layout from "@/components/Layout";
import {
  getAllExerciseTemplates,
  getAllWorkouts,
  getUsedExerciseTemplates,
} from "@/lib/gym";
import {
  formatShortDate,
  formatWeight,
  getExerciseStats,
  humanizeMuscle,
  type ExerciseStats,
} from "@/lib/gym-utils";

type Props = { stats: ExerciseStats };

export const getStaticPaths: GetStaticPaths = async () => {
  const workouts = getAllWorkouts();
  const templates = getUsedExerciseTemplates(workouts, getAllExerciseTemplates());
  return {
    paths: templates.map((t) => ({ params: { slug: t.slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  const workouts = getAllWorkouts();
  const templates = getUsedExerciseTemplates(workouts, getAllExerciseTemplates());
  const template = templates.find((t) => t.slug === slug);
  if (!template) {
    return { notFound: true };
  }
  const stats = getExerciseStats(template, workouts);
  return { props: { stats } };
};

export default function ExerciseDetailPage({ stats }: Props) {
  const { template, totalSessions, highestPrKg, highestPrDate, history } = stats;

  return (
    <Layout
      title={`${template.title} — Gym`}
      description={`History and personal records for ${template.title}.`}
      path={`/gym/exercise/${template.slug}/`}
    >
      <article className="pb-24">
        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-6 lg:px-10 pt-12 pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
            <Link href="/gym/" className="hover:underline">
              Gym
            </Link>
          </p>
        </div>

        {/* Header */}
        <section className="max-w-5xl mx-auto px-6 lg:px-10">
          <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl tracking-tight">
            {template.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-black)]/60">
            {template.primaryMuscleGroup && (
              <span>{humanizeMuscle(template.primaryMuscleGroup)}</span>
            )}
            {template.equipment && (
              <>
                <span aria-hidden>·</span>
                <span>{humanizeMuscle(template.equipment)}</span>
              </>
            )}
          </div>
        </section>

        {/* Stats */}
        <section className="max-w-5xl mx-auto px-6 lg:px-10 mt-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[var(--color-yellow)] text-[var(--color-black)] rounded-2xl p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/70">
                Highest PR
              </p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-tight">
                {formatWeight(highestPrKg)}
              </p>
            </div>
            <div className="bg-[var(--color-off-white)] border-2 border-[var(--color-warm-gray)] rounded-2xl p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
                Last achieved
              </p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-2xl tracking-tight">
                {highestPrDate ? formatShortDate(highestPrDate) : "—"}
              </p>
            </div>
            <div className="bg-[var(--color-off-white)] border-2 border-[var(--color-warm-gray)] rounded-2xl p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
                Total sessions
              </p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-tight">
                {totalSessions}
              </p>
            </div>
          </div>
        </section>

        {/* History */}
        <section className="max-w-5xl mx-auto px-6 lg:px-10 mt-12">
          <h2 className="text-2xl sm:text-3xl tracking-tight">History</h2>
          {history.length === 0 ? (
            <p className="mt-4 text-[var(--color-black)]/60">
              No sessions logged yet.
            </p>
          ) : (
            <ul className="mt-6 space-y-6">
              {history.map((entry, i) => (
                <li
                  key={i}
                  className="border border-[var(--color-warm-gray)] rounded-xl p-5"
                >
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <p className="font-semibold tracking-tight">
                      {entry.workoutTitle}
                    </p>
                    <p className="text-sm text-[var(--color-black)]/60">
                      {formatShortDate(entry.date)}
                    </p>
                  </div>
                  {entry.sets.length > 0 ? (
                    <ul className="mt-3 text-sm text-[var(--color-black)]/80 space-y-1">
                      {entry.sets.map((set, j) => {
                        const isWarmup = set.type === "warmup";
                        return (
                          <li
                            key={j}
                            className={`flex gap-3 ${
                              isWarmup
                                ? "text-[var(--color-black)]/45 italic"
                                : ""
                            }`}
                          >
                            <span className="w-6 text-right">{j + 1}.</span>
                            <span className="flex-1">
                              {formatWeight(set.weightKg)}
                              {set.reps != null && <span> × {set.reps} reps</span>}
                              {isWarmup && (
                                <span className="ml-2 text-[10px] uppercase tracking-wider">
                                  warmup
                                </span>
                              )}
                              {set.rpe != null && (
                                <span className="ml-2 text-xs text-[var(--color-black)]/50">
                                  RPE {set.rpe}
                                </span>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm italic text-[var(--color-black)]/50">
                      No sets logged
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Back */}
        <div className="max-w-5xl mx-auto px-6 lg:px-10 mt-12">
          <Link
            href="/gym/"
            className="inline-flex items-center text-sm font-semibold hover:text-[#4A4A4A] transition-colors"
          >
            ← Back to gym
          </Link>
        </div>
      </article>
    </Layout>
  );
}
