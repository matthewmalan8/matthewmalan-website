import { useState } from "react";
import type { GetStaticProps } from "next";
import Layout from "@/components/Layout";
import DropshippingCalendar from "@/components/DropshippingCalendar";
import {
  ChevronDownIcon,
  GridIcon,
  ListIcon,
  LockIcon,
  TikTokIcon,
  YouTubeIcon,
} from "@/components/Icons";
import {
  getAllGoals,
  getDailyLogs,
  getFailures,
  getPinnedGoal,
  getPledges,
  getScreenshots,
} from "@/lib/dropshipping";
import {
  daysUntil,
  filterAndSortGoals,
  formatDate,
  formatGoalValue,
  formatHoursMinutes,
  formatMoney,
  formatShortDate,
  getCurrentStreak,
  getLongestStreak,
  getTotalMinutes,
  getTotalVideos,
  goalProgressPct,
  GOAL_FILTERS,
  hasVideoPredicate,
  hoursAtLeast,
  type DailyLog,
  type DropshippingGoal,
  type Failure,
  type GoalFilter,
  type Pledge,
  type Screenshot,
  type Streak,
} from "@/lib/dropshipping-utils";

type Props = {
  logs: DailyLog[];
  pledges: Pledge[];
  screenshots: Screenshot[];
  failures: Failure[];
  goals: DropshippingGoal[];
  pinnedGoal: DropshippingGoal | null;
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const goals = getAllGoals();
  return {
    props: {
      logs: await getDailyLogs(),
      pledges: getPledges(),
      screenshots: getScreenshots(),
      failures: await getFailures(),
      goals,
      pinnedGoal: getPinnedGoal(goals),
    },
  };
};

function ScoreCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--color-black)] text-[var(--color-off-white)] rounded-2xl p-6 lg:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-yellow)]">
        {label}
      </p>
      <p className="mt-4 font-[family-name:var(--font-display)] text-5xl lg:text-6xl tracking-tight">
        {value}
      </p>
    </div>
  );
}

