import Link from "next/link";
import type { GetStaticPaths, GetStaticProps } from "next";
import Layout from "@/components/Layout";
import GitHubGate from "@/components/GitHubGate";
import BlockProgressBar from "@/components/goals/BlockProgressBar";
import {
  getAllAreas,
  getAllGoals,
  getAllKeyResults,
  getAllVisionBoard,
} from "@/lib/goals-data";
import {
  progressPct,
  type Area,
  type Goal,
  type KeyResult,
  type VisionBoardItem,
} from "@/lib/goals-data-types";

type Props = {
  goal: Goal;
  area: Area | null;
  keyResults: KeyResult[];
  visions: VisionBoardItem[];
};

export const getStaticPaths: GetStaticPaths = async () => {
  const goals = await getAllGoals();
  return {
    paths: goals.map((g) => ({ params: { slug: g.slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "");
  const goals = await getAllGoals();
  const goal = goals.find((g) => g.slug === slug);
  if (!goal) return { notFound: true };
  const areas = getAllAreas();
  const krs = getAllKeyResults().filter((k) => k.goalSlug === slug);
  // Visions associated with this goal come from BOTH directions:
  //   1. The goal lists the vision slug (legacy `visions:` field), OR
  //   2. The vision lists THIS goal slug (preferred — set in /goals-admin).
  // Either side is enough so editors don't have to remember to mirror it.
  const allVisions = getAllVisionBoard();
  const visionItems = allVisions.filter(
    (v) =>
      goal.visionSlugs.includes(v.slug) || v.associatedGoals.includes(slug)
  );
  return {
    props: {
      goal,
      area: areas.find((a) => a.slug === goal.areaSlug) ?? null,
      keyResults: krs,
      visions: visionItems,
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

export default function GoalDetail({
  goal,
  area,
  keyResults,
  visions,
}: Props) {
  return (
    <Layout
      title={goal.title}
      description="Private goal detail."
      path={`/goals/${goal.slug}/`}
      ogImage="/og/home.png"
      noIndex
    >
      <GitHubGate>
        <div className="max-w-4xl mx-auto px-6 lg:px-10 py-12">
          <Link
            href="/goals/"
            className="text-sm text-[var(--color-black)]/60 hover:text-[var(--color-black)]"
          >
            ← Back to Goals
          </Link>

          <div className="mt-6">
            <span
              aria-hidden="true"
              className="block text-5xl mb-3"
            >
              {goal.emoji}
            </span>
            <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl tracking-tight">
              {goal.title}
            </h1>
          </div>

          {/* Properties */}
          <dl className="mt-8 grid grid-cols-[140px_1fr] gap-y-3 text-sm">
            <dt className="text-[var(--color-black)]/55 inline-flex items-center gap-1.5">
              <span aria-hidden="true">○</span> Type
            </dt>
            <dd>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[var(--color-warm-gray)]/30 text-xs">
                {goal.type}
              </span>
            </dd>

            <dt className="text-[var(--color-black)]/55 inline-flex items-center gap-1.5">
              <span aria-hidden="true">↗</span> Area
            </dt>
            <dd>
              {area ? (
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden="true">{area.emoji}</span>
                  <span>{area.name}</span>
                </span>
              ) : (
                <span className="text-[var(--color-black)]/40">—</span>
              )}
            </dd>

            <dt className="text-[var(--color-black)]/55 inline-flex items-center gap-1.5">
              <span aria-hidden="true">↗</span> Key Results
            </dt>
            <dd className="flex flex-wrap gap-2">
              {keyResults.length === 0 ? (
                <span className="text-[var(--color-black)]/40">—</span>
              ) : (
                keyResults.map((k) => (
                  <span
                    key={k.slug}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--color-yellow)]/40 text-xs"
                  >
                    <span aria-hidden="true">{k.emoji}</span>
                    <span>{k.title}</span>
                  </span>
                ))
              )}
            </dd>

            <dt className="text-[var(--color-black)]/55 inline-flex items-center gap-1.5">
              <span aria-hidden="true">📅</span> To Complete By
            </dt>
            <dd>
              {goal.toCompleteBy
                ? formatLongDate(goal.toCompleteBy)
                : <span className="text-[var(--color-black)]/40">—</span>}
            </dd>

            <dt className="text-[var(--color-black)]/55 inline-flex items-center gap-1.5">
              <span aria-hidden="true">📅</span> Completion Date
            </dt>
            <dd>
              {goal.completionDate
                ? formatLongDate(goal.completionDate)
                : <span className="text-[var(--color-black)]/40">Empty</span>}
            </dd>

            <dt className="text-[var(--color-black)]/55 inline-flex items-center gap-1.5">
              <span aria-hidden="true">∑</span> Key Results Completed
            </dt>
            <dd>
              <BlockProgressBar pct={goal.computedProgressPct} />
            </dd>

            <dt className="text-[var(--color-black)]/55 inline-flex items-center gap-1.5">
              <span aria-hidden="true">↗</span> Visuals
            </dt>
            <dd className="flex flex-wrap gap-2">
              {visions.length === 0 ? (
                <span className="text-[var(--color-black)]/40">—</span>
              ) : (
                visions.map((v) => (
                  <a
                    key={v.slug}
                    href={`#vision-${v.slug}`}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--color-warm-gray)]/30 hover:bg-[var(--color-warm-gray)]/60 text-xs"
                  >
                    <span aria-hidden="true">{v.emoji}</span>
                    <span>{v.title}</span>
                  </a>
                ))
              )}
            </dd>
          </dl>

          {/* Visuals gallery — pictures associated with this goal */}
          {visions.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-semibold mb-4">Visuals</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {visions.map((v) => (
                  <li
                    key={v.slug}
                    id={`vision-${v.slug}`}
                    className="bg-[var(--color-off-white)] ring-1 ring-[var(--color-warm-gray)]/60 rounded-lg overflow-hidden scroll-mt-20"
                  >
                    {v.image && (
                      <div className="aspect-[4/3] bg-[var(--color-warm-gray)]/30 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={v.image}
                          alt={v.imageAlt || v.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <p className="font-semibold text-sm text-[var(--color-black)] inline-flex items-center gap-2">
                        <span aria-hidden="true">{v.emoji}</span>
                        <span>{v.title}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Key Results detail */}
          {keyResults.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-semibold mb-4">Key Results</h2>
              <ul className="space-y-3">
                {keyResults.map((k) => {
                  const pct = progressPct(k.current, k.target);
                  return (
                    <li
                      key={k.slug}
                      className="bg-[var(--color-off-white)] ring-1 ring-[var(--color-warm-gray)]/60 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <p className="font-semibold inline-flex items-center gap-2">
                          <span aria-hidden="true">{k.emoji}</span>
                          <span>{k.title}</span>
                        </p>
                        <p className="text-xs text-[var(--color-black)]/70 tabular-nums">
                          {k.current} of {k.target}
                          {k.unit ? ` ${k.unit}` : ""}
                        </p>
                      </div>
                      <div className="mt-2">
                        <BlockProgressBar pct={pct} />
                      </div>
                      {k.toCompleteBy && (
                        <p className="mt-2 text-xs text-[var(--color-black)]/60">
                          To complete by {formatLongDate(k.toCompleteBy)}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Notes (markdown body — Before / After lessons) */}
          {goal.notesHtml.trim() && (
            <section className="mt-12">
              <div
                className="prose prose-sm max-w-none [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: goal.notesHtml }}
              />
            </section>
          )}
        </div>
      </GitHubGate>
    </Layout>
  );
}
