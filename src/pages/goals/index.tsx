import Link from "next/link";
import type { GetStaticProps } from "next";
import Layout from "@/components/Layout";
import GitHubGate from "@/components/GitHubGate";
import BlockProgressBar from "@/components/goals/BlockProgressBar";
import {
  getAllActionItems,
  getAllAreas,
  getAllGoals,
  getAllKeyResults,
  getAllVisionBoard,
} from "@/lib/goals-data";
import {
  progressPct,
  rollupAreaProgress,
  type ActionItem,
  type Area,
  type Goal,
  type KeyResult,
  type VisionBoardItem,
} from "@/lib/goals-data-types";

type Props = {
  areas: Area[];
  goals: Goal[];
  keyResults: KeyResult[];
  actions: ActionItem[];
  vision: VisionBoardItem[];
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  return {
    props: {
      areas: getAllAreas(),
      goals: await getAllGoals(),
      keyResults: getAllKeyResults(),
      actions: getAllActionItems(),
      vision: getAllVisionBoard(),
    },
  };
};

function formatLongDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map((p) => parseInt(p, 10));
  return new Date(y, m - 1, d, 12).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ---------- Section components (inline for simplicity) ------------------

function SectionHeader({
  icon,
  label,
  title,
}: {
  icon: string;
  label: string;
  title: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-black)]">
        {title}
      </h2>
      <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-[var(--color-black)]/55 bg-[var(--color-warm-gray)]/30 rounded-md px-2 py-0.5">
        <span aria-hidden="true">{icon}</span>
        <span>{label}</span>
      </p>
    </div>
  );
}

