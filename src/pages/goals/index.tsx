import type { GetStaticProps } from "next";
import Layout from "@/components/Layout";
import GoalsCalendar from "@/components/GoalsCalendar";
import {
  computeCurrentSuccessStreak,
  computeLongestSuccessStreak,
  computeSuccessSummary,
  type GoalTaskCache,
  type StreakRecord,
  type SuccessSummary,
} from "@/lib/goals";
import { getGoalsCache } from "@/lib/goals-server";

type Props = {
  cache: GoalTaskCache;
  summary: SuccessSummary;
  currentStreak: number;
  longestStreak: StreakRecord;
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const cache = getGoalsCache();
  return {
    props: {
      cache,
      summary: computeSuccessSummary(cache),
      currentStreak: computeCurrentSuccessStreak(cache),
      longestStreak: computeLongestSuccessStreak(cache),
    },
  };
};

function formatLongDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map((p) => parseInt(p, 10));
  return new Date(y, m - 1, d, 12).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function GoalsPage({
  cache,
  summary,
  currentStreak,
  longestStreak,
}: Props) {
  const connected = !!cache.generatedAt;

  return (
    <Layout
      title="Success"
      description="Daily tasks tracked in Google Tasks. Green if I finished everything, red if I didn't."
      path="/goals/"
      ogImage="/og/home.png"
    >
      {/* Hero */}
      <section className="bg-[var(--color-off-white)] text-[var(--color-black)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-12 lg:pt-28 lg:pb-16">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
            Goals
          </p>
          <h1 className="mt-4 text-5xl sm:text-7xl lg:text-8xl tracking-tight leading-[0.95]">
            <span className="inline-block relative">
              Success
              <span
                aria-hidden="true"
                className="absolute left-0 right-0 -bottom-1 lg:-bottom-2 h-2 lg:h-3 bg-[var(--color-yellow)]"
              />
            </span>
          </h1>
          <p className="mt-8 text-xl lg:text-2xl max-w-3xl text-[var(--color-black)]/70 leading-relaxed">
            What tasks would I need to accomplish today to feel successful?
          </p>
        </div>
      </section>

      {/* Stats row */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-2 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Success rate */}
          <div className="bg-[var(--color-black)] text-[var(--color-off-white)] rounded-2xl p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-yellow)]">
              Success rate
            </p>
            <p className="mt-4 font-[family-name:var(--font-display)] text-5xl lg:text-6xl tracking-tight">
              {summary.successRatePct}%
            </p>
            <p className="mt-2 text-sm text-[var(--color-off-white)]/70">
              {summary.successfulDays} of {summary.totalDaysWithTasks}{" "}
              {summary.totalDaysWithTasks === 1 ? "day" : "days"} with tasks
            </p>
          </div>

          {/* Current streak */}
          <div className="bg-[var(--color-yellow)] text-[var(--color-black)] rounded-2xl p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/70">
              Current streak
            </p>
            <p className="mt-4 font-[family-name:var(--font-display)] text-5xl lg:text-6xl tracking-tight">
              {currentStreak}{" "}
              <span className="text-2xl font-normal text-[var(--color-black)]/70">
                {currentStreak === 1 ? "day" : "days"}
              </span>
            </p>
            <p className="mt-2 text-sm text-[var(--color-black)]/70">
              {currentStreak > 0
                ? "Successful days in a row."
                : "No active streak. Finish today's tasks to start one."}
            </p>
          </div>

          {/* Longest streak */}
          <div className="bg-[var(--color-off-white)] border-2 border-[var(--color-warm-gray)] text-[var(--color-black)] rounded-2xl p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
              Longest streak
            </p>
            <p className="mt-4 font-[family-name:var(--font-display)] text-5xl lg:text-6xl tracking-tight">
              {longestStreak.length}{" "}
              <span className="text-2xl font-normal text-[var(--color-black)]/60">
                {longestStreak.length === 1 ? "day" : "days"}
              </span>
            </p>
            <p className="mt-2 text-sm text-[var(--color-black)]/70">
              {longestStreak.lastDay
                ? `Last achieved ${formatLongDate(longestStreak.lastDay)}.`
                : "No completed streak yet."}
            </p>
          </div>
        </div>
      </section>

      {/* Calendar */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-24">
        {connected ? (
          <GoalsCalendar cache={cache} />
        ) : (
          <div className="bg-[var(--color-off-white)] border-2 border-[var(--color-warm-gray)] rounded-2xl p-8 lg:p-12 text-center">
            <p className="text-xl text-[var(--color-black)]/70">
              Google Tasks isn&apos;t connected yet.
            </p>
            <p className="mt-2 text-sm text-[var(--color-black)]/60">
              Once the OAuth refresh token is in GitHub Secrets, daily task
              data will populate here automatically.
            </p>
          </div>
        )}
      </section>
    </Layout>
  );
}