function StreakCard({
  label,
  current,
  longest,
  unitSingular = "day",
  unitPlural = "days",
}: {
  label: string;
  current: number;
  longest: Streak;
  unitSingular?: string;
  unitPlural?: string;
}) {
  const unit = (n: number) => (n === 1 ? unitSingular : unitPlural);
  return (
    <div className="bg-[var(--color-off-white)] border-2 border-[var(--color-warm-gray)] rounded-2xl p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
        {label}
      </p>
      <div className="mt-4 grid grid-cols-2 divide-x divide-[var(--color-warm-gray)]">
        <div className="pr-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-black)]/50">
            Current
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-3xl tracking-tight">
            {current}{" "}
            <span className="text-sm font-normal text-[var(--color-black)]/60">
              {unit(current)}
            </span>
          </p>
        </div>
        <div className="pl-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-black)]/50">
            Longest
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-3xl tracking-tight">
            {longest.length}{" "}
            <span className="text-sm font-normal text-[var(--color-black)]/60">
              {unit(longest.length)}
            </span>
          </p>
          {longest.lastAchieved && (
            <p className="mt-1 text-[10px] text-[var(--color-black)]/50">
              Last: {formatShortDate(longest.lastAchieved)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

type ViewMode = "grid" | "compact";

function ViewToggle({
  value,
  onChange,
  label,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={`${label} view mode`}
      className="flex items-center gap-1 p-1 rounded-full border border-[var(--color-warm-gray)] bg-[var(--color-off-white)]"
    >
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-pressed={value === "grid"}
        title="Grid view"
        className={`w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors ${
          value === "grid"
            ? "bg-[var(--color-black)] text-[var(--color-yellow)]"
            : "text-[var(--color-black)]/50 hover:text-[var(--color-black)]"
        }`}
      >
        <GridIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("compact")}
        aria-pressed={value === "compact"}
        title="Compact view"
        className={`w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors ${
          value === "compact"
            ? "bg-[var(--color-black)] text-[var(--color-yellow)]"
            : "text-[var(--color-black)]/50 hover:text-[var(--color-black)]"
        }`}
      >
        <ListIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function DropshippingPage({
  logs,
  pledges,
  screenshots,
  failures,
  goals,
  pinnedGoal,
}: Props) {
  const [pledgesView, setPledgesView] = useState<ViewMode>("grid");
  const [screenshotsView, setScreenshotsView] = useState<ViewMode>("grid");
  const [failuresView, setFailuresView] = useState<ViewMode>("grid");
  const [goalsFilter, setGoalsFilter] = useState<GoalFilter>("recent");

  const otherGoals = goals.filter((g) => !pinnedGoal || g.slug !== pinnedGoal.slug);
  const visibleGoals = filterAndSortGoals(otherGoals, goalsFilter);
  const totalVideos = getTotalVideos(logs);
  const totalMinutes = getTotalMinutes(logs);

  const currentVideoStreak = getCurrentStreak(logs, hasVideoPredicate);
  const longestVideoStreak = getLongestStreak(logs, (l) => !!l.videoUrl);

  const currentThreeHour = getCurrentStreak(logs, hoursAtLeast(3));
  const longestThreeHour = getLongestStreak(logs, (l) =>
    hoursAtLeast(3)(l)
  );

  const currentEightHour = getCurrentStreak(logs, hoursAtLeast(8));
  const longestEightHour = getLongestStreak(logs, (l) =>
    hoursAtLeast(8)(l)
  );

  const pinnedPct = pinnedGoal ? goalProgressPct(pinnedGoal) : 0;
  const pinnedRemaining = pinnedGoal ? daysUntil(pinnedGoal.deadline) : 0;

  return (
    <Layout
      title="Dropshipping"
      description="Building a dropshipping business in public. Daily videos, real numbers, real failures."
      path="/dropshipping/"
    >
      {/* Hero */}
      <section className="bg-[var(--color-black)] text-[var(--color-off-white)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-16 lg:pt-28">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-yellow)]">
            Building in public
          </p>
          <h1 className="mt-6 text-5xl sm:text-7xl tracking-tight max-w-4xl">
            Dropshipping
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-[var(--color-warm-gray)] leading-relaxed">
            The real numbers, the real hours, and the failures I&apos;m not
            hiding. Follow along.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="https://www.youtube.com/@matthewmalan7"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[var(--color-off-white)] text-[var(--color-black)] rounded-full pl-4 pr-5 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <YouTubeIcon className="w-5 h-5" />
              Follow on YouTube
            </a>
            <a
              href="https://www.tiktok.com/@matt.malan8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[var(--color-off-white)] text-[var(--color-black)] rounded-full pl-4 pr-5 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <TikTokIcon className="w-5 h-5" />
              Follow on TikTok
            </a>
          </div>
        </div>
      </section>

      {/* Pinned Goal */}
      {pinnedGoal && (
        <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-12">
          <div className="bg-[var(--color-yellow)] text-[var(--color-black)] rounded-2xl p-8 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/70">
              The Goal
            </p>
            <p className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl tracking-tight">
              By {formatDate(pinnedGoal.deadline)} — {pinnedGoal.title}.
            </p>
            {pinnedGoal.description && (
              <p className="mt-3 text-base sm:text-lg text-[var(--color-black)]/80 max-w-3xl">
                {pinnedGoal.description}
              </p>
            )}

            <div className="mt-8">
              <div className="flex items-end justify-between gap-4 flex-wrap">
                <p className="text-2xl sm:text-3xl font-bold">
                  {formatGoalValue(pinnedGoal.current, pinnedGoal.unit)}{" "}
                  <span className="text-base font-normal text-[var(--color-black)]/70">
                    / {formatGoalValue(pinnedGoal.target, pinnedGoal.unit)} (
                    {pinnedPct}%)
                  </span>
                </p>
                <p className="text-sm text-[var(--color-black)]/70">
                  {pinnedRemaining} days remaining
                </p>
              </div>
              <div className="mt-3 h-4 bg-[var(--color-black)]/15 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-black)] transition-all"
                  style={{ width: `${pinnedPct}%` }}
                />
              </div>
              {pinnedGoal.lastUpdated && (
                <p className="mt-3 text-xs text-[var(--color-black)]/60">
                  Last updated: {formatShortDate(pinnedGoal.lastUpdated)}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Scorecards */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ScoreCard label="Total videos posted" value={String(totalVideos)} />
          <ScoreCard
            label="Total time worked"
            value={formatHoursMinutes(totalMinutes)}
          />
          <ScoreCard
            label="Total failed products"
            value={String(failures.length)}
          />
        </div>
      </section>

      {/* Streaks — hidden on mobile to keep the top of the page lean */}
      <section className="hidden sm:block max-w-7xl mx-auto px-6 lg:px-10 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StreakCard
            label="Daily video streak"
            current={currentVideoStreak}
            longest={longestVideoStreak}
          />
          <StreakCard
            label="3+ hr workday streak"
            current={currentThreeHour}
            longest={longestThreeHour}
          />
          <StreakCard
            label="8+ hr workday streak"
            current={currentEightHour}
            longest={longestEightHour}
          />
        </div>
      </section>

      {/* Calendar */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-12">
        <h2 className="text-3xl sm:text-4xl tracking-tight mb-6">
          Daily activity
        </h2>
        <DropshippingCalendar logs={logs} />
      </section>

      {/* Goals */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-16">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-3xl sm:text-4xl tracking-tight">Goals</h2>
            <p className="mt-2 text-[var(--color-black)]/70 max-w-2xl">
              Every milestone I&apos;m chasing. Public, dated, scored.
            </p>
          </div>
          {otherGoals.length > 0 && (
            <div className="relative">
              <label htmlFor="goals-filter" className="sr-only">
                Filter goals
              </label>
              <select
                id="goals-filter"
                value={goalsFilter}
                onChange={(e) =>
                  setGoalsFilter(e.target.value as GoalFilter)
                }
                className="appearance-none pl-5 pr-11 py-2.5 rounded-full border-2 border-[var(--color-black)] bg-[var(--color-off-white)] text-sm font-semibold focus:outline-none cursor-pointer"
              >
                {GOAL_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-black)] pointer-events-none" />
            </div>
          )}
        </div>

        {goals.length === 0 ? (
          <p className="mt-8 text-[var(--color-black)]/60">
            No goals yet — add some in /dropshipping-admin/.
          </p>
        ) : otherGoals.length === 0 ? (
          <p className="mt-8 text-[var(--color-black)]/60">
            Only the pinned goal exists right now. Add more in
            /dropshipping-admin/.
          </p>
        ) : visibleGoals.length === 0 ? (
          <p className="mt-8 text-[var(--color-black)]/60">
            No goals match that filter.
          </p>
        ) : (
          <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {visibleGoals.map((g) => {
              const pct = goalProgressPct(g);
              const remaining = daysUntil(g.deadline);
              const statusStyles =
                g.status === "successful"
                  ? "bg-[var(--color-lime)] text-[var(--color-black)]"
                  : g.status === "failed"
                    ? "bg-[#D64545] text-[var(--color-off-white)]"
                    : "bg-[var(--color-yellow)] text-[var(--color-black)]";
              const statusLabel =
                g.status === "successful"
                  ? "Successful ✓"
                  : g.status === "failed"
                    ? "Failed"
                    : "Active";
              return (
                <li
                  key={g.slug}
                  className="border-2 border-[var(--color-warm-gray)] rounded-2xl p-6 flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl tracking-tight">{g.title}</h3>
                    <span
                      className={`flex-shrink-0 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${statusStyles}`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  {g.description && (
                    <p className="mt-3 text-[var(--color-black)]/75">
                      {g.description}
                    </p>
                  )}
                  <div className="mt-5">
                    <p className="text-lg font-bold">
                      {formatGoalValue(g.current, g.unit)}{" "}
                      <span className="text-sm font-normal text-[var(--color-black)]/60">
                        / {formatGoalValue(g.target, g.unit)} ({pct}%)
                      </span>
                    </p>
                    <div className="mt-2 h-2.5 bg-[var(--color-warm-gray)]/40 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          g.status === "successful"
                            ? "bg-[var(--color-lime)]"
                            : g.status === "failed"
                              ? "bg-[#D64545]"
                              : "bg-[var(--color-black)]"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <dl className="mt-5 space-y-1.5 text-sm">
                    {g.deadline && (
                      <div className="flex justify-between">
                        <dt className="text-[var(--color-black)]/60">
                          Deadline
                        </dt>
                        <dd className="font-semibold">
                          {formatShortDate(g.deadline)}
                          {g.status === "active" && remaining > 0 && (
                            <span className="ml-2 text-[var(--color-black)]/50 font-normal">
                              ({remaining}d)
                            </span>
                          )}
                        </dd>
                      </div>
                    )}
                    {g.lastUpdated && (
                      <div className="flex justify-between text-xs text-[var(--color-black)]/50">
                        <dt>Last updated</dt>
                        <dd>{formatShortDate(g.lastUpdated)}</dd>
                      </div>
                    )}
                  </dl>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Pledges */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-16">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-3xl sm:text-4xl tracking-tight">Pledges</h2>
            <p className="mt-2 text-[var(--color-black)]/70 max-w-2xl">
              Putting real money on the line. If I don&apos;t hit these by their
              deadline, I pay up.
            </p>
          </div>
          {pledges.length > 0 && (
            <ViewToggle
              value={pledgesView}
              onChange={setPledgesView}
              label="Pledges"
            />
          )}
        </div>
        {pledges.length === 0 ? (
          <p className="mt-8 text-[var(--color-black)]/60">
            No pledges yet.
          </p>
        ) : pledgesView === "grid" ? (
          <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {pledges.map((p) => {
              const statusStyles =
                p.status === "completed"
                  ? "bg-[var(--color-lime)] text-[var(--color-black)]"
                  : p.status === "failed"
                    ? "bg-[var(--color-black)] text-[var(--color-off-white)]"
                    : "bg-[var(--color-yellow)] text-[var(--color-black)]";
              const statusLabel =
                p.status === "completed"
                  ? "Completed ✓"
                  : p.status === "failed"
                    ? "Paid up"
                    : "Active";
              return (
                <li
                  key={p.slug}
                  className="border-2 border-[var(--color-warm-gray)] rounded-2xl p-6 flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl tracking-tight">{p.title}</h3>
                    <span
                      className={`flex-shrink-0 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${statusStyles}`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  {p.description && (
                    <p className="mt-3 text-[var(--color-black)]/75">
                      {p.description}
                    </p>
                  )}
                  <dl className="mt-5 space-y-2 text-sm">
                    {p.amount > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-[var(--color-black)]/60">
                          On the line
                        </dt>
                        <dd className="font-semibold">
                          {formatMoney(p.amount)}
                          {p.recipient ? ` to ${p.recipient}` : ""}
                        </dd>
                      </div>
                    )}
                    {p.deadline && (
                      <div className="flex justify-between">
                        <dt className="text-[var(--color-black)]/60">
                          Deadline
                        </dt>
                        <dd className="font-semibold">
                          {formatShortDate(p.deadline)}
                        </dd>
                      </div>
                    )}
                  </dl>
                  {p.videoUrl && (
                    <a
                      href={p.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex items-center text-sm font-semibold hover:text-[#4A4A4A] transition-colors self-start"
                    >
                      Watch the challenge →
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <ul className="mt-8 divide-y divide-[var(--color-warm-gray)] border-y border-[var(--color-warm-gray)]">
            {pledges.map((p) => {
              const dotColor =
                p.status === "completed"
                  ? "bg-[var(--color-lime)]"
                  : p.status === "failed"
                    ? "bg-[var(--color-black)]"
                    : "bg-[var(--color-yellow)]";
              const statusLabel =
                p.status === "completed"
                  ? "Completed"
                  : p.status === "failed"
                    ? "Paid up"
                    : "Active";
              return (
                <li
                  key={p.slug}
                  className="py-4 flex items-center justify-between gap-4 flex-wrap"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor}`}
                      title={statusLabel}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold tracking-tight truncate">
                        {p.title}
                      </p>
                      <p className="text-xs text-[var(--color-black)]/60 mt-0.5">
                        {p.amount > 0
                          ? `${formatMoney(p.amount)}${p.recipient ? ` to ${p.recipient}` : ""}`
                          : statusLabel}
                        {p.deadline ? ` · ${formatShortDate(p.deadline)}` : ""}
                      </p>
                    </div>
                  </div>
                  {p.videoUrl && (
                    <a
                      href={p.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold hover:text-[#4A4A4A] transition-colors flex-shrink-0"
                    >
                      Watch →
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Screenshots */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-16">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-3xl sm:text-4xl tracking-tight">Screenshots</h2>
            <p className="mt-2 text-[var(--color-black)]/70 max-w-2xl">
              Snapshots from the journey.
            </p>
          </div>
          {screenshots.length > 0 && (
            <ViewToggle
              value={screenshotsView}
              onChange={setScreenshotsView}
              label="Screenshots"
            />
          )}
        </div>
        {screenshots.length === 0 ? (
          <p className="mt-8 text-[var(--color-black)]/60">
            No screenshots yet.
          </p>
        ) : screenshotsView === "grid" ? (
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {screenshots.map((s) => (
              <li
                key={s.slug}
                className="bg-[var(--color-off-white)] border border-[var(--color-warm-gray)] rounded-xl overflow-hidden"
              >
                {s.image && (
                  <div className="aspect-[4/3] bg-[var(--color-warm-gray)] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.image}
                      alt={s.imageAlt || s.caption}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-5">
                  {s.date && (
                    <p className="text-xs uppercase tracking-wider text-[var(--color-black)]/50">
                      {formatShortDate(s.date)}
                    </p>
                  )}
                  {s.caption && (
                    <p className="mt-2 text-[var(--color-black)]/80 leading-relaxed">
                      {s.caption}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-8 divide-y divide-[var(--color-warm-gray)] border-y border-[var(--color-warm-gray)]">
            {screenshots.map((s) => (
              <li
                key={s.slug}
                className="py-4 flex items-start gap-4"
              >
                {s.image && (
                  <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 overflow-hidden rounded-md bg-[var(--color-warm-gray)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.image}
                      alt={s.imageAlt || s.caption}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {s.date && (
                    <p className="text-xs uppercase tracking-wider text-[var(--color-black)]/50">
                      {formatShortDate(s.date)}
                    </p>
                  )}
                  {s.caption && (
                    <p className="mt-1 text-[var(--color-black)]/80 leading-snug">
                      {s.caption}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Failure graveyard */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-16 mb-24">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-3xl sm:text-4xl tracking-tight">
              The failure graveyard
            </h2>
            <p className="mt-2 text-[var(--color-black)]/70 max-w-2xl">
              Every product that didn&apos;t work, what I spent, and what it
              taught me.
            </p>
          </div>
          {failures.length > 0 && (
            <ViewToggle
              value={failuresView}
              onChange={setFailuresView}
              label="Failures"
            />
          )}
        </div>
        {failures.length === 0 ? (
          <p className="mt-8 text-[var(--color-black)]/60">
            No graves dug yet. Give it time.
          </p>
        ) : failuresView === "grid" ? (
          <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {failures.map((f) => (
              <li
                key={f.slug}
                className="bg-[var(--color-black)] text-[var(--color-off-white)] rounded-2xl overflow-hidden flex flex-col"
              >
                {f.productImage && (
                  <div className="relative aspect-[16/9] bg-[var(--color-warm-gray)]/20 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={f.productImage}
                      alt={f.blur ? "Hidden product" : f.product}
                      className={`w-full h-full object-cover ${
                        f.blur ? "blur-2xl scale-110" : ""
                      }`}
                      loading="lazy"
                    />
                    {f.blur && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-black)]/30">
                        <div className="inline-flex items-center gap-2 bg-[var(--color-black)] text-[var(--color-yellow)] px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider">
                          <LockIcon className="w-4 h-4" />
                          Hidden product
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="p-6 lg:p-8 flex-1 flex flex-col">
                  {f.failedOn && (
                    <p className="text-xs uppercase tracking-wider text-[var(--color-yellow)]">
                      {formatShortDate(f.failedOn)}
                    </p>
                  )}
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl tracking-tight flex items-center gap-3">
                    {f.blur ? (
                      <span className="inline-flex items-center gap-2 text-[var(--color-warm-gray)]">
                        <LockIcon className="w-5 h-5" />
                        Hidden product
                      </span>
                    ) : (
                      f.product
                    )}
                  </h3>
                  {f.adSpend > 0 && (
                    <p className="mt-3 text-sm">
                      <span className="text-[var(--color-warm-gray)]">
                        Ad spend:
                      </span>{" "}
                      <span className="font-bold">{formatMoney(f.adSpend)}</span>
                    </p>
                  )}
                  <div className="mt-5 space-y-4 text-sm">
                    {f.hypothesis && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-yellow)]">
                          Why I thought it would work
                        </p>
                        <p className="mt-1 text-[var(--color-off-white)]/85 leading-relaxed">
                          {f.hypothesis}
                        </p>
                      </div>
                    )}
                    {f.reasonFailed && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-yellow)]">
                          Why it failed
                        </p>
                        <p className="mt-1 text-[var(--color-off-white)]/85 leading-relaxed">
                          {f.reasonFailed}
                        </p>
                      </div>
                    )}
                    {f.lessonsHtml.trim() && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-yellow)]">
                          Lessons learned
                        </p>
                        <div
                          className="mt-1 text-[var(--color-off-white)]/85 leading-relaxed [&_p]:mt-2 [&_p:first-child]:mt-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mt-2 [&_li+li]:mt-1"
                          dangerouslySetInnerHTML={{ __html: f.lessonsHtml }}
                        />
                      </div>
                    )}
                  </div>
                  {f.videoUrl && (
                    <a
                      href={f.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 inline-flex items-center bg-[var(--color-yellow)] text-[var(--color-black)] px-5 py-2.5 text-sm font-semibold rounded-full hover:bg-[#FFF04D] transition-colors self-start"
                    >
                      Video recap →
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-8 divide-y divide-[var(--color-warm-gray)] border-y border-[var(--color-warm-gray)]">
            {failures.map((f) => (
              <li
                key={f.slug}
                className="py-4 flex items-center justify-between gap-4 flex-wrap"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {f.productImage && (
                    <div className="flex-shrink-0 w-12 h-12 overflow-hidden rounded-md bg-[var(--color-warm-gray)] relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f.productImage}
                        alt={f.blur ? "Hidden product" : f.product}
                        className={`w-full h-full object-cover ${
                          f.blur ? "blur-md scale-110" : ""
                        }`}
                        loading="lazy"
                      />
                      {f.blur && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-black)]/30">
                          <LockIcon className="w-4 h-4 text-[var(--color-yellow)]" />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold tracking-tight truncate">
                      {f.blur ? "Hidden product" : f.product}
                    </p>
                    <p className="text-xs text-[var(--color-black)]/60 mt-0.5">
                      {f.failedOn ? formatShortDate(f.failedOn) : ""}
                      {f.adSpend > 0
                        ? ` · ${formatMoney(f.adSpend)} ad spend`
                        : ""}
                    </p>
                  </div>
                </div>
                {f.videoUrl && (
                  <a
                    href={f.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold hover:text-[#4A4A4A] transition-colors flex-shrink-0"
                  >
                    Recap →
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </Layout>
  );
}