function QuickLinks() {
  const items: Array<{ icon: string; label: string; href: string }> = [
    { icon: "📋", label: "My Goals", href: "#my-goals" },
    { icon: "🎯", label: "Key Results", href: "#upcoming-milestones" },
    { icon: "✅", label: "Action Items", href: "#upcoming-actions" },
  ];
  return (
    <aside className="bg-[var(--color-off-white)] rounded-xl ring-1 ring-[var(--color-warm-gray)]/60 p-5 sticky top-20">
      <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-black)]/60 mb-3">
        <span aria-hidden="true">⚡</span> Quick Links
      </p>
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i.href}>
            <a
              href={i.href}
              className="flex items-center gap-2 text-sm text-[var(--color-black)] hover:bg-[var(--color-warm-gray)]/30 rounded-md px-2 py-1.5 -mx-2 transition-colors"
            >
              <span aria-hidden="true">{i.icon}</span>
              <span>{i.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function UpcomingMilestonesSection({
  keyResults,
}: {
  keyResults: KeyResult[];
}) {
  const upcoming = keyResults
    .filter((k) => k.status === "in-progress")
    .sort((a, b) => {
      if (a.toCompleteBy && b.toCompleteBy)
        return a.toCompleteBy.localeCompare(b.toCompleteBy);
      if (a.toCompleteBy) return -1;
      if (b.toCompleteBy) return 1;
      return 0;
    })
    .slice(0, 6);
  if (upcoming.length === 0) return null;

  return (
    <section id="upcoming-milestones">
      <SectionHeader
        icon="🎯"
        label="Key Results"
        title="Upcoming Milestones"
      />
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {upcoming.map((k) => {
          const pct = progressPct(k.current, k.target);
          return (
            <li
              key={k.slug}
              className="bg-[var(--color-off-white)] ring-1 ring-[var(--color-warm-gray)]/60 rounded-lg p-4"
            >
              <p className="font-semibold text-[var(--color-black)] inline-flex items-center gap-2">
                <span aria-hidden="true">{k.emoji}</span>
                <span>{k.title}</span>
              </p>
              <p className="mt-2 text-xs text-[var(--color-black)]/70 tabular-nums">
                {k.current} of {k.target}
                {k.unit ? ` ${k.unit}` : ""}
              </p>
              <div className="mt-2">
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-black)]/50 mb-1">
                  Objective Status:
                </p>
                <BlockProgressBar pct={pct} />
              </div>
              {k.toCompleteBy && (
                <p className="mt-3 text-xs text-[var(--color-black)]/60">
                  To complete by {formatLongDate(k.toCompleteBy)}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function UpcomingGoalsSection({ goals }: { goals: Goal[] }) {
  const upcoming = goals
    .filter((g) => g.status === "active")
    .sort((a, b) => {
      if (a.toCompleteBy && b.toCompleteBy)
        return a.toCompleteBy.localeCompare(b.toCompleteBy);
      if (a.toCompleteBy) return -1;
      if (b.toCompleteBy) return 1;
      return 0;
    })
    .slice(0, 4);
  if (upcoming.length === 0) return null;

  return (
    <section id="upcoming-goals">
      <SectionHeader icon="📋" label="Goals Due Soon" title="Upcoming Goals" />
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {upcoming.map((g) => (
          <li
            key={g.slug}
            className="bg-[var(--color-off-white)] ring-1 ring-[var(--color-warm-gray)]/60 rounded-lg p-4"
          >
            <Link
              href={`/goals/${g.slug}/`}
              className="font-semibold text-[var(--color-black)] inline-flex items-center gap-2 hover:underline"
            >
              <span aria-hidden="true">{g.emoji}</span>
              <span>{g.title}</span>
            </Link>
            <div className="mt-2">
              <BlockProgressBar pct={g.computedProgressPct} />
            </div>
            {g.toCompleteBy && (
              <p className="mt-2 text-xs text-[var(--color-black)]/60">
                To complete by {formatLongDate(g.toCompleteBy)}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecentlyCompletedSection({
  goals,
  areas,
}: {
  goals: Goal[];
  areas: Area[];
}) {
  const completed = goals
    .filter((g) => g.status === "completed")
    .sort((a, b) =>
      (b.completionDate || "").localeCompare(a.completionDate || "")
    )
    .slice(0, 4);
  if (completed.length === 0) return null;
  const areaBySlug = new Map(areas.map((a) => [a.slug, a]));

  return (
    <section>
      <SectionHeader
        icon="✅"
        label="Completed Goals"
        title="Recently Completed"
      />
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {completed.map((g) => {
          const area = areaBySlug.get(g.areaSlug);
          return (
            <li
              key={g.slug}
              className="bg-[var(--color-off-white)] ring-1 ring-[var(--color-warm-gray)]/60 rounded-lg p-4"
            >
              <Link
                href={`/goals/${g.slug}/`}
                className="font-semibold text-[var(--color-black)] inline-flex items-center gap-2 hover:underline"
              >
                <span aria-hidden="true">{g.emoji}</span>
                <span>{g.title}</span>
              </Link>
              {area && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--color-black)]/70">
                  <span aria-hidden="true">{area.emoji}</span>
                  <span>{area.name}</span>
                </p>
              )}
              {g.completionDate && (
                <p className="mt-1 text-xs text-[var(--color-black)]/60">
                  Completed: {formatLongDate(g.completionDate)}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function CategoryProgressSection({
  areas,
  goals,
}: {
  areas: Area[];
  goals: Goal[];
}) {
  const rolled = rollupAreaProgress(areas, goals);
  if (rolled.length === 0) return null;
  return (
    <section>
      <SectionHeader
        icon="🌳"
        label="Areas of Life"
        title="Goals Progress by Category"
      />
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rolled.map((a) => (
          <li
            key={a.slug}
            className="bg-[var(--color-off-white)] ring-1 ring-[var(--color-warm-gray)]/60 rounded-lg p-4"
          >
            <p className="font-semibold text-[var(--color-black)] inline-flex items-center gap-2">
              <span aria-hidden="true">{a.emoji}</span>
              <span>{a.name}</span>
            </p>
            <div className="mt-2">
              <BlockProgressBar pct={a.pct} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function UpcomingActionsSection({ actions }: { actions: ActionItem[] }) {
  const todos = actions.filter((a) => a.status === "todo").slice(0, 20);
  if (todos.length === 0) return null;
  return (
    <section id="upcoming-actions">
      <SectionHeader
        icon="✅"
        label="Action Items To Do"
        title="Upcoming Actions"
      />
      <ul className="bg-[var(--color-off-white)] ring-1 ring-[var(--color-warm-gray)]/60 rounded-lg divide-y divide-[var(--color-warm-gray)]/40">
        {todos.map((a) => (
          <li
            key={a.slug}
            className="flex items-center justify-between gap-3 px-4 py-2.5"
          >
            <span className="text-sm text-[var(--color-black)]">
              {a.title}
            </span>
            <span
              aria-hidden="true"
              className="w-4 h-4 rounded border border-[var(--color-warm-gray)] flex-shrink-0"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function VisionBoardSection({
  items,
  areas,
  goals,
}: {
  items: VisionBoardItem[];
  areas: Area[];
  goals: Goal[];
}) {
  if (items.length === 0) return null;
  const areaBySlug = new Map(areas.map((a) => [a.slug, a]));
  const goalBySlug = new Map(goals.map((g) => [g.slug, g]));
  return (
    <section>
      <SectionHeader icon="✨" label="Vision Board" title="Vision Board" />
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((v) => {
          // First associated goal — if any — becomes the click-through target
          // so people can jump from the picture to the full goal page.
          const targetGoalSlug = v.associatedGoals.find((slug) =>
            goalBySlug.has(slug)
          );
          const inner = (
            <>
              {v.image && (
                <div className="aspect-[4/3] bg-[var(--color-warm-gray)]/30 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.image}
                    alt={v.imageAlt || v.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-4">
                <p className="font-semibold text-[var(--color-black)] inline-flex items-center gap-2">
                  <span aria-hidden="true">{v.emoji}</span>
                  <span>{v.title}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--color-black)]/70">
                  {v.associatedGoals.map((slug) => {
                    const g = goalBySlug.get(slug);
                    return g ? (
                      <span
                        key={slug}
                        className="inline-flex items-center gap-1"
                      >
                        <span aria-hidden="true">{g.emoji}</span> {g.title}
                      </span>
                    ) : null;
                  })}
                  {v.associatedAreas.map((slug) => {
                    const a = areaBySlug.get(slug);
                    return a ? (
                      <span
                        key={slug}
                        className="inline-flex items-center gap-1"
                      >
                        <span aria-hidden="true">{a.emoji}</span> {a.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </>
          );
          return (
            <li
              key={v.slug}
              className="bg-[var(--color-off-white)] ring-1 ring-[var(--color-warm-gray)]/60 rounded-lg overflow-hidden"
            >
              {targetGoalSlug ? (
                <Link
                  href={`/goals/${targetGoalSlug}/`}
                  className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-yellow)]"
                  aria-label={`Open goal: ${
                    goalBySlug.get(targetGoalSlug)?.title ?? targetGoalSlug
                  }`}
                >
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function MyGoalsTable({
  goals,
  areas,
  keyResults,
}: {
  goals: Goal[];
  areas: Area[];
  keyResults: KeyResult[];
}) {
  const areaBySlug = new Map(areas.map((a) => [a.slug, a]));
  const krsByGoal = (slug: string) =>
    keyResults.filter((k) => k.goalSlug === slug);

  return (
    <section id="my-goals">
      <SectionHeader icon="1️⃣" label="My Goals" title="My Goals" />
      <div className="bg-[var(--color-off-white)] ring-1 ring-[var(--color-warm-gray)]/60 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-[var(--color-black)]/55 bg-[var(--color-warm-gray)]/20">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Goal</th>
              <th className="text-left font-medium px-4 py-2.5">Area</th>
              <th className="text-left font-medium px-4 py-2.5">Key Results Completed</th>
              <th className="text-left font-medium px-4 py-2.5">Type</th>
              <th className="text-left font-medium px-4 py-2.5">Key Results</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-warm-gray)]/40">
            {goals.map((g) => {
              const area = areaBySlug.get(g.areaSlug);
              const ourKrs = krsByGoal(g.slug);
              return (
                <tr key={g.slug}>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/goals/${g.slug}/`}
                      className="inline-flex items-center gap-2 font-semibold text-[var(--color-black)] hover:underline"
                    >
                      <span aria-hidden="true">{g.emoji}</span>
                      <span>{g.title}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    {area ? (
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span aria-hidden="true">{area.emoji}</span>
                        <span>{area.name}</span>
                      </span>
                    ) : (
                      <span className="text-[var(--color-black)]/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <BlockProgressBar pct={g.computedProgressPct} size="sm" />
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[var(--color-black)]/70">
                    {g.type}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[var(--color-black)]/70">
                    {ourKrs.length > 0
                      ? ourKrs.map((k) => k.title).join(", ")
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------- Page ------------------------------------------------------

export default function GoalsPage({
  areas,
  goals,
  keyResults,
  actions,
  vision,
}: Props) {
  return (
    <Layout
      title="Goals"
      description="Private goals dashboard."
      path="/goals/"
      ogImage="/og/home.png"
      noIndex
    >
      <GitHubGate>
        <section className="bg-[var(--color-off-white)] text-[var(--color-black)]">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-8 lg:pt-20">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
              Goal Tracker
            </p>
            <h1 className="mt-4 text-4xl sm:text-5xl tracking-tight">
              Goals
            </h1>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6 lg:px-10 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
            <QuickLinks />

            <main className="space-y-10 min-w-0">
              <UpcomingMilestonesSection keyResults={keyResults} />
              <UpcomingGoalsSection goals={goals} />
              <RecentlyCompletedSection goals={goals} areas={areas} />
              <CategoryProgressSection areas={areas} goals={goals} />
              <UpcomingActionsSection actions={actions} />
              <VisionBoardSection
                items={vision}
                areas={areas}
                goals={goals}
              />
              <MyGoalsTable
                goals={goals}
                areas={areas}
                keyResults={keyResults}
              />
            </main>
          </div>
        </div>
      </GitHubGate>
    </Layout>
  );
}
