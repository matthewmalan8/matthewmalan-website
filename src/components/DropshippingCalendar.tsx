import { useMemo, useState } from "react";
import {
  formatDate,
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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
  const selectedLog = selectedDate ? logByDate.get(selectedDate) : null;

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
    <div className="bg-[var(--color-off-white)] border-2 border-[var(--color-warm-gray)] rounded-2xl p-6 lg:p-8">
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

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((d) => {
          const iso = isoDate(d);
          const inMonth = d.getMonth() === view.month;
          const log = logByDate.get(iso);
          const isToday = iso === todayIso;
          const isSelected = iso === selectedDate;
          const hasVideo = !!log?.videoUrl;
          const minutes = logMinutes(log);

          const baseClasses =
            "aspect-square rounded-lg p-1.5 sm:p-2 flex flex-col items-start justify-between text-left transition-colors w-full";
          const stateClasses = !inMonth
            ? "opacity-30 cursor-default"
            : hasVideo
              ? "bg-[var(--color-yellow)] text-[var(--color-black)] hover:opacity-90 cursor-pointer"
              : minutes > 0
                ? "bg-[var(--color-warm-gray)]/30 text-[var(--color-black)] hover:bg-[var(--color-warm-gray)]/50 cursor-pointer"
                : "bg-transparent text-[var(--color-black)]/70 cursor-default";
          const ringClasses = isSelected
            ? "ring-2 ring-[var(--color-black)]"
            : isToday
              ? "ring-2 ring-[var(--color-black)]/40"
              : "";

          const isClickable = inMonth && !!log;

          const content = (
            <>
              <span className="text-xs sm:text-sm font-semibold">
                {d.getDate()}
              </span>
              <span className="text-[10px] sm:text-xs font-bold self-end">
                {minutes > 0 ? formatHoursMinutesShort(minutes) : ""}
              </span>
            </>
          );

          if (isClickable) {
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelectedDate(iso)}
                title={`${iso} — ${formatHoursMinutes(minutes)}${hasVideo ? " · click for details" : ""}`}
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
          Video posted
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-[var(--color-warm-gray)]/30" />
          Hours logged
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded ring-2 ring-[var(--color-black)]/40" />
          Today
        </span>
      </div>

      {/* Selected-day details */}
      {selectedLog && (
        <div className="mt-8 pt-6 border-t border-[var(--color-warm-gray)]">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
                Selected day
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-tight">
                {formatDate(selectedLog.date)}
              </p>
              <p className="mt-1 text-sm text-[var(--color-black)]/70">
                {formatHoursMinutes(logMinutes(selectedLog))} worked
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              aria-label="Close details"
              className="text-[var(--color-black)]/50 hover:text-[var(--color-black)] text-xl cursor-pointer leading-none"
            >
              ✕
            </button>
          </div>

          {selectedLog.videoUrl && (
            <a
              href={selectedLog.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center bg-[var(--color-black)] text-[var(--color-yellow)] px-5 py-2.5 text-sm font-semibold rounded-full hover:bg-[var(--color-yellow)] hover:text-[var(--color-black)] transition-colors"
            >
              Watch the video →
            </a>
          )}

          {selectedLog.notesHtml.trim() && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60 mb-2">
                Notes
              </p>
              <div
                className="text-[var(--color-black)]/85 leading-relaxed [&_p]:mt-2 [&_p:first-child]:mt-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mt-2 [&_li+li]:mt-1 [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: selectedLog.notesHtml }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
