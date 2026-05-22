// Public-facing pledge section for /dropshipping/. Shows active pledges
// shared to dropshipping (red callout), past wins/losses, and for failed
// days, the TikTok recipient + payment proof screenshot.

import { useState } from "react";
import type {
  Goal,
  PledgeEvaluation,
  PledgeProof,
} from "@/lib/goals-data-types";

function formatShortDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map((p) => parseInt(p, 10));
  return new Date(y, m - 1, d, 12).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SharedPledgeSection({
  goals,
  history,
  proofs,
}: {
  goals: Goal[];
  history: PledgeEvaluation[];
  proofs: PledgeProof[];
}) {
  const [showAll, setShowAll] = useState(false);

  // Active pledge goals shared to dropshipping.
  const activePledges = goals.filter(
    (g) =>
      g.shareTo === "dropshipping" &&
      g.status === "active" &&
      g.pledgeAmount > 0
  );

  // History entries for those goals.
  const slugs = new Set(activePledges.map((g) => g.slug));
  const relevant = history.filter(
    (e) => slugs.has(e.goalSlug) && e.result !== "pending"
  );
  if (activePledges.length === 0 && relevant.length === 0) return null;

  const recent = showAll ? relevant : relevant.slice(0, 6);

  // Lookup: proof by (date, goalSlug).
  const proofByKey = new Map<string, PledgeProof>();
  for (const p of proofs) {
    proofByKey.set(`${p.date}|${p.goalSlug}`, p);
  }

  const totalLost = relevant
    .filter((e) => e.result === "failed")
    .reduce((s, e) => s + e.pledgeAmount, 0);
  const wins = relevant.filter((e) => e.result === "successful").length;
  const losses = relevant.filter((e) => e.result === "failed").length;

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-16">
      <div className="bg-[#D64545] text-[var(--color-off-white)] rounded-2xl p-6 lg:p-10 ring-2 ring-[#A92A2A]">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em]">
          Money on the line
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl tracking-tight">
          {activePledges.length === 1
            ? activePledges[0].title
            : "Public pledges"}
        </h2>
        <p className="mt-2 text-sm text-[var(--color-off-white)]/85 max-w-2xl">
          If I miss a day, I owe ${activePledges[0]?.pledgeAmount ?? 0} — and
          it goes to a random stranger on TikTok. Receipts below.
        </p>

        {/* Active rules */}
        {activePledges.length > 0 && (
          <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePledges.map((g) => (
              <li
                key={g.slug}
                className="bg-[var(--color-black)]/25 rounded-xl px-5 py-4"
              >
                <p className="font-[family-name:var(--font-display)] text-xl tracking-tight">
                  {g.title}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wider opacity-75">
                  ${g.pledgeAmount} on the line · daily
                </p>
              </li>
            ))}
          </ul>
        )}

        {/* Stats */}
        {relevant.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-3 max-w-md">
            <div className="bg-[var(--color-black)]/25 rounded-lg px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                Won
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl">
                {wins}
              </p>
            </div>
            <div className="bg-[var(--color-black)]/25 rounded-lg px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                Failed
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl">
                {losses}
              </p>
            </div>
            <div className="bg-[var(--color-black)]/25 rounded-lg px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                Lost
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl">
                ${totalLost}
              </p>
            </div>
          </div>
        )}

        {/* History */}
        {recent.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
                Past pledges
              </p>
              {relevant.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAll((v) => !v)}
                  className="text-xs font-semibold underline opacity-90 hover:opacity-100 cursor-pointer"
                >
                  {showAll ? "Show recent" : `Show all ${relevant.length}`}
                </button>
              )}
            </div>
            <ul className="space-y-3">
              {recent.map((e, i) => {
                const proof = proofByKey.get(`${e.date}|${e.goalSlug}`);
                return (
                  <li
                    key={`${e.goalSlug}-${e.date}-${i}`}
                    className={`rounded-lg px-4 py-3 ${
                      e.result === "successful"
                        ? "bg-[#16A34A]/30 ring-1 ring-[#16A34A]/50"
                        : "bg-[var(--color-black)]/30 ring-1 ring-[var(--color-black)]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-semibold">
                          {formatShortDate(e.date)} ·{" "}
                          {e.result === "successful"
                            ? "✓ Hit the goal"
                            : `✗ Missed · -$${e.pledgeAmount}`}
                        </p>
                        <p className="text-xs opacity-75">
                          {e.achieved} / {e.target}
                        </p>
                      </div>
                    </div>

                    {/* If failed and we have proof, show the recipient */}
                    {e.result === "failed" && proof && (
                      <div className="mt-3 pt-3 border-t border-[var(--color-off-white)]/15 flex items-start gap-3 flex-wrap">
                        {proof.tiktokAvatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={proof.tiktokAvatar}
                            alt={`@${proof.tiktokUsername}`}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-[var(--color-off-white)]/40 flex-shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <span
                            className="w-12 h-12 rounded-full bg-[var(--color-off-white)]/15 inline-flex items-center justify-center text-sm font-bold flex-shrink-0"
                            aria-hidden="true"
                          >
                            {proof.tiktokUsername.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">
                            Paid{" "}
                            {proof.tiktokProfileUrl ? (
                              <a
                                href={proof.tiktokProfileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline decoration-[var(--color-off-white)]/40 hover:decoration-[var(--color-off-white)]"
                              >
                                @{proof.tiktokUsername}
                              </a>
                            ) : (
                              <span>@{proof.tiktokUsername}</span>
                            )}{" "}
                            ${e.pledgeAmount}
                          </p>
                          {proof.note && (
                            <p className="mt-0.5 text-xs opacity-75">
                              {proof.note}
                            </p>
                          )}
                        </div>
                        {proof.screenshot && (
                          <a
                            href={proof.screenshot}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={proof.screenshot}
                              alt="Payment screenshot"
                              className="h-20 rounded-md ring-1 ring-[var(--color-off-white)]/30"
                              loading="lazy"
                            />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Failed but no proof uploaded yet */}
                    {e.result === "failed" && !proof && (
                      <p className="mt-2 text-xs italic opacity-70">
                        Payment proof pending — will appear here once
                        donated.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
