import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  isPartialOrFailedDay,
  isSuccessfulDay,
  type GoalTaskCache,
  type GoogleTask,
} from "@/lib/goals";

type Props = { cache: GoalTaskCache };

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildMonthCells(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(year, month, 1 - startWeekday + i));
  }
  return cells;
}

function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map((p) => parseInt(p, 10));
  return new Date(y, m - 1, d, 12).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function GoalsCalendar({ cache }: Props) {
  const today = new Date();
  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [selectedIso, setSelectedIso] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedIso) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedIso(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedIso]);

  const cells = useMemo(
    () => buildMonthCells(view.year, view.month),
    [view]
  );
  const monthName = new Date(view.year, view.month, 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );
  const todayIso = isoDate(today);

  const prevMonth = () =>
    setView((v) => {
      const m = v.month - 1;
      return m < 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: m };
    });
  const nextMonth = () =>
    setView((v) => {
      const m = v.month + 1;
      return m > 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: m };
    });

  // Detail popup
  let detailPanel: ReactNode = null;
  if (selectedIso) {
    const tasks: GoogleTask[] = cache.byDate?.[selectedIso] ?? [];
    const done = tasks.filter((t) => t.status === "completed").length;
    const success = isSuccessfulDay(tasks);
    const partial = isPartialOrFailedDay(tasks);

    detailPanel = (
      <div
        className="absolute inset-0 z-10 flex items-center justify-center p-3 sm:p-6 bg-[var(--color-black)]/40 rounded-2xl"
        onClick={() => setSelectedIso(null)}
        role="dialog"
        aria-modal="true"
        aria-label={`Tasks for ${formatLongDate(selectedIso)}`}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-[var(--color-off-white)] rounded-xl shadow-2xl w-full max-w-md max-h-full overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3 border-b border-[var(--color-warm-gray)]/50">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
                {formatLongDate(selectedIso)}
              </p>
              <p
                className={`mt-1 text-xs font-bold uppercase tracking-wider ${
                  success
                    ? "text-[#16A34A]"
                    : partial
                      ? "text-[#D64545]"
                      : "text-[var(--color-black)]/50"
                }`}
              >
                {success
                  ? `✓ Success — ${done}/${tasks.length} done`
                  : partial
                    ? `✗ Missed — ${done}/${tasks.length} done`
                    : "No tasks tracked"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedIso(null)}
              aria-label="Close day view"
              className="text-[var(--color-black)]/50 hover:text-[var(--color-black)] text-2xl leading-none cursor-pointer -mr-1"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {tasks.length === 0 ? (
              <p className="text-sm text-[var(--color-black)]/60 italic">
                No tasks recorded for this day.
              </p>
            ) : (
              <ul className="space-y-3">
                {tasks.map((t) => (
                  <li
                    key={`${t.listId}-${t.id}`}
                    className="flex items-start gap-3 text-sm"
                  >
                    <span
                      className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center ${
                        t.status === "completed"
                          ? "bg-[var(--color-lime)] border-[var(--color-lime)] text-[var(--color-black)]"
                          : "border-[#D64545] bg-transparent"
                      }`}
                      aria-hidden="true"
                    >
                      {t.status === "completed" ? "✓" : ""}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={
                          t.status === "completed"
                            ? "line-through text-[var(--color-black)]/50"
                            : "text-[var(--color-black)]"
                        }
                      >
                        {t.title}
                      </p>
                      {t.notes && (
                        <p className="mt-0.5 text-xs text-[var(--color-black)]/60 whitespace-pre-line">
                          {t.notes}
                        </p>
                      )}
                      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[var(--color-black)]/40">
                        {t.listTitle}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-[var(--color-off-white)] border-2 border-[var(--color-warm-gray)] rounded-2xl p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={prevMonth}
          aria-label="Previous month"
          className="w-10 h-10 flex items-center justify-center rounded-full border border-[var(--color-warm-gray)] text-[var(--color-black)] hover:border-[var(--color-black)] cursor-pointer"
        >
          ←
        </button>
        <h3 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
          {monthName}
        </h3>
        <button
          type="button"
          onClick={nextMonth}
          aria-label="Next month"
          className="w-10 h-10 flex items-center justify-center rounded-full border border-[var(--color-warm-gray)] text-[var(--color-black)] hover:border-[var(--color-black)] cursor-pointer"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wider text-[var(--color-black)]/50 mb-2">
        {DAY_LABELS.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2 auto-rows-fr">
        {cells.map((d) => {
          const iso = isoDate(d);
          const inMonth = d.getMonth() === view.month;
          const tasks = cache.byDate?.[iso] ?? [];
          const done = tasks.filter((t) => t.status === "completed").length;
          const total = tasks.length;
          const success = isSuccessfulDay(tasks);
          const failed = isPartialOrFailedDay(tasks);
          const isToday = iso === todayIso;

          const baseClasses =
            "min-h-16 sm:min-h-24 rounded-lg p-1.5 sm:p-2 flex flex-col text-left transition-colors w-full overflow-hidden relative";
          const stateClasses = !inMonth
            ? "opacity-30 cursor-default bg-transparent"
            : success
              ? "bg-[#16A34A] text-[var(--color-off-white)] hover:opacity-90 cursor-pointer"
              : failed
                ? "bg-[#D64545] text-[var(--color-off-white)] hover:opacity-90 cursor-pointer"
                : total > 0
                  ? "bg-[var(--color-warm-gray)]/40 text-[var(--color-black)] hover:bg-[var(--color-warm-gray)]/60 cursor-pointer"
                  : "bg-transparent text-[var(--color-black)]/60 cursor-default";
          const ringClasses = isToday
            ? "ring-2 ring-[var(--color-black)] ring-inset"
            : "";

          const dayNum = (
            <span className="text-xs sm:text-sm font-semibold">
              {d.getDate()}
            </span>
          );

          const counter = total > 0 && inMonth && (
            <span
              className={`absolute bottom-1 right-1 text-[9px] sm:text-[10px] font-bold tabular-nums leading-none px-1 py-0.5 rounded ${
                success || failed
                  ? "bg-[var(--color-off-white)]/20 text-[var(--color-off-white)]"
                  : "bg-[var(--color-off-white)] text-[var(--color-black)] border border-[var(--color-warm-gray)]"
              }`}
              title={`${done}/${total} tasks done`}
            >
              {done}/{total}
            </span>
          );

          if (!inMonth || total === 0) {
            return (
              <div
                key={iso}
                className={`${baseClasses} ${stateClasses} ${ringClasses}`}
                aria-hidden={!inMonth}
              >
                {dayNum}
              </div>
            );
          }

          return (
            <button
              type="button"
              key={iso}
              onClick={() => setSelectedIso(iso)}
              title={`${iso} — ${done}/${total} tasks done`}
              className={`${baseClasses} ${stateClasses} ${ringClasses}`}
            >
              {dayNum}
              {counter}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-xs text-[var(--color-black)]/60">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-[#16A34A]" />
          All tasks done (success)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-[#D64545]" />
          Tasks missed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-[var(--color-warm-gray)]/40" />
          Tracked but no tasks
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded ring-2 ring-[var(--color-black)] ring-inset" />
          Today
        </span>
      </div>

      {detailPanel}
    </div>
  );
}
