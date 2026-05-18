import { useMemo, useState, type ReactNode } from "react";
import {
  formatHoursMinutes,
  formatHoursMinutesShort,
  logMinutes,
  type DailyLog,
  type GoogleTaskCache,
} from "@/lib/dropshipping-utils";

type Props = {
  logs: DailyLog[];
  taskCache?: GoogleTaskCache;
};

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

function formatLongDate(iso: string): string {
  // Avoid timezone shift by treating the date as local at noon.
  const [y, m, d] = iso.split("-").map((p) => parseInt(p, 10));
  return new Date(y, m - 1, d, 12).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function DropshippingCalendar({ logs, taskCache }: Props) {
  const today = new Date();
  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [selectedIso, setSelectedIso] = useState<string | null>(null);

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
  const hasTaskData = !!taskCache?.generatedAt;

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

  // ---- Detail panel (rendered above the calendar when a day is selected) ----
  let detailPanel: ReactNode = null;
  if (selectedIso) {
    const log = logByDate.get(selectedIso);
    const tasks = taskCache?.byDate?.[selectedIso] ?? [];
    const minutes = logMinutes(log);
    const done = tasks.filter((t) => t.status === "completed").length;

    detailPanel = (
      <div className="bg-[var(--color-off-white)] border-2 border-[var(--color-black)] rounded-2xl p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
            {formatLongDate(selectedIso)}
          </p>
          <button
            type="button"
            onClick={() => setSelectedIso(null)}
            aria-label="Close day view"
            className="text-[var(--color-black)]/60 hover:text-[var(--color-black)] text-2xl leading-none cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-2 text-xs font-semibold mb-6">
          {log && minutes > 0 && (
            <span className="px-3 py-1.5 bg-[var(--color-warm-gray)]/40 text-[var(--color-black)] rounded-full">
              {formatHoursMinutes(minutes)} logged
            </span>
          )}
          {log?.videoUrl && (
            <a
              href={log.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-[var(--color-yellow)] text-[var(--color-black)] rounded-full hover:opacity-90"
            >
              Watch video →
            </a>
          )}
          {hasTaskData && tasks.length > 0 && (
            <span className="px-3 py-1.5 bg-[var(--color-black)] text-[var(--color-off-white)] rounded-full">
              {done}/{tasks.length} tasks done
            </span>
          )}
          {!log && tasks.length === 0 && (
            <span className="px-3 py-1.5 bg-[var(--color-warm-gray)]/40 text-[var(--color-black)]/60 rounded-full italic">
              Nothing logged this day
            </span>
          )}
        </div>

        {/* Tasks */}
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60 mb-3">
              Tasks
            </p>
            {!hasTaskData ? (
              <p className="text-sm text-[var(--color-black)]/60 italic">
                Google Tasks not connected yet. Once the OAuth refresh token is
                set in GitHub Secrets, daily task lists will appear here
                automatically.
              </p>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-[var(--color-black)]/60 italic">
                No tasks recorded for this day.
              </p>
            ) : (
              <ul className="space-y-3">
                {tasks.map((t) => {
                  const dueDay = t.due ? t.due.slice(0, 10) : null;
                  const isOverdue =
                    t.status === "needsAction" &&
                    !!dueDay &&
                    dueDay < todayIso;
                  return (
                    <li
                      key={`${t.listId}-${t.id}`}
                      className="flex items-start gap-3 text-sm"
                    >
                      <span
                        className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center ${
                          t.status === "completed"
                            ? "bg-[var(--color-lime)] border-[var(--color-lime)] text-[var(--color-black)]"
                            : isOverdue
                              ? "border-[#D64545] bg-transparent"
                              : "border-[var(--color-warm-gray)] bg-transparent"
                        }`}
                        aria-hidden="true"
                      >
                        {t.status === "completed" ? "✓" : ""}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`flex flex-wrap items-center gap-2 ${
                            t.status === "completed"
                              ? "line-through text-[var(--color-black)]/50"
                              : "text-[var(--color-black)]"
                          }`}
                        >
                          <span>{t.title}</span>
                          {isOverdue && (
                            <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#D64545] text-[var(--color-off-white)]">
                              Missed
                            </span>
                          )}
                        </p>
                        {t.notes && (
                          <p className="mt-0.5 text-xs text-[var(--color-black)]/60 whitespace-pre-line">
                            {t.notes}
                          </p>
                        )}
                        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[var(--color-black)]/40">
                          {t.listTitle}
                          {dueDay && (
                            <>
                              {" · "}
                              <span
                                className={
                                  isOverdue
                                    ? "text-[#D64545] font-semibold"
                                    : ""
                                }
                              >
                                Due {dueDay}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Notes */}
          {log?.notesHtml && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60 mb-3">
                Daily log
              </p>
              <div
                className="prose prose-sm max-w-none text-[var(--color-black)]/80"
                dangerouslySetInnerHTML={{ __html: log.notesHtml }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {detailPanel}
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
          const isSelected = iso === selectedIso;
          const hasVideo = !!log?.videoUrl;
          const minutes = logMinutes(log);
          const isVideoZero = hasVideo && minutes === 0;
          const dayTasks = taskCache?.byDate?.[iso] ?? [];
          const hasTasks = dayTasks.length > 0;

          const baseClasses =
            "min-h-20 sm:min-h-28 rounded-lg p-1.5 sm:p-2 flex flex-col text-left transition-colors w-full overflow-hidden relative";
          const stateClasses = !inMonth
            ? "opacity-30 cursor-default"
            : isVideoZero
              ? "bg-[#D64545] text-[var(--color-off-white)] hover:opacity-90 cursor-pointer"
              : hasVideo
                ? "bg-[var(--color-yellow)] text-[var(--color-black)] hover:opacity-90 cursor-pointer"
                : minutes > 0 || log
                  ? "bg-[var(--color-warm-gray)]/30 text-[var(--color-black)] hover:bg-[var(--color-warm-gray)]/50 cursor-pointer"
                  : "bg-transparent text-[var(--color-black)]/70 hover:bg-[var(--color-warm-gray)]/20 cursor-pointer";
          const ringClasses = isSelected
            ? "ring-2 ring-[var(--color-lime)] ring-inset"
            : isToday
              ? "ring-2 ring-[var(--color-black)] ring-inset"
              : "";

          const showTime = minutes > 0 || isVideoZero;
          const timeText = isVideoZero
            ? "0m"
            : formatHoursMinutesShort(minutes);
          const timeColor = isVideoZero ? "text-white/80" : "text-[#6B7280]";

          const header = (
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-0.5 sm:gap-1">
              <span className="text-xs sm:text-sm font-semibold">
                {d.getDate()}
              </span>
              {showTime && (
                <span
                  className={`text-[10px] sm:text-xs font-bold ${timeColor}`}
                >
                  {timeText}
                </span>
              )}
            </div>
          );

          const noteText = inMonth && log?.notesText ? log.notesText : "";

          const body = noteText && (
            <p className="hidden sm:block mt-1 text-xs leading-snug line-clamp-4">
              {noteText}
            </p>
          );

          const taskDot = hasTasks && inMonth && (
            <span
              aria-hidden="true"
              className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--color-lime)] ring-1 ring-[var(--color-black)]/30"
              title={`${dayTasks.length} task${dayTasks.length === 1 ? "" : "s"}`}
            />
          );

          if (!inMonth) {
            return (
              <div
                key={iso}
                className={`${baseClasses} ${stateClasses}`}
                aria-hidden="true"
              >
                {header}
              </div>
            );
          }

          return (
            <button
              type="button"
              key={iso}
              onClick={() =>
                setSelectedIso((cur) => (cur === iso ? null : iso))
              }
              title={`${iso}${minutes > 0 ? ` — ${formatHoursMinutes(minutes)}` : ""}${hasVideo ? " · video posted" : ""}${hasTasks ? ` · ${dayTasks.length} task${dayTasks.length === 1 ? "" : "s"}` : ""}`}
              className={`${baseClasses} ${stateClasses} ${ringClasses}`}
            >
              {header}
              {body}
              {taskDot}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-xs text-[var(--color-black)]/60">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-[var(--color-yellow)]" />
          Video posted
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-[#D64545]" />
          Video posted, 0m logged
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-[var(--color-warm-gray)]/30" />
          Hours logged
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-lime)] ring-1 ring-[var(--color-black)]/30" />
          Has tasks
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded ring-2 ring-[var(--color-black)] ring-inset" />
          Today
        </span>
        <span className="text-[var(--color-black)]/60 italic">
          Click any day to see tasks + notes.
        </span>
      </div>
      </div>
    </div>
  );
}
