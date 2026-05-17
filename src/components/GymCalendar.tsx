import { useMemo, useState } from "react";
import {
  formatDuration,
  formatLongDate,
  formatWeight,
  isoDate,
  type GymWorkout,
} from "@/lib/gym-utils";

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

  // Group workouts by date.
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

  return (
    <div className="bg-[var(--color-off-white)] border-2 border-[var(--color-warm-gray)] rounded-2xl p-4 sm:p-6 lg:p-8">
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
          const dayWorkouts = workoutsByDate.get(iso) ?? [];
          const hasWorkout = dayWorkouts.length > 0;
          const isToday = iso === todayIso;
          const isSelected = iso === selectedDate;

          const baseClasses =
            "aspect-square rounded-lg p-1.5 sm:p-2 flex flex-col items-start justify-between text-left transition-colors w-full";
          const stateClasses = !inMonth
            ? "opacity-30 cursor-default"
            : hasWorkout
              ? "bg-[var(--color-yellow)] text-[var(--color-black)] hover:opacity-90 cursor-pointer"
              : "bg-transparent text-[var(--color-black)]/70 cursor-default";
          const ringClasses = isSelected
            ? "ring-2 ring-[var(--color-black)]"
            : isToday
              ? "ring-2 ring-[var(--color-black)]/40 ring-inset"
              : "";

          const content = (
            <>
              <span className="text-xs sm:text-sm font-semibold">
                {d.getDate()}
              </span>
              {hasWorkout && (
                <span className="text-[10px] sm:text-xs font-bold self-end text-[#6B7280]">
                  {dayWorkouts.length > 1 ? `${dayWorkouts.length}×` : "✓"}
                </span>
              )}
            </>
          );

          if (inMonth && hasWorkout) {
            return (
              <button
                key={iso}
                type="button"
                onClick={() =>
                  setSelectedDate((curr) => (curr === iso ? null : iso))
                }
                title={`${iso} — ${dayWorkouts.length} workout${dayWorkouts.length > 1 ? "s" : ""}`}
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
          <span className="inline-block w-3 h-3 rounded ring-2 ring-[var(--color-black)]/40 ring-inset" />
          Today
        </span>
      </div>

      {/* Selected-day workouts */}
      {selectedWorkouts.length > 0 && (
        <div className="mt-8 pt-6 border-t border-[var(--color-warm-gray)]">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
                Workout
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-tight">
                {formatLongDate(selectedDate!)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              aria-label="Close workout"
              className="text-[var(--color-black)]/50 hover:text-[var(--color-black)] text-xl cursor-pointer leading-none"
            >
              ✕
            </button>
          </div>

          <div className="space-y-8">
            {selectedWorkouts.map((w) => (
              <div key={w.id}>
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <h4 className="text-xl font-semibold">{w.title}</h4>
                  <span className="text-sm text-[var(--color-black)]/60">
                    {formatDuration(w.durationSeconds)}
                  </span>
                </div>
                {w.description && (
                  <p className="mt-2 text-sm text-[var(--color-black)]/70">
                    {w.description}
                  </p>
                )}
                <ul className="mt-4 space-y-4">
                  {w.exercises.map((ex, i) => (
                    <li key={i}>
                      <p className="text-sm font-semibold tracking-tight">
                        {ex.title}
                      </p>
                      {ex.sets.length > 0 ? (
                        <ul className="mt-1.5 text-xs text-[var(--color-black)]/75 space-y-1">
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
                                <span className="w-5 text-right">{j + 1}.</span>
                                <span className="flex-1">
                                  {formatWeight(set.weightKg)}
                                  {set.reps != null && (
                                    <span> × {set.reps} reps</span>
                                  )}
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
                        <p className="mt-1 text-xs text-[var(--color-black)]/50 italic">
                          No sets logged
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
