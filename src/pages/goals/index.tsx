import { useState } from "react";
import type { GetStaticProps } from "next";
import Layout from "@/components/Layout";
import GitHubGate from "@/components/GitHubGate";
import GoalsCalendar from "@/components/GoalsCalendar";
import { GroupedGoalCard, InfoPopup, SingleGoalCard } from "@/components/GoalCard";
import {
  computeCurrentSuccessStreak,
  computeLongestSuccessStreak,
  computeSuccessSummary,
  type GoalTaskCache,
  type StreakRecord,
  type SuccessSummary,
} from "@/lib/goals";
import { getGoalsCache } from "@/lib/goals-server";
import { getAllGoals, getPledgeHistory } from "@/lib/goals-data";
import {
  CATEGORIES,
  groupGoals,
  type Goal,
  type GoalCategory,
  type PledgeEvaluation,
} from "@/lib/goals-data-types";

type Props = {
  cache: GoalTaskCache;
  summary: SuccessSummary;
  currentStreak: number;
  longestStreak: StreakRecord;
  goals: Goal[];
  pledgeHistory: PledgeEvaluation[];
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const cache = getGoalsCache();
  return {
    props: {
      cache,
      summary: computeSuccessSummary(cache),
      currentStreak: computeCurrentSuccessStreak(cache),
      longestStreak: computeLongestSuccessStreak(cache),
      goals: getAllGoals(),
      pledgeHistory: getPledgeHistory(),
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

function formatShortDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map((p) => parseInt(p, 10));
  return new Date(y, m - 1, d, 12).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const CATEGORY_DESCRIPTIONS: Record<GoalCategory, string> = {
  Family: "Faith, relationships, and the people I show up for.",
  Fundamentals:
    "The non-negotiables that compound — writing, shipping, showing up.",
  Finance: "Sales, hours, and money on the line.",
  Fitness: "Training data and the lifts I'm chasing.",
};

function CategorySection({
  category,
  goals,
}: {
  category: GoalCategory;
  goals: Goal[];
}) {
  const active = goals.filter((g) => g.status !== "archived");
  if (active.length === 0) return null;
  const pinned = active.find((g) => g.pinned);
  const others = active.filter((g) => g !== pinned);
  const groups = groupGoals(others);

  return (
    <section className="mt-12">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl tracking-tight">
            {category}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-black)]/60">
            {CATEGORY_DESCRIPTIONS[category]}
          </p>
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-black)]/50">
          {active.length} active
        </p>
      </div>

      {pinned && (
        <div className="mb-6">
          <SingleGoalCard goal={pinned} featured />
        </div>
      )}

      {groups.length > 0 && (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {groups.map((g) => (
            <li key={g.key}>
              <GroupedGoalCard group={g} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MoneyOnTheLine({
  goals,
  history,
}: {
  goals: Goal[];
  history: PledgeEvaluation[];
}) {
  const pledgeGoals = goals.filter(
    (g) => g.pledgeAmount > 0 && g.status === "active"
  );
  if (pledgeGoals.length === 0) return null;

  // Today's evaluation per goal slug.
  const today = history.length > 0 ? history[0].date : "";
  const todayBySlug = new Map<string, PledgeEvaluation>();
  for (const e of history) {
    if (e.date !== today) continue;
    if (!todayBySlug.has(e.goalSlug)) todayBySlug.set(e.goalSlug, e);
  }

  const totalLost = history
    .filter((e) => e.result === "failed")
    .reduce((s, e) => s + e.pledgeAmount, 0);
  const failedCount = history.filter((e) => e.result === "failed").length;
  const successCount = history.filter((e) => e.result === "successful").length;

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-8">
      <div className="bg-[#D64545] text-[var(--color-off-white)] rounded-2xl p-6 lg:p-10 ring-2 ring-[#A92A2A]">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em]">
          💸 Money on the line
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl tracking-tight">
          {pledgeGoals.length}{" "}
          {pledgeGoals.length === 1 ? "pledge" : "pledges"} active.
        </h2>
        <p className="mt-2 text-sm text-[var(--color-off-white)]/80">
          Honor system. Evaluated at 23:45 MST every day. You pay what you owe.
        </p>

        {/* Top stats */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="bg-[var(--color-black)]/25 rounded-lg px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
              Total lost
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl">
              ${totalLost}
            </p>
          </div>
          <div className="bg-[var(--color-black)]/25 rounded-lg px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
              Days won
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl">
              {successCount}
            </p>
          </div>
          <div className="bg-[var(--color-black)]/25 rounded-lg px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
              Days failed
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl">
              {failedCount}
            </p>
          </div>
        </div>

        <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {pledgeGoals.map((g) => {
            const todayEval = todayBySlug.get(g.slug);
            const status = todayEval?.result ?? "pending";
            const pct =
              todayEval && todayEval.target > 0
                ? Math.max(
                    0,
                    Math.min(
                      100,
                      Math.round((todayEval.achieved / todayEval.target) * 100)
                    )
                  )
                : 0;
            const statusLabel =
              status === "successful"
                ? "✓ DONE TODAY"
                : status === "failed"
                  ? `✗ FAILED · $${g.pledgeAmount} OWED`
                  : `IN PROGRESS · ${pct}%`;
            const statusClass =
              status === "successful"
                ? "bg-[#16A34A] text-[var(--color-off-white)]"
                : status === "failed"
                  ? "bg-[var(--color-black)] text-[var(--color-yellow)]"
                  : "bg-[var(--color-yellow)] text-[var(--color-black)]";
            return (
              <li
                key={g.slug}
                className="bg-[var(--color-black)]/20 rounded-xl p-5 flex flex-col gap-3 ring-1 ring-[var(--color-off-white)]/20"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1 flex items-center gap-2">
                    <p className="font-[family-name:var(--font-display)] text-xl tracking-tight">
                      {g.title}
                    </p>
                    {g.subDescription && (
                      <InfoPopup content={g.subDescription} inverted />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${statusClass}`}
                  >
                    {statusLabel}
                  </span>
                </div>

                {todayEval && (
                  <>
                    <p className="text-xs text-[var(--color-off-white)]/75 tabular-nums">
                      {todayEval.achieved}/{todayEval.target}{" "}
                      {g.unit || ""} today
                    </p>
                    <div className="w-full h-1.5 rounded-full bg-[var(--color-off-white)]/15 overflow-hidden">
                      <div
                        className={`h-full ${status === "failed" ? "bg-[var(--color-yellow)]" : "bg-[var(--color-off-white)]"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between gap-3 flex-wrap text-xs text-[var(--color-off-white)]/75">
                  <span>
                    ${g.pledgeAmount} →{" "}
                    {g.pledgeRecipient === "tiktok"
                      ? "random stranger"
                      : "charity"}{" "}
                    if I fail
                  </span>
                  {g.shareTo !== "none" && (
                    <span className="text-[10px] uppercase tracking-wider opacity-60">
                      shared on /{g.shareTo}/
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function PledgeHistorySection({
  history,
}: {
  history: PledgeEvaluation[];
}) {
  const [showAll, setShowAll] = useState(false);
  // Skip pending — only completed evaluations belong in history.
  const completed = history.filter((e) => e.result !== "pending");
  if (completed.length === 0) return null;

  const recent = showAll ? completed : completed.slice(0, 10);

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-20">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
            Receipts
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl sm:text-5xl tracking-tight">
            Past pledges
          </h2>
        </div>
        {completed.length > 10 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-sm font-semibold underline decoration-[var(--color-warm-gray)] hover:decoration-[var(--color-black)] cursor-pointer"
          >
            {showAll ? "Show recent only" : `Show all ${completed.length}`}
          </button>
        )}
      </div>

      <ul className="divide-y divide-[var(--color-warm-gray)] border-y border-[var(--color-warm-gray)]">
        {recent.map((e, i) => (
          <li
            key={`${e.goalSlug}-${e.date}-${i}`}
            className="py-3 flex items-center justify-between gap-4 flex-wrap"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold tracking-tight">{e.goalTitle}</p>
              <p className="text-xs text-[var(--color-black)]/60">
                {formatShortDate(e.date)} ·{" "}
                {e.achieved}/{e.target}
                {e.shareTo !== "none" && ` · /${e.shareTo}/`}
              </p>
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded flex-shrink-0 ${
                e.result === "successful"
                  ? "bg-[#16A34A] text-[var(--color-off-white)]"
                  : "bg-[#D64545] text-[var(--color-off-white)]"
              }`}
            >
              {e.result === "successful"
                ? "✓ Successful"
                : `✗ Failed · -$${e.pledgeAmount}`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function GoalsPage({
  cache,
  summary,
  currentStreak,
  longestStreak,
  goals,
  pledgeHistory,
}: Props) {
  const connected = !!cache.generatedAt;
  const archived = goals.filter((g) => g.status === "archived");

  return (
    <Layout
      title="Goals"
      description="Private goals dashboard."
      path="/goals/"
      ogImage="/og/home.png"
      noIndex
    >
      <GitHubGate>
        {/* Hero */}
        <section className="bg-[var(--color-off-white)] text-[var(--color-black)]">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-12 lg:pt-28 lg:pb-16">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
              Accountability
            </p>
            <h1 className="mt-4 text-5xl sm:text-7xl lg:text-8xl tracking-tight leading-[0.95]">
              <span className="inline-block relative">
                Goals
                <span
                  aria-hidden="true"
                  className="absolute left-0 right-0 -bottom-1 lg:-bottom-2 h-2 lg:h-3 bg-[var(--color-yellow)]"
                />
              </span>
            </h1>
          </div>
        </section>

        <MoneyOnTheLine goals={goals} history={pledgeHistory} />

        <section className="max-w-7xl mx-auto px-6 lg:px-10">
          {CATEGORIES.map((cat) => (
            <CategorySection
              key={cat}
              category={cat}
              goals={goals.filter((g) => g.category === cat)}
            />
          ))}
        </section>

        {/* Success calendar */}
        <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-20">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
              Daily
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl sm:text-5xl tracking-tight">
              Success
            </h2>
            <p className="mt-3 text-base text-[var(--color-black)]/70 max-w-2xl">
              What tasks would I need to accomplish today to feel successful?
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-[var(--color-black)] text-[var(--color-off-white)] rounded-2xl p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-yellow)]">
                Success rate
              </p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-tight">
                {summary.successRatePct}%
              </p>
              <p className="mt-1 text-xs text-[var(--color-off-white)]/70">
                {summary.successfulDays} of {summary.totalDaysWithTasks}{" "}
                {summary.totalDaysWithTasks === 1 ? "day" : "days"}
              </p>
            </div>
            <div className="bg-[var(--color-yellow)] text-[var(--color-black)] rounded-2xl p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/70">
                Current streak
              </p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-tight">
                {currentStreak} {currentStreak === 1 ? "day" : "days"}
              </p>
            </div>
            <div className="bg-[var(--color-off-white)] border-2 border-[var(--color-warm-gray)] rounded-2xl p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
                Longest streak
              </p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-tight">
                {longestStreak.length}{" "}
                {longestStreak.length === 1 ? "day" : "days"}
              </p>
              <p className="mt-1 text-xs text-[var(--color-black)]/60">
                {longestStreak.lastDay
                  ? `Last achieved ${formatLongDate(longestStreak.lastDay)}`
                  : "—"}
              </p>
            </div>
          </div>

          {connected ? (
            <GoalsCalendar cache={cache} />
          ) : (
            <div className="bg-[var(--color-off-white)] border-2 border-[var(--color-warm-gray)] rounded-2xl p-8 lg:p-12 text-center">
              <p className="text-xl text-[var(--color-black)]/70">
                Google Tasks isn&apos;t connected yet.
              </p>
            </div>
          )}
        </section>

        <PledgeHistorySection history={pledgeHistory} />

        {archived.length > 0 && (
          <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-20">
            <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl tracking-tight text-[var(--color-black)]/70">
              Archived goals
            </h2>
            <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archived.map((g) => (
                <li key={g.slug} className="opacity-70">
                  <SingleGoalCard goal={g} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="pb-16" />
      </GitHubGate>
    </Layout>
  );
}
