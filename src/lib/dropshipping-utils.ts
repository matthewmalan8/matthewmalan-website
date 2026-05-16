export type DailyLog = {
  slug: string;
  date: string;
  hoursWorked: number;
  minutesWorked: number;
  videoUrl: string;
  notesHtml: string;
  notesText: string;
};

export type Pledge = {
  slug: string;
  title: string;
  description: string;
  amount: number;
  recipient: string;
  deadline: string;
  status: "active" | "completed" | "failed";
  videoUrl: string;
};

export type Screenshot = {
  slug: string;
  image: string;
  imageAlt: string;
  date: string;
  caption: string;
};

export type Failure = {
  slug: string;
  product: string;
  productImage: string;
  blur: boolean;
  adSpend: number;
  hypothesis: string;
  reasonFailed: string;
  lessons: string;
  lessonsHtml: string;
  videoUrl: string;
  failedOn: string;
};

export type GoalStatus = "active" | "successful" | "failed";

export type DropshippingGoal = {
  slug: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  status: GoalStatus;
  pinned: boolean;
  lastUpdated: string;
};

export type GoalFilter =
  | "recent"
  | "oldest"
  | "active"
  | "successful"
  | "failed";

export const GOAL_FILTERS: Array<{ value: GoalFilter; label: string }> = [
  { value: "recent", label: "Most recent" },
  { value: "oldest", label: "Oldest" },
  { value: "active", label: "Active only" },
  { value: "successful", label: "Successful only" },
  { value: "failed", label: "Failed only" },
];

export function filterAndSortGoals(
  goals: DropshippingGoal[],
  filter: GoalFilter
): DropshippingGoal[] {
  const byDeadlineDesc = (a: DropshippingGoal, b: DropshippingGoal) =>
    new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
  const byDeadlineAsc = (a: DropshippingGoal, b: DropshippingGoal) =>
    new Date(a.deadline).getTime() - new Date(b.deadline).getTime();

  switch (filter) {
    case "recent":
      return [...goals].sort(byDeadlineDesc);
    case "oldest":
      return [...goals].sort(byDeadlineAsc);
    case "active":
      return goals.filter((g) => g.status === "active").sort(byDeadlineDesc);
    case "successful":
      return goals
        .filter((g) => g.status === "successful")
        .sort(byDeadlineDesc);
    case "failed":
      return goals.filter((g) => g.status === "failed").sort(byDeadlineDesc);
  }
}

export function formatGoalValue(value: number, unit: string): string {
  const trimmed = unit.trim();
  if (!trimmed) return value.toLocaleString();
  if (trimmed === "$") return formatMoney(value);
  return `${value.toLocaleString()} ${trimmed}`;
}

export function goalProgressPct(goal: DropshippingGoal): number {
  if (!goal.target || goal.target <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((goal.current / goal.target) * 100)));
}

export type Streak = {
  length: number;
  lastAchieved: string;
};

export function formatDate(date: string): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(date: string): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function daysUntil(date: string): number {
  if (!date) return 0;
  const target = new Date(date).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
}

export function logMinutes(log: DailyLog | undefined): number {
  if (!log) return 0;
  return (log.hoursWorked || 0) * 60 + (log.minutesWorked || 0);
}

export function formatHoursMinutes(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return "0m";
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatHoursMinutesShort(totalMinutes: number): string {
  if (totalMinutes <= 0) return "";
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function indexByDate(logs: DailyLog[]): Map<string, DailyLog> {
  const map = new Map<string, DailyLog>();
  for (const l of logs) if (l.date) map.set(l.date, l);
  return map;
}

export function getCurrentStreak(
  logs: DailyLog[],
  predicate: (log: DailyLog | undefined) => boolean
): number {
  const byDate = indexByDate(logs);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let cursor = new Date(today);
  // Grace day: if today doesn't meet the predicate, start counting from yesterday.
  if (!predicate(byDate.get(isoDate(cursor)))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (true) {
    const log = byDate.get(isoDate(cursor));
    if (predicate(log)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function getLongestStreak(
  logs: DailyLog[],
  predicate: (log: DailyLog) => boolean
): Streak {
  const sorted = [...logs]
    .filter((l) => l.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let longest = 0;
  let longestEnd = "";
  let current = 0;
  let currentEnd = "";
  let prevDate: Date | null = null;

  for (const log of sorted) {
    const d = new Date(log.date);
    const meets = predicate(log);
    const isContiguous =
      prevDate !== null &&
      Math.round((d.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)) ===
        1;

    if (meets) {
      current = isContiguous ? current + 1 : 1;
      currentEnd = log.date;
      if (current > longest) {
        longest = current;
        longestEnd = currentEnd;
      }
    } else {
      current = 0;
      currentEnd = "";
    }
    prevDate = d;
  }

  return { length: longest, lastAchieved: longestEnd };
}

export const hasVideoPredicate = (log: DailyLog | undefined): boolean =>
  !!log?.videoUrl;

export const hoursAtLeast = (h: number) => (log: DailyLog | undefined) =>
  !!log && logMinutes(log) >= h * 60;

export function getTotalVideos(logs: DailyLog[]): number {
  return logs.filter((l) => l.videoUrl).length;
}

export function getTotalMinutes(logs: DailyLog[]): number {
  return logs.reduce((sum, l) => sum + logMinutes(l), 0);
}
