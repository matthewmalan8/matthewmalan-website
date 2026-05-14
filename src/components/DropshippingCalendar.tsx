import { useMemo, useState } from "react";
import {
  formatHoursMinutes,
  formatHoursMinutesShort,
  logMinutes,
  type DailyLog,
} from "@/lib/dropshipping-utils";

type Props = { logs: DailyLog[] };

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

function buildMonthCells(year: number, month: number): Date[] {
  const first = startOfMonth(year, month);
  const startWeekday = first.getDay();
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - startWeekday + i);
    cells.push(d);
  }
  return cells;
}

export default function DropshippingCalendar({ logs }: Props) {
  const today = new Date();
  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const logByDate = useMemo(() => {
    const map = new Map<string, DailyLog>();
    for (const l of logs) if (l.date) map.set(l.date, l);
    return map;
  }, [logs]);

  const cells = useMemo(
    () => buildMonthCells(view.year, view.month),
    [view]
  );

  const monthName = new Date(view.year, view.month, 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  const todayIso = isoDate(today);

  const prevMonth = () => {
    setView((v) => {
      const m = v.month - 1;
      return m < 0
        ? { year: v.year - 1, month: 11 }
        : { year: v.year, month: m };
    });
  };

  const nextMonth = () => {
    setView((v) => {
      const m = v.month + 1;
      return m > 11
        ? { year: v.year + 1, month: 0 }
        : { year: v.year, month: m };
    });
  };

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
          const log = logByDate.get(iso);
          const isToday = iso === todayIso;
          const hasVideo = !!log?.videoUrl;
          const minutes = logMinutes(log);

          const baseClasses =
            "min-h-20 sm:min-h-28 rounded-lg p-1.5 sm:p-2 flex flex-col text-left transition-colors w-full overflow-hidden";
          const stateClasses = !inMonth
            ? "opacity-30 cursor-default"
            : hasVideo
              ? "bg-[var(--color-yellow)] text-[var(--color-black)] hover:opacity-90 cursor-pointer"
              : minutes > 0 || log
                ? "bg-[var(--color-warm-gray)]/30 text-[var(--color-black)]"
                : "bg-transparent text-[var(--color-black)]/70 cursor-default";
          const ringClasses = isToday
            ? "ring-2 ring-[var(--color-black)] ring-inset"
            : "";

          const header = (
            <div className="flex items-start justify-between gap-1">
              <span className="text-xs sm:text-sm font-semibold">
                {d.getDate()}
              </span>
              {minutes > 0 && (
                <span className="text-[10px] sm:text-xs font-bold">
                  {formatHoursMinutesShort(minutes)}
                </span>
              )}
            </div>
          );

          const noteText =
            inMonth && log?.notesText ? log.notesText : "";

          const body = noteText && (
            <p className="mt-1 text-[10px] sm:text-xs leading-snug line-clamp-3 sm:line-clamp-4">
              {noteText}
            </p>
          );

          if (hasVideo && inMonth) {
            return (
              <a
                key={iso}
                href={log!.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`${iso} — ${formatHoursMinutes(minutes)} · click to watch the video`}
                className={`${baseClasses} ${stateClasses} ${ringClasses}`}
              >
                {header}
                {body}
              </a>
            );
          }

          return (
            <div
              key={iso}
              title={
                inMonth
                  ? `${iso}${minutes > 0 ? ` — ${formatHoursMinutes(minutes)}` : ""}`
                  : ""
              }
              className={`${baseClasses} ${stateClasses} ${ringClasses}`}
            >
              {header}
              {body}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-xs text-[var(--color-black)]/60">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-[var(--color-yellow)]" />
          Video posted — click to watch
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-[var(--color-warm-gray)]/30" />
          Hours logged
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded ring-2 ring-[var(--color-black)] ring-inset" />
          Today
        </span>
      </div>
    </div>
  );
}
