import { useState } from "react";
import { progressPct, type Goal, type GoalGroup } from "@/lib/goals-data-types";

// "(i)" icon that opens a popup with the sub-description. Click to open,
// click outside or the × to close.
export function InfoPopup({
  content,
  inverted = false,
}: {
  content: string;
  inverted?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!content) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="More info"
        title="More info"
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full border text-[11px] font-bold cursor-pointer transition-colors flex-shrink-0 ${
          inverted
            ? "border-[var(--color-yellow)] text-[var(--color-yellow)] hover:bg-[var(--color-yellow)] hover:text-[var(--color-black)]"
            : "border-[var(--color-black)]/40 text-[var(--color-black)]/70 hover:border-[var(--color-black)] hover:text-[var(--color-black)]"
        }`}
      >
        i
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[var(--color-black)]/60"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--color-off-white)] text-[var(--color-black)] rounded-2xl max-w-md w-full p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
                Details
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-[var(--color-black)]/50 hover:text-[var(--color-black)] text-2xl leading-none cursor-pointer -mr-1 -mt-1"
              >
                ×
              </button>
            </div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-black)]/80">
              {content}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

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
          {!publicView && goal.shareTo !== "none" && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                isFeatured
                  ? "bg-[var(--color-yellow)]/15 text-[var(--color-yellow)] ring-1 ring-[var(--color-yellow)]/30"
                  : "bg-[var(--color-warm-gray)]/30 text-[var(--color-black)]/70 ring-1 ring-[var(--color-warm-gray)]"
              }`}
              title={`Shared publicly on /${goal.shareTo}/`}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>
                Shared on /{goal.shareTo}/
              </span>
            </span>
          )}
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
        className={`font-[family-name:var(--font-display)] tracking-tight inline-flex items-center gap-2 flex-wrap ${
          isFeatured ? "text-3xl lg:text-5xl" : "text-xl lg:text-2xl"
        }`}
      >
        <span>{goal.title}</span>
        {goal.subDescription && (
          <InfoPopup content={goal.subDescription} inverted={isFeatured} />
        )}
        {goal.pledgeAmount > 0 && (
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
              isFeatured
                ? "bg-[#D64545] text-[var(--color-off-white)]"
                : "bg-[#D64545]/15 text-[#D64545] ring-1 ring-[#D64545]/40"
            }`}
            title={`$${goal.pledgeAmount} pledge to ${goal.pledgeRecipient === "tiktok" ? "a random TikToker" : "charity"} if I miss this`}
          >
            ${goal.pledgeAmount} {goal.pledgeRecipient === "tiktok" ? "→ stranger" : "→ charity"}
          </span>
        )}
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
