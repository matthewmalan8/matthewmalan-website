import { useMemo, useState } from "react";
import Link from "next/link";
import {
  formatDuration,
  formatLongDate,
  formatSetSummary,
  isoDate,
  isWorkoutIncomplete,
  type GymWorkout,
} from "@/lib/gym-utils";

function formatDurationCompact(seconds: number): string {
  if (!seconds || seconds <= 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

type Props = { workouts: GymWorkout[] };

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function buildMonthCells(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(year, month, 1 - startWeekday + i));
  }
  return cells;
}

export default function GymCalendar({ workouts }: Props) {
  const today = new Date();
  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const workoutsByDate = useMemo(() => {
    const map = new Map<string, GymWorkout[]>();
    for (const w of workouts) {
      const list = map.get(w.date) ?? [];
      list.push(w);
      map.set(w.date, list);
    }
    return map;
  }, [workouts]);

  const cells = useMemo(
    () => buildMonthCells(view.year, view.month),
    [view]
  );

  const monthName = new Date(view.year, view.month, 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );
  const todayIso = isoDate(today);
  const selectedWorkouts = selectedDate
    ? (workoutsByDate.get(selectedDate) ?? [])
    : [];

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

  // ---- Detail view: replaces the calendar grid ----
  if (selectedDate && selectedWorkouts.length > 0) {
    const anyIncomplete = selectedWorkouts.some(isWorkoutIncomplete);
    return (
      <div className="bg-[var(--color-off-white)] border-2 border-[var(--color-warm-gray)] rounded-2xl p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <button
            type="button"
            onClick={() => setSelectedDate(null)}
            className="inline-flex items-center gap-2 text-sm font-semibold hover:text-[#4A4A4A] cursor-pointer"
          >
            ← Back to calendar
          </button>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-black)]/50">
            {formatLongDate(selectedDate)}
          </p>
        </div>

        <div className="space-y-10">
          {selectedWorkouts.map((w) => {
            const incomplete = isWorkoutIncomplete(w);
            return (
              <div key={w.id}>
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <h3 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
                    {w.title}
                  </h3>
                  {w.durationSeconds > 0 && (
                    <span className="text-sm text-[var(--color-black)]/60">
                      {formatDuration(w.durationSeconds)}
                    </span>
                  )}
                </div>
                {incomplete && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-[#D64545]/10 border border-[#D64545]/30 text-[#A92A2A] rounded-lg px-3 py-2 text-xs font-semibold">
                    <span aria-hidden>⚠</span>
                    <span>
                      Clarification needed —{" "}
                      <Link href="/gym-admin/" className="underline">
                        add the data in /gym-admin/
                      </Link>
                    </span>
                  </div>
                )}
                {w.description && (
                  <p className="mt-3 text-sm text-[var(--color-black)]/70">
                    {w.description}
                  </p>
                )}
                <ul className="mt-5 space-y-5">
                  {w.exercises.map((ex, i) => (
                    <li key={i}>
                      <p className="text-base font-semibold tracking-tight">
                        {ex.title}
                      </p>
                      {ex.notes && (
                        <p className="mt-1 text-xs text-[var(--color-black)]/55">
                          {ex.notes}
                        </p>
                      )}
                      {ex.sets.length > 0 ? (
                        <ul className="mt-2 text-sm text-[var(--color-black)]/80 space-y-1">
                          {ex.sets.map((set, j) => {
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
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-[var(--color-black)]/50 italic">
                          No sets logged
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {anyIncomplete && selectedWorkouts.length > 1 && (
          <p className="mt-8 text-xs text-[var(--color-black)]/55 italic">
            One or more workouts on this day have missing data. Open{" "}
            <Link href="/gym-admin/" className="underline">
              /gym-admin/
            </Link>{" "}
            to fill them in.
          </p>
        )}
      </div>
    );
  }

  // ---- Grid view ----
  return (
    <div className="bg-[var(--color-off-white)] border-2 border-[var(--color-warm-gray)] rounded-2xl p-2 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6 px-1">
        <button
          type="button"
          onClick={prevMonth}
          aria-label="Previous month"
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-[var(--color-warm-gray)] text-[var(--color-black)] hover:border-[var(--color-black)] cursor-pointer"
        >
          ←
        </button>
        <h3 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl tracking-tight">
          {monthName}
        </h3>
        <button
          type="button"
          onClick={nextMonth}
          aria-label="Next month"
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-[var(--color-warm-gray)] text-[var(--color-black)] hover:border-[var(--color-black)] cursor-pointer"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--color-black)]/50 mb-1.5 sm:mb-2">
        {DAY_LABELS.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 sm:gap-2 auto-rows-fr">
        {cells.map((d) => {
          const iso = isoDate(d);
          const inMonth = d.getMonth() === view.month;
          const dayWorkouts = workoutsByDate.get(iso) ?? [];
          const hasWorkout = dayWorkouts.length > 0;
          const allIncomplete =
            hasWorkout && dayWorkouts.every(isWorkoutIncomplete);
          const isToday = iso === todayIso;

          const baseClasses =
            "min-h-20 sm:min-h-28 rounded-md sm:rounded-lg p-1 sm:p-2 flex flex-col text-left transition-colors w-full overflow-hidden";
          const stateClasses = !inMonth
            ? "opacity-30 cursor-default"
            : allIncomplete
              ? "bg-[#D64545] text-[var(--color-off-white)] hover:opacity-90 cursor-pointer"
              : hasWorkout
                ? "bg-[var(--color-yellow)] text-[var(--color-black)] hover:opacity-90 cursor-pointer"
                : "bg-transparent text-[var(--color-black)]/70 cursor-default";
          const ringClasses = isToday
            ? "ring-2 ring-[var(--color-black)]/40 ring-inset"
            : "";

          const totalSeconds = dayWorkouts.reduce(
            (sum, w) => sum + (w.durationSeconds || 0),
            0
          );
          const timeText = formatDurationCompact(totalSeconds);
          const titles = dayWorkouts
            .map((w) => w.title?.trim())
            .filter((t): t is string => !!t);

          const content = (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-0 sm:gap-1 leading-none">
                <span className="text-[10px] sm:text-sm font-semibold">
                  {d.getDate()}
                </span>
                {hasWorkout && (timeText || allIncomplete) && (
                  <span
                    className={`text-[8px] sm:text-[10px] font-bold whitespace-nowrap mt-0.5 sm:mt-0 ${
                      allIncomplete ? "text-white/85" : "text-[#6B7280]"
                    }`}
                    title={allIncomplete ? "Clarification needed" : undefined}
                  >
                    {timeText || "⚠"}
                  </span>
                )}
              </div>
              {hasWorkout && titles.length > 0 && (
                <ul
                  className={`mt-1 sm:mt-1.5 space-y-0.5 text-[8px] sm:text-[11px] font-semibold leading-tight ${
                    allIncomplete ? "text-white/95" : ""
                  }`}
                >
                  {titles.slice(0, 2).map((t, i) => (
                    <li key={i} className="truncate">
                      {t}
                    </li>
                  ))}
                  {titles.length > 2 && (
                    <li className="text-[7px] sm:text-[9px] opacity-70 truncate">
                      +{titles.length - 2} more
                    </li>
                  )}
                </ul>
              )}
            </>
          );

          if (inMonth && hasWorkout) {
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelectedDate(iso)}
                title={`${iso} — ${dayWorkouts.length} workout${dayWorkouts.length > 1 ? "s" : ""}${allIncomplete ? " · clarification needed" : ""}`}
                className={`${baseClasses} ${stateClasses} ${ringClasses}`}
              >
                {content}
              </button>
            );
          }

          return (
            <div
              key={iso}
              title={inMonth ? iso : ""}
              className={`${baseClasses} ${stateClasses} ${ringClasses}`}
            >
              {content}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-xs text-[var(--color-black)]/60">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-[var(--color-yellow)]" />
          Workout logged
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-[#D64545]" />
          Clarification needed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded ring-2 ring-[var(--color-black)]/40 ring-inset" />
          Today
        </span>
      </div>
    </div>
  );
}
