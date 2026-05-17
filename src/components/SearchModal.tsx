import { useEffect, useRef, useState } from "react";
import { CloseIcon, SearchIcon } from "./Icons";

type PagefindResultData = {
  url: string;
  meta: { title?: string; image?: string };
  excerpt: string;
};

type PagefindResult = {
  id: string;
  data: () => Promise<PagefindResultData>;
};

type PagefindAPI = {
  search: (query: string) => Promise<{ results: PagefindResult[] }>;
  init?: () => Promise<void>;
};

declare global {
  interface Window {
    __pagefind?: PagefindAPI;
  }
}

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SearchModal({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PagefindResultData[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagefindReady, setPagefindReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lazy-load Pagefind only when the modal first opens.
  useEffect(() => {
    if (!open || window.__pagefind) {
      if (window.__pagefind) setPagefindReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const mod = await import(
          /* webpackIgnore: true */ "/pagefind/pagefind.js" as string
        );
        if (mod.init) await mod.init();
        if (cancelled) return;
        window.__pagefind = mod as PagefindAPI;
        setPagefindReady(true);
      } catch (err) {
        console.error("[search] Pagefind failed to load:", err);
        if (!cancelled) {
          setError(
            "Search index not available. Run a production build to enable search."
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Focus input on open.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Reset on close.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setError(null);
    }
  }, [open]);

  // Escape to close.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Run the search when query or pagefind readiness changes.
  useEffect(() => {
    if (!open || !pagefindReady) return;
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const pf = window.__pagefind;
        if (!pf) return;
        const search = await pf.search(q);
        const data = await Promise.all(
          search.results.slice(0, 8).map((r) => r.data())
        );
        if (!cancelled) setResults(data);
      } catch (err) {
        console.error("[search] Search failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query, open, pagefindReady]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-20 px-4 bg-[var(--color-black)]/70"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div
        className="w-full max-w-2xl bg-[var(--color-off-white)] rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-warm-gray)]">
          <SearchIcon className="w-5 h-5 text-[var(--color-black)]/60 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search episodes, books, posts…"
            className="flex-1 bg-transparent outline-none text-lg text-[var(--color-black)] placeholder:text-[var(--color-black)]/40"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-black)]/60 hover:text-[var(--color-black)] p-1"
            aria-label="Close search"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="px-5 py-6 text-sm text-[var(--color-black)]/60">
              {error}
            </div>
          )}
          {!error && !pagefindReady && (
            <div className="px-5 py-6 text-sm text-[var(--color-black)]/60">
              Loading search…
            </div>
          )}
          {!error && pagefindReady && query && loading && (
            <div className="px-5 py-6 text-sm text-[var(--color-black)]/60">
              Searching…
            </div>
          )}
          {!error &&
            pagefindReady &&
            query &&
            !loading &&
            results.length === 0 && (
              <div className="px-5 py-6 text-sm text-[var(--color-black)]/60">
                No results for &ldquo;{query}&rdquo;.
              </div>
            )}
          {!error && results.length > 0 && (
            <ul>
              {results.map((r) => (
                <li
                  key={r.url}
                  className="border-b border-[var(--color-warm-gray)]/50 last:border-b-0"
                >
                  <a
                    href={r.url}
                    onClick={onClose}
                    className="block px-5 py-4 hover:bg-[var(--color-yellow)]/20 transition-colors"
                  >
                    <p className="font-semibold text-[var(--color-black)]">
                      {r.meta.title ?? r.url}
                    </p>
                    <p
                      className="mt-1 text-sm text-[var(--color-black)]/70 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: r.excerpt }}
                    />
                    <p className="mt-1 text-xs text-[var(--color-black)]/40">
                      {r.url}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          )}
          {!error && !query && pagefindReady && (
            <div className="px-5 py-6 text-sm text-[var(--color-black)]/60">
              Start typing to search episodes, books, and posts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
