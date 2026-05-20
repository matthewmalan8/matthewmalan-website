// Server-only loader for the goals task cache. Lives separately from
// `goals.ts` so the client bundle (GoalsCalendar.tsx) can import the
// pure helpers without pulling Node's fs into the browser.

import fs from "fs";
import path from "path";
import type { GoalTaskCache } from "./goals";

const cachePath = path.join(
  process.cwd(),
  "content",
  "goals",
  "cache",
  "tasks.json"
);

export function getGoalsCache(): GoalTaskCache {
  if (!fs.existsSync(cachePath)) {
    return { generatedAt: "", byDate: {} };
  }
  try {
    const raw = fs.readFileSync(cachePath, "utf8");
    const parsed = JSON.parse(raw) as GoalTaskCache;
    return {
      generatedAt: parsed.generatedAt ?? "",
      lists: parsed.lists ?? [],
      byDate: parsed.byDate ?? {},
    };
  } catch {
    return { generatedAt: "", byDate: {} };
  }
}
