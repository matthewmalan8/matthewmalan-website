import { useEffect, useState } from "react";
import type { Speech } from "@/lib/speeches";

const PLAYLIST_URL =
  "https://www.youtube.com/playlist?list=PL1wWJyVcgZeUrQCKpjyEH7oggv8OMH47y";

type Mode = "normal" | "compact";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PlayIcon({ small = false }: { small?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={small ? "w-3.5 h-3.5 ml-0.5" : "w-5 h-5 ml-0.5"}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="5" cy="6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="5" cy="18" r="1.5" fill="currentColor" stroke="none" />
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function NormalCard({ speech }: { speech: Speech }) {
  return (
    <a
      href={speech.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col bg-[var(--color-off-white)] rounded-xl overflow-hidden ring-1 ring-[var(--color-warm-gray)]/30 hover:ring-[var(--color-yellow)] hover:shadow-2xl transition-all"
    >
      <div className="relative aspect-video bg-[var(--color-warm-gray)]/20 overflow-hidden">
        {speech.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={speech.thumbnail}
            alt={speech.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-black)]/10 group-hover:bg-[var(--color-black)]/40 transition-colors">
          <span className="w-12 h-12 rounded-full bg-[var(--color-yellow)] text-[var(--color-black)] flex items-center justify-center opacity-95 group-hover:scale-110 transition-transform shadow-lg">
            <PlayIcon />
          </span>
        </div>
        {speech.videoPublishedAt && (
          <span className="absolute bottom-2 right-2 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-[var(--color-black)]/75 text-[var(--color-off-white)] backdrop-blur-sm">
            {formatDate(speech.videoPublishedAt)}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-[family-name:var(--font-display)] text-base tracking-tight leading-tight text-[var(--color-black)] line-clamp-2 min-h-[2.5rem]">
          {speech.title}
        </h3>
      </div>
    </a>
  );
}

function CompactRow({ speech }: { speech: Speech }) {
  return (
    <a
      href={speech.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-stretch gap-3 bg-[var(--color-off-white)] rounded-md overflow-hidden ring-1 ring-[var(--color-warm-gray)]/30 hover:ring-[var(--color-yellow)] transition-all"
    >
      <div className="relative aspect-video w-24 sm:w-28 flex-shrink-0 bg-[var(--color-warm-gray)]/20 overflow-hidden">
        {speech.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={speech.thumbnail}
            alt={speech.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-black)]/10 group-hover:bg-[var(--color-black)]/40 transition-colors">
          <span className="w-7 h-7 rounded-full bg-[var(--color-yellow)] text-[var(--color-black)] flex items-center justify-center opacity-90 group-hover:scale-110 transition-transform shadow">
            <PlayIcon small />
          </span>
        </div>
        {speech.videoPublishedAt && (
          <span className="absolute bottom-1 right-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-[var(--color-black)]/80 text-[var(--color-off-white)] leading-none">
            {formatDate(speech.videoPublishedAt)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 flex items-center pr-3">
        <h3 className="font-[family-name:var(--font-display)] text-sm sm:text-base tracking-tight leading-snug text-[var(--color-black)] line-clamp-2">
          {speech.title}
        </h3>
      </div>
    </a>
  );
}

export default function SpeechesSection({ speeches }: { speeches: Speech[] }) {
  // Default to normal so SSR/static-export markup matches the most common
  // desktop case; on mount we flip to compact for mobile viewports.
  const [mode, setMode] = useState<Mode>("normal");
  const [userOverridden, setUserOverridden] = useState(false);

  useEffect(() => {
    if (userOverridden) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 640px)").matches
    ) {
      setMode("compact");
    }
  }, [userOverridden]);

  const setModeExplicit = (m: Mode) => {
    setMode(m);
    setUserOverridden(true);
  };

  if (speeches.length === 0) return null;

  return (
    <section className="bg-[var(--color-black)] text-[var(--color-off-white)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-yellow)]">
              Watch me speak
            </p>
            <h2 className="mt-4 text-3xl lg:text-5xl tracking-tight max-w-2xl">
              Every talk, every stage — all in one place.
            </h2>
          </div>
          <div className="flex items-center gap-4 self-start sm:self-auto">
            {/* Mode toggle */}
            <div
              role="tablist"
              aria-label="Layout"
              className="inline-flex items-center bg-[var(--color-off-white)]/10 rounded-full p-1 ring-1 ring-[var(--color-warm-gray)]/30"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "normal"}
                aria-label="Grid view"
                title="Grid view"
                onClick={() => setModeExplicit("normal")}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                  mode === "normal"
                    ? "bg-[var(--color-yellow)] text-[var(--color-black)]"
                    : "text-[var(--color-off-white)]/70 hover:text-[var(--color-off-white)]"
                }`}
              >
                <GridIcon />
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "compact"}
                aria-label="Compact list view"
                title="Compact list view"
                onClick={() => setModeExplicit("compact")}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                  mode === "compact"
                    ? "bg-[var(--color-yellow)] text-[var(--color-black)]"
                    : "text-[var(--color-off-white)]/70 hover:text-[var(--color-off-white)]"
                }`}
              >
                <ListIcon />
              </button>
            </div>
            <a
              href={PLAYLIST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center text-sm font-semibold text-[var(--color-yellow)] hover:underline"
            >
              Open on YouTube →
            </a>
          </div>
        </div>

        {mode === "compact" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-w-5xl mx-auto">
            {speeches.map((s) => (
              <CompactRow key={s.videoId} speech={s} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {speeches.map((s) => (
              <NormalCard key={s.videoId} speech={s} />
            ))}
          </div>
        )}

        <a
          href={PLAYLIST_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="sm:hidden mt-6 inline-flex items-center text-sm font-semibold text-[var(--color-yellow)] hover:underline"
        >
          Open playlist on YouTube →
        </a>
      </div>
    </section>
  );
}
