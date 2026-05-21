import type { GetStaticProps } from "next";
import Layout from "@/components/Layout";
import GitHubGate from "@/components/GitHubGate";
import GoalsCalendar from "@/components/GoalsCalendar";
import { GroupedGoalCard, SingleGoalCard } from "@/components/GoalCard";
import {
  computeCurrentSuccessStreak,
  computeLongestSuccessStreak,
  computeSuccessSummary,
  type GoalTaskCache,
  type StreakRecord,
  type SuccessSummary,
} from "@/lib/goals";
import { getGoalsCache } from "@/lib/goals-server";
import { getAllGoals, getBeeminderGoalSnapshots } from "@/lib/goals-data";
import {
  CATEGORIES,
  groupGoals,
  type BeeminderGoalSnapshot,
  type Goal,
  type GoalCategory,
} from "@/lib/goals-data-types";

type Props = {
  cache: GoalTaskCache;
  summary: SuccessSummary;
  currentStreak: number;
  longestStreak: StreakRecord;
  goals: Goal[];
  beeminderSnapshots: BeeminderGoalSnapshot[];
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
      beeminderSnapshots: getBeeminderGoalSnapshots(),
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

function formatRunits(r: string): string {
  switch (r) {
    case "d":
      return "day";
    case "w":
      return "week";
    case "m":
      return "month";
    case "y":
      return "year";
    default:
      return r || "period";
  }
}

function formatPledge(p: number): string {
  if (!p) return "$0";
  return `$${p}`;
}

function deriveBeeminderStatus(s: BeeminderGoalSnapshot): {
  label: string;
  tone: "ok" | "warn" | "danger";
} {
  if (s.safebuf <= 0) {
    return { label: "DERAILS TODAY", tone: "danger" };
  }
  if (s.safebuf === 1) {
    return { label: "1 day buffer", tone: "warn" };
  }
  if (s.safebuf <= 3) {
    return { label: `${s.safebuf} days buffer`, tone: "warn" };
  }
  return { label: `${s.safebuf} days buffer`, tone: "ok" };
}

function loseDateText(unix: number): string {
  if (!unix) return "";
  const d = new Date(unix * 1000);
  return d.toLocaleString("en-US", {
    timeZone: "America/Phoenix",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function GoalsPage({
  cache,
  summary,
  currentStreak,
  longestStreak,
  goals,
  beeminderSnapshots,
}: Props) {
  const connected = !!cache.generatedAt;
  const archived = goals.filter((g) => g.status === "archived");
  // Dashboard order: most urgent first (lowest safebuf), tie-break by
  // bigger pledge.
  const orderedSnapshots = [...beeminderSnapshots].sort((a, b) => {
    if (a.safebuf !== b.safebuf) return a.safebuf - b.safebuf;
    return b.pledge - a.pledge;
  });

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

      {/* Money on the line — live Beeminder dashboard. Pulled from
          /users/{me}/goals.json at the 23:45 MST sync. Sorted by
          urgency (least buffer first). */}
      {orderedSnapshots.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-8">
          <div className="bg-[#D64545] text-[var(--color-off-white)] rounded-2xl p-6 lg:p-10 ring-2 ring-[#A92A2A]">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em]">
              💸 Money on the line
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl tracking-tight">
              Beeminder is watching {orderedSnapshots.length}{" "}
              {orderedSnapshots.length === 1 ? "goal" : "goals"}.
            </h2>
            <p className="mt-2 text-sm text-[var(--color-off-white)]/80">
              Live from Beeminder · last pulled at the 23:45 MST sync.
            </p>
            <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {orderedSnapshots.map((s) => {
                const status = deriveBeeminderStatus(s);
                const pct =
                  s.goalval && s.goalval > 0
                    ? Math.max(
                        0,
                        Math.min(100, Math.round((s.curval / s.goalval) * 100))
                      )
                    : null;
                const rateText =
                  s.rate != null
                    ? `${Number.isInteger(s.rate) ? s.rate : s.rate.toFixed(1)} ${s.gunits || ""}/${formatRunits(s.runits)}`.trim()
                    : "";
                return (
                  <li
                    key={s.slug}
                    className="bg-[var(--color-black)]/20 rounded-xl p-5 flex flex-col gap-3 ring-1 ring-[var(--color-off-white)]/20"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <p className="font-[family-name:var(--font-display)] text-xl tracking-tight">
                          {s.title}
                        </p>
                        {rateText && (
                          <p className="text-xs uppercase tracking-wider text-[var(--color-off-white)]/75 mt-0.5">
                            {rateText} · pledge {formatPledge(s.pledge)}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          status.tone === "danger"
                            ? "bg-[var(--color-black)] text-[var(--color-yellow)]"
                            : status.tone === "warn"
                              ? "bg-[var(--color-yellow)] text-[var(--color-black)]"
                              : "bg-[var(--color-off-white)]/15 text-[var(--color-off-white)]"
                        }`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-[family-name:var(--font-display)] text-3xl tracking-tight tabular-nums">
                        {Number.isInteger(s.curval)
                          ? s.curval
                          : s.curval.toFixed(2)}
                      </span>
                      <span className="text-sm text-[var(--color-off-white)]/70">
                        {s.gunits}
                        {s.goalval != null
                          ? ` / ${s.goalval} target`
                          : ""}
                        {pct != null ? ` · ${pct}%` : ""}
                      </span>
                    </div>

                    {s.goalval != null && s.goalval > 0 && (
                      <div className="w-full h-1.5 rounded-full bg-[var(--color-off-white)]/15 overflow-hidden">
                        <div
                          className="h-full bg-[var(--color-yellow)]"
                          style={{ width: `${pct ?? 0}%` }}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3 flex-wrap text-xs text-[var(--color-off-white)]/75">
                      {s.losedate > 0 && (
                        <span>Next derail: {loseDateText(s.losedate)}</span>
                      )}
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold uppercase tracking-wider underline decoration-[var(--color-off-white)]/40 hover:decoration-[var(--color-off-white)]"
                      >
                        Beeminder →
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* Category boards */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10">
        {CATEGORIES.map((cat) => (
          <CategorySection
            key={cat}
            category={cat}
            goals={goals.filter((g) => g.category === cat)}
          />
        ))}
      </section>

      {/* Success calendar (daily tasks) */}
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
              {longestStreak.length} {longestStreak.length === 1 ? "day" : "days"}
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
            <p className="mt-2 text-sm text-[var(--color-black)]/60">
              Once the OAuth refresh token is in GitHub Secrets, daily task
              data will populate here automatically.
            </p>
          </div>
        )}
      </section>

      {/* Archived */}
      {archived.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-20 pb-24">
          <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl tracking-tight text-[var(--color-black)]/70">
            Archived goals
          </h2>
          <p className="mt-1 text-sm text-[var(--color-black)]/50">
            Goals I&apos;ve put on the shelf. Still here, not on the active
            board.
          </p>
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
