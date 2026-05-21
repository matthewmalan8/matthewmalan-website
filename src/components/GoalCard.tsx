import { progressPct, type Goal, type GoalGroup } from "@/lib/goals-data-types";

function formatNumber(n: number, unit: string): string {
  const isMoney = unit === "$" || unit === "USD";
  if (isMoney) {
    return `$${n.toLocaleString()}`;
  }
  return n.toLocaleString();
}

function daysLeft(iso: string): { text: string; tone: "ok" | "warn" | "late" } {
  if (!iso) return { text: "", tone: "ok" };
  const target = new Date(iso).getTime();
  const ms = target - Date.now();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, tone: "late" };
  if (days === 0) return { text: "due today", tone: "warn" };
  if (days <= 7) return { text: `${days}d left`, tone: "warn" };
  return { text: `${days}d left`, tone: "ok" };
}

function StatusPill({ status }: { status: Goal["status"] }) {
  const map: Record<Goal["status"], { label: string; classes: string }> = {
    active: {
      label: "Active",
      // Yellow + black so it's readable on both yellow and black cards.
      classes: "bg-[var(--color-yellow)] text-[var(--color-black)]",
    },
    successful: {
      label: "Successful",
      classes: "bg-[#16A34A] text-[var(--color-off-white)]",
    },
    failed: {
      label: "Failed",
      classes: "bg-[#D64545] text-[var(--color-off-white)]",
    },
    archived: {
      label: "Archived",
      classes:
        "bg-[var(--color-warm-gray)]/30 text-[var(--color-black)]/60 line-through",
    },
  };
  const { label, classes } = map[status];
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${classes}`}
    >
      {label}
    </span>
  );
}

function ProgressBar({ pct, status }: { pct: number; status: Goal["status"] }) {
  const fillColor =
    status === "successful"
      ? "bg-[#16A34A]"
      : status === "failed"
        ? "bg-[#D64545]"
        : "bg-[var(--color-yellow)]";
  return (
    <div className="w-full h-2 rounded-full bg-[var(--color-warm-gray)]/40 overflow-hidden">
      <div
        className={`h-full ${fillColor} transition-all`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function SingleGoalCard({
  goal,
  featured = false,
  publicView = false,
}: {
  goal: Goal;
  featured?: boolean;
  // When true (used on /dropshipping/ + /gym/), hide the timeframe pill —
  // public visitors don't need to see "Year/Quarter/Week" labels.
  publicView?: boolean;
}) {
  const pct = progressPct(goal);
  const left = daysLeft(goal.deadline);
  const isFeatured = featured;

  return (
    <article
      className={
        isFeatured
          ? "bg-[var(--color-black)] text-[var(--color-off-white)] rounded-2xl p-6 lg:p-10"
          : "bg-[var(--color-off-white)] border-2 border-[var(--color-warm-gray)] rounded-2xl p-5 lg:p-6"
      }
    >
      {isFeatured && (
        <p
          className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-yellow)] mb-3"
          aria-label="Pinned goal"
        >
          ★ Pinned goal
        </p>
      )}
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {!publicView && (
            <span
              className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${
                isFeatured ? "text-[var(--color-yellow)]" : "text-[var(--color-black)]/60"
              }`}
            >
              {goal.timeframe}
            </span>
          )}
          <StatusPill status={goal.status} />
        </div>
        {left.text && (
          <span
            className={`text-xs font-semibold ${
              left.tone === "late"
                ? "text-[#D64545]"
                : left.tone === "warn"
                  ? isFeatured
                    ? "text-[var(--color-yellow)]"
                    : "text-[#B45309]"
                  : isFeatured
                    ? "text-[var(--color-off-white)]/60"
                    : "text-[var(--color-black)]/60"
            }`}
          >
            {left.text}
          </span>
        )}
      </div>

      <h3
        className={`font-[family-name:var(--font-display)] tracking-tight ${
          isFeatured ? "text-3xl lg:text-5xl" : "text-xl lg:text-2xl"
        }`}
      >
        {goal.title}
      </h3>

      <div className="mt-4 flex items-baseline gap-2 flex-wrap">
        <span
          className={`font-[family-name:var(--font-display)] tracking-tight ${
            isFeatured ? "text-4xl lg:text-6xl" : "text-2xl"
          }`}
        >
          {formatNumber(goal.current, goal.unit)}
        </span>
        <span
          className={
            isFeatured
              ? "text-base text-[var(--color-off-white)]/60"
              : "text-sm text-[var(--color-black)]/60"
          }
        >
          / {formatNumber(goal.target, goal.unit)}
          {goal.unit && goal.unit !== "$" ? ` ${goal.unit}` : ""}
        </span>
        <span
          className={
            isFeatured
              ? "ml-auto text-base text-[var(--color-yellow)] font-semibold"
              : "ml-auto text-sm text-[var(--color-black)]/70 font-semibold"
          }
        >
          {pct}%
        </span>
      </div>

      <div className="mt-3">
        <ProgressBar pct={pct} status={goal.status} />
      </div>

      {goal.description && (
        <p
          className={`mt-4 text-sm ${
            isFeatured ? "text-[var(--color-off-white)]/70" : "text-[var(--color-black)]/70"
          }`}
        >
          {goal.description}
        </p>
      )}
    </article>
  );
}

export function GroupedGoalCard({ group }: { group: GoalGroup }) {
  if (group.goals.length === 1) {
    return <SingleGoalCard goal={group.goals[0]} />;
  }
  const pct = group.combinedPct;
  return (
    <article className="bg-[var(--color-off-white)] border-2 border-[var(--color-warm-gray)] rounded-2xl p-5 lg:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
            {group.timeframe}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--color-yellow)] text-[var(--color-black)]">
            Combined ({group.goals.length})
          </span>
        </div>
        <span className="text-sm text-[var(--color-black)]/70 font-semibold">
          {pct}%
        </span>
      </div>

      <ul className="space-y-3">
        {group.goals.map((g) => {
          const gpct = progressPct(g);
          return (
            <li key={g.slug}>
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <p className="font-[family-name:var(--font-display)] text-lg tracking-tight">
                  {g.title}
                </p>
                <p className="text-xs text-[var(--color-black)]/60 tabular-nums whitespace-nowrap">
                  {formatNumber(g.current, g.unit)} /{" "}
                  {formatNumber(g.target, g.unit)}
                  {g.unit && g.unit !== "$" ? ` ${g.unit}` : ""} · {gpct}%
                </p>
              </div>
              <ProgressBar pct={gpct} status={g.status} />
            </li>
          );
        })}
      </ul>

      <div className="mt-4 pt-4 border-t border-[var(--color-warm-gray)]/60">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60 mb-2">
          Combined progress
        </p>
        <ProgressBar pct={pct} status="active" />
      </div>
    </article>
  );
}
