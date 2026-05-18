// Renders 5 stars representing a 0–5 rating in 0.5 increments.
// Uses SVG with a linear gradient stop at 50% for half stars — looks
// identical across fonts/browsers, no Unicode glyph guessing.

type Props = {
  rating: number;
  className?: string;
};

const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

const FILLED = "var(--color-yellow)";
const EMPTY = "var(--color-warm-gray)";

function Star({ fill }: { fill: "full" | "half" | "empty" }) {
  const fillColor =
    fill === "full" ? FILLED : fill === "empty" ? EMPTY : "url(#half-star)";
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-[1em] h-[1em] inline-block"
      aria-hidden="true"
    >
      <path d={STAR_PATH} fill={fillColor} />
    </svg>
  );
}

export default function StarRating({ rating, className = "" }: Props) {
  // Snap to 0.5 increments and clamp to [0, 5].
  const r = Math.max(0, Math.min(5, Math.round(rating * 2) / 2));

  const stars: Array<"full" | "half" | "empty"> = [];
  for (let i = 0; i < 5; i++) {
    const diff = r - i;
    if (diff >= 1) stars.push("full");
    else if (diff >= 0.5) stars.push("half");
    else stars.push("empty");
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 leading-none ${className}`}
      role="img"
      aria-label={`Rated ${r} out of 5`}
    >
      {/* Shared gradient def — left half filled, right half empty. */}
      <svg
        width="0"
        height="0"
        className="absolute"
        aria-hidden="true"
        style={{ position: "absolute", width: 0, height: 0 }}
      >
        <defs>
          <linearGradient id="half-star" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="50%" stopColor={FILLED} />
            <stop offset="50%" stopColor={EMPTY} />
          </linearGradient>
        </defs>
      </svg>
      {stars.map((fill, i) => (
        <Star key={i} fill={fill} />
      ))}
    </span>
  );
}
