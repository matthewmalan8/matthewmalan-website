import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import type {
  DailyLog,
  DropshippingGoal,
  Failure,
  Pledge,
  Screenshot,
} from "./dropshipping-utils";

export type {
  DailyLog,
  DropshippingGoal,
  Failure,
  Pledge,
  Screenshot,
};

const baseDir = path.join(process.cwd(), "content", "dropshipping");

function asString(value: unknown): string {
  return value == null ? "" : String(value);
}

function asNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function asBool(value: unknown): boolean {
  return value === true || value === "true";
}

function normalizeDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "");
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^(https?:)?\/\//i.test(trimmed)) return trimmed;
  if (/^(mailto:|tel:|sms:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function readMarkdownDir<T>(
  dir: string,
  parse: (slug: string, fm: Record<string, unknown>, body: string) => T
): T[] {
  if (!fs.existsSync(dir)) return [];
  const items: T[] = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".md") && !f.endsWith(".markdown")) continue;
    const slug = f.replace(/\.(md|markdown)$/i, "");
    const raw = fs.readFileSync(path.join(dir, f), "utf8");
    const { data, content } = matter(raw);
    items.push(parse(slug, data as Record<string, unknown>, content));
  }
  return items;
}

export async function getDailyLogs(): Promise<DailyLog[]> {
  const raw = readMarkdownDir(path.join(baseDir, "daily"), (slug, fm, body) => ({
    slug,
    date: normalizeDate(fm.date),
    hoursWorked: asNumber(fm.hoursWorked),
    minutesWorked: asNumber(fm.minutesWorked),
    videoUrl: normalizeUrl(asString(fm.videoUrl)),
    notes: body,
  }));
  const rendered: DailyLog[] = await Promise.all(
    raw.map(async (r) => {
      const processed = await remark().use(html).process(r.notes || "");
      return {
        slug: r.slug,
        date: r.date,
        hoursWorked: r.hoursWorked,
        minutesWorked: r.minutesWorked,
        videoUrl: r.videoUrl,
        notesHtml: processed.toString(),
      };
    })
  );
  return rendered.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export function getPledges(): Pledge[] {
  return readMarkdownDir<Pledge>(path.join(baseDir, "pledges"), (slug, fm) => {
    const raw = asString(fm.status);
    const status: Pledge["status"] =
      raw === "completed" || raw === "failed" ? raw : "active";
    return {
      slug,
      title: asString(fm.title),
      description: asString(fm.description),
      amount: asNumber(fm.amount),
      recipient: asString(fm.recipient),
      deadline: normalizeDate(fm.deadline),
      status,
      videoUrl: normalizeUrl(asString(fm.videoUrl)),
    };
  }).sort(
    (a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime()
  );
}

export function getScreenshots(): Screenshot[] {
  return readMarkdownDir(
    path.join(baseDir, "screenshots"),
    (slug, fm) => ({
      slug,
      image: asString(fm.image),
      imageAlt: asString(fm.imageAlt),
      date: normalizeDate(fm.date),
      caption: asString(fm.caption),
    })
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getFailures(): Promise<Failure[]> {
  const raw = readMarkdownDir(
    path.join(baseDir, "failures"),
    (slug, fm, body) => ({
      slug,
      product: asString(fm.product),
      productImage: asString(fm.productImage),
      blur: asBool(fm.blur),
      adSpend: asNumber(fm.adSpend),
      hypothesis: asString(fm.hypothesis),
      reasonFailed: asString(fm.reasonFailed),
      lessons: body,
      videoUrl: normalizeUrl(asString(fm.videoUrl)),
      failedOn: normalizeDate(fm.failedOn),
    })
  );
  const withHtml: Failure[] = await Promise.all(
    raw.map(async (f) => {
      const processed = await remark().use(html).process(f.lessons || "");
      return { ...f, lessonsHtml: processed.toString() };
    })
  );
  return withHtml.sort(
    (a, b) =>
      new Date(b.failedOn).getTime() - new Date(a.failedOn).getTime()
  );
}

export function getGoal(): DropshippingGoal {
  const filePath = path.join(baseDir, "goal.md");
  const fallback: DropshippingGoal = {
    goalAmount: 100000,
    goalDeadline: "2027-01-01",
    currentSales: 0,
    lastUpdated: "",
  };
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data } = matter(raw);
  const fm = data as Record<string, unknown>;
  return {
    goalAmount: asNumber(fm.goalAmount) || fallback.goalAmount,
    goalDeadline: normalizeDate(fm.goalDeadline) || fallback.goalDeadline,
    currentSales: asNumber(fm.currentSales),
    lastUpdated: normalizeDate(fm.lastUpdated),
  };
}
