export type DailyLog = {
  slug: string;
  date: string;
  hoursWorked: number;
  videoUrl: string;
  notes: string;
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

export type DropshippingGoal = {
  goalAmount: number;
  goalDeadline: string;
  currentSales: number;
  lastUpdated: string;
};

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

// Returns the most recent consecutive run of days (ending today or yesterday)
// where each day has a non-empty videoUrl.
export function getCurrentVideoStreak(logs: DailyLog[]): number {
  const byDate = new Map<string, DailyLog>();
  for (const l of logs) if (l.videoUrl) byDate.set(l.date, l);

  // Start from today and walk backwards. Allow one missed day if today's
  // log hasn't been posted yet (so the streak doesn't reset every morning).
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let cursor = new Date(today);

  // If today has no entry, allow a single-day grace (start from yesterday).
  const todayIso = cursor.toISOString().slice(0, 10);
  if (!byDate.has(todayIso)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const iso = cursor.toISOString().slice(0, 10);
    if (byDate.has(iso)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// Returns longest consecutive run where hoursWorked >= threshold.
export function getLongestHourStreak(
  logs: DailyLog[],
  threshold: number
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
    const meets = log.hoursWorked >= threshold;
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

export function getTotalVideos(logs: DailyLog[]): number {
  return logs.filter((l) => l.videoUrl).length;
}

export function getTotalHours(logs: DailyLog[]): number {
  return logs.reduce((sum, l) => sum + (l.hoursWorked || 0), 0);
}
