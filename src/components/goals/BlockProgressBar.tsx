// Notion-style block progress bar — 10 small squares, filled left-to-right.
// Example: ████████░░ 80%

export default function BlockProgressBar({
  pct,
  size = "md",
}: {
  pct: number;
  size?: "sm" | "md";
}) {
  const filled = Math.max(0, Math.min(10, Math.round(pct / 10)));
  const blockSize = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";
  return (
    <span
      className="inline-flex items-center gap-[3px]"
      aria-label={`${pct}% complete`}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={`${blockSize} rounded-[1px] ${
            i < filled
              ? "bg-[var(--color-black)]"
              : "bg-[var(--color-warm-gray)]/60"
          }`}
        />
      ))}
      <span
        className={`ml-2 tabular-nums text-[var(--color-black)]/70 ${
          size === "sm" ? "text-[10px]" : "text-xs"
        }`}
      >
        {pct}%
      </span>
    </span>
  );
}
