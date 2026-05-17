import Link from "next/link";
import type { GetStaticPaths, GetStaticProps } from "next";
import Layout from "@/components/Layout";
import {
  getAllExerciseTemplates,
  getAllWorkouts,
  getUsedExerciseTemplates,
} from "@/lib/gym";
import {
  formatSetSummary,
  formatShortDate,
  formatWeight,
  getExerciseStats,
  humanizeMuscle,
  kgToLbs,
  type ExerciseStats,
} from "@/lib/gym-utils";

type Props = { stats: ExerciseStats };

function ProgressChart({ stats }: { stats: ExerciseStats }) {
  // Compute heaviest non-warmup weight per session (in chronological order).
  const points = stats.history
    .map((h) => {
      let maxKg: number | null = null;
      for (const s of h.sets) {
        if (s.type === "warmup" || s.weightKg == null) continue;
        if (maxKg == null || s.weightKg > maxKg) maxKg = s.weightKg;
      }
      return maxKg != null ? { date: h.date, weightKg: maxKg } : null;
    })
    .filter((p): p is { date: string; weightKg: number } => p !== null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (points.length < 2) {
    return (
      <p className="text-sm italic text-[var(--color-black)]/55">
        Need at least two weighted sessions to chart progress.
      </p>
    );
  }

  const width = 600;
  const height = 180;
  const padding = { top: 20, right: 50, bottom: 20, left: 50 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const lbsValues = points.map((p) => kgToLbs(p.weightKg) ?? 0);
  const maxLb = Math.max(...lbsValues);
  const minLb = Math.min(...lbsValues);
  const yRange = Math.max(1, maxLb - minLb);

  const coords = points.map((p, i) => {
    const x = padding.left + (i / (points.length - 1)) * innerW;
    const lb = kgToLbs(p.weightKg) ?? 0;
    const y =
      padding.top + innerH - ((lb - minLb) / yRange) * innerH;
    return { x, y, lb, date: p.date };
  });

  const path = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x},${c.y}`)
    .join(" ");

  const firstDate = formatShortDate(points[0].date);
  const lastDate = formatShortDate(points[points.length - 1].date);

  return (
    <div className="bg-[var(--color-off-white)] border-2 border-[var(--color-warm-gray)] rounded-2xl p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
        Heaviest set over time
      </p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-4 w-full h-auto text-[var(--color-black)]"
        role="img"
        aria-label={`Progression chart from ${firstDate} to ${lastDate}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Y-axis labels (min/max) */}
        <text
          x={padding.left - 8}
          y={padding.top + 4}
          fontSize="11"
          fill="currentColor"
          textAnchor="end"
        >
          {Math.round(maxLb)} lb
        </text>
        <text
          x={padding.left - 8}
          y={padding.top + innerH + 4}
          fontSize="11"
          fill="currentColor"
          textAnchor="end"
        >
          {Math.round(minLb)} lb
        </text>
        {/* Baseline */}
        <line
          x1={padding.left}
          y1={padding.top + innerH}
          x2={padding.left + innerW}
          y2={padding.top + innerH}
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="1"
        />
        {/* Path */}
        <path
          d={path}
          fill="none"
          stroke="#1C1400"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Dots */}
        {coords.map((c, i) => (
          <g key={i}>
            <circle cx={c.x} cy={c.y} r="3.5" fill="#FFD721" stroke="#1C1400" strokeWidth="1.5" />
          </g>
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-[var(--color-black)]/50">
        <span>{firstDate}</span>
        <span>{lastDate}</span>
      </div>
    </div>
  );
}

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

        {/* Progress chart */}
        <section className="max-w-5xl mx-auto px-6 lg:px-10 mt-12">
          <ProgressChart stats={stats} />
        </section>

        {/* History */}
        <section className="max-w-5xl mx-auto px-6 lg:px-10 mt-10">
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
                              {formatSetSummary(set)}
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
