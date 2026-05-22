import { useState } from "react";
import type { GetStaticProps } from "next";
import Layout from "@/components/Layout";
import DropshippingCalendar from "@/components/DropshippingCalendar";
import { SingleGoalCard } from "@/components/GoalCard";
import {
  GridIcon,
  ListIcon,
  LockIcon,
  TikTokIcon,
  YouTubeIcon,
} from "@/components/Icons";
import {
  getDailyLogs,
  getFailures,
  getScreenshots,
} from "@/lib/dropshipping";
import {
  formatHoursMinutes,
  formatMoney,
  formatShortDate,
  getCurrentStreak,
  getLongestStreak,
  getTotalMinutes,
  getTotalVideos,
  hasVideoPredicate,
  hoursAtLeast,
  type DailyLog,
  type Failure,
  type Screenshot,
  type Streak,
} from "@/lib/dropshipping-utils";
import {
  getAllGoals,
  getAllPledgeProofs,
  getPledgeHistory,
} from "@/lib/goals-data";
import type {
  Goal,
  PledgeEvaluation,
  PledgeProof,
} from "@/lib/goals-data-types";
import SharedPledgeSection from "@/components/SharedPledgeSection";

type Props = {
  logs: DailyLog[];
  screenshots: Screenshot[];
  failures: Failure[];
  sharedGoals: Goal[];
  pinnedGoal: Goal | null;
  pledgeHistory: PledgeEvaluation[];
  pledgeProofs: PledgeProof[];
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const all = getAllGoals();
  const shared = all.filter(
    (g) => g.shareTo === "dropshipping" && g.status !== "archived"
  );
  const pinned = shared.find((g) => g.pinned) ?? null;
  return {
    props: {
      logs: await getDailyLogs(),
      screenshots: getScreenshots(),
      failures: await getFailures(),
      sharedGoals: shared.filter((g) => g !== pinned),
      pinnedGoal: pinned,
      pledgeHistory: getPledgeHistory(),
      pledgeProofs: getAllPledgeProofs(),
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
  screenshots,
  failures,
  sharedGoals,
  pinnedGoal,
  pledgeHistory,
  pledgeProofs,
}: Props) {
  const [screenshotsView, setScreenshotsView] = useState<ViewMode>("grid");
  const [failuresView, setFailuresView] = useState<ViewMode>("grid");

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

  return (
    <Layout
      title="Dropshipping"
      description="Building a dropshipping business in public. Daily videos, real numbers, real failures."
      path="/dropshipping/"
      ogImage="/og/dropshipping.png"
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

      {/* Public pledge section — active rules + receipts + TikTok proof */}
      <SharedPledgeSection
        goals={pinnedGoal ? [pinnedGoal, ...sharedGoals] : sharedGoals}
        history={pledgeHistory}
        proofs={pledgeProofs}
      />

      {/* Pinned Goal — surfaced from /goals-admin/ when shareTo=dropshipping & pinned */}
      {pinnedGoal && (
        <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-12">
          <SingleGoalCard goal={pinnedGoal} featured publicView />
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
        <h2 className="text-3xl sm:text-4xl tracking-tight">Goals</h2>

        {sharedGoals.length > 0 && (
          <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {sharedGoals.map((g) => (
              <li key={g.slug}>
                <SingleGoalCard goal={g} publicView />
              </li>
            ))}
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
