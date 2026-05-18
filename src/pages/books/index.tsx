import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import type { GetStaticProps } from "next";
import Layout from "@/components/Layout";
import { ChevronDownIcon, GridIcon, ListIcon } from "@/components/Icons";
import StarRating from "@/components/StarRating";
import { getAllBooks } from "@/lib/books";
import {
  BOOK_SORTS,
  formatReadOn,
  sortBooks,
  type BookMeta,
  type BookSort,
} from "@/lib/book-utils";

type Props = { books: BookMeta[] };
type ViewMode = "grid" | "list";

export const getStaticProps: GetStaticProps<Props> = async () => {
  return { props: { books: getAllBooks() } };
};

function StarRow({ rating }: { rating: number }) {
  return <StarRating rating={rating} />;
}

export default function BooksPage({ books }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<BookSort>("recent");
  const [view, setView] = useState<ViewMode>("grid");

  const activeTag: string | null = (() => {
    const t = router.query.tag;
    return typeof t === "string" && t ? t : null;
  })();

  const clearTag = () => {
    const { tag, ...rest } = router.query;
    void tag;
    router.replace(
      { pathname: "/books/", query: rest },
      undefined,
      { shallow: true, scroll: false }
    );
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matched = books.filter((b) => {
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q);
      const matchesTag = !activeTag || b.tags.includes(activeTag);
      return matchesSearch && matchesTag;
    });
    return sortBooks(matched, sort);
  }, [books, search, sort, activeTag]);

  return (
    <Layout
      title="Books"
      description="Book reviews by Matthew Malan — what I'm reading, what I'm learning, and what's worth your time."
      path="/books/"
      ogImage="/og/books.png"
    >
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 sm:pt-20 pb-10 sm:pb-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
          Books
        </p>
        <h1 className="mt-6 text-4xl sm:text-6xl lg:text-7xl tracking-tight max-w-4xl leading-[1.05]">
          Matthew&apos;s{" "}
          <span className="bg-[var(--color-yellow)] px-2">Book Reviews</span>
        </h1>
      </section>

      {/* Active-tag indicator */}
      {activeTag && (
        <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-3">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[var(--color-yellow)] text-[var(--color-black)] text-sm font-semibold">
            <span>
              Filtering by tag: <span className="font-bold">{activeTag}</span>
            </span>
            <button
              type="button"
              onClick={clearTag}
              aria-label="Clear tag filter"
              className="text-[var(--color-black)]/70 hover:text-[var(--color-black)] cursor-pointer"
            >
              ✕
            </button>
          </div>
        </section>
      )}

      {/* Search + Sort + View toggle */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <label htmlFor="book-search" className="sr-only">
            Search books
          </label>
          <input
            id="book-search"
            type="search"
            placeholder="Search by title or author"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-0 px-5 py-3 rounded-full border-2 border-[var(--color-black)] bg-[var(--color-off-white)] focus:outline-none focus:bg-white"
          />

          <label htmlFor="book-sort" className="sr-only">
            Sort books
          </label>
          <div className="relative">
            <select
              id="book-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as BookSort)}
              className="appearance-none w-full pl-5 pr-11 py-3 rounded-full border-2 border-[var(--color-black)] bg-[var(--color-off-white)] focus:outline-none cursor-pointer"
            >
              {BOOK_SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  Sort: {s.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-black)] pointer-events-none" />
          </div>

          <div
            role="group"
            aria-label="View mode"
            className="flex items-center gap-1 p-1 rounded-full border-2 border-[var(--color-black)] bg-[var(--color-off-white)]"
          >
            <button
              type="button"
              onClick={() => setView("grid")}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              title="Grid view"
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                view === "grid"
                  ? "bg-[var(--color-black)] text-[var(--color-yellow)]"
                  : "text-[var(--color-black)]/50 hover:text-[var(--color-black)]"
              }`}
            >
              <GridIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              aria-label="List view"
              aria-pressed={view === "list"}
              title="List view"
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                view === "list"
                  ? "bg-[var(--color-black)] text-[var(--color-yellow)]"
                  : "text-[var(--color-black)]/50 hover:text-[var(--color-black)]"
              }`}
            >
              <ListIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Book list */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-24">
        {books.length === 0 ? (
          <p className="text-[var(--color-black)]/60">
            No reviews yet — check back soon.
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-[var(--color-black)]/60">
            No books match that filter.
          </p>
        ) : view === "grid" ? (
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {filtered.map((b) => (
              <li key={b.slug}>
                <Link href={`/books/${b.slug}/`} className="group block">
                  {b.coverImage && (
                    <div className="aspect-[2/3] overflow-hidden rounded-lg bg-[var(--color-warm-gray)] shadow-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.coverImage}
                        alt={b.coverImageAlt || b.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <h2 className="mt-3 text-base sm:text-lg tracking-tight leading-snug group-hover:underline decoration-[var(--color-yellow)] decoration-2 underline-offset-2 line-clamp-2">
                    {b.title}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-black)]/70 line-clamp-1">
                    by {b.author}
                  </p>
                  <div className="mt-1 text-sm">
                    <StarRow rating={b.rating} />
                  </div>
                  {b.lastReadOn && (
                    <p className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-[var(--color-black)]/50">
                      {b.readings.length > 1 ? "Last read:" : "Read on:"}{" "}
                      <time dateTime={b.lastReadOn}>
                        {formatReadOn(b.lastReadOn)}
                      </time>
                      {b.readings.length > 1 && (
                        <span className="ml-1 text-[var(--color-black)]/40">
                          ({b.readings.length}x)
                        </span>
                      )}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="divide-y divide-[var(--color-warm-gray)] border-y border-[var(--color-warm-gray)]">
            {filtered.map((b) => (
              <li key={b.slug}>
                <Link
                  href={`/books/${b.slug}/`}
                  className="group flex gap-4 sm:gap-6 py-4 sm:py-5"
                >
                  {b.coverImage && (
                    <div className="flex-shrink-0 w-14 h-20 sm:w-16 sm:h-24 overflow-hidden rounded-md bg-[var(--color-warm-gray)] shadow">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.coverImage}
                        alt={b.coverImageAlt || b.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg font-semibold tracking-tight leading-snug group-hover:underline decoration-[var(--color-yellow)] decoration-2 underline-offset-2 line-clamp-1">
                      {b.title}
                    </h2>
                    <p className="text-sm text-[var(--color-black)]/70 line-clamp-1">
                      by {b.author}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <StarRow rating={b.rating} />
                      {b.lastReadOn && (
                        <span className="text-xs uppercase tracking-wider text-[var(--color-black)]/50">
                          {b.readings.length > 1 ? "Last read:" : "Read on:"}{" "}
                          <time dateTime={b.lastReadOn}>
                            {formatReadOn(b.lastReadOn)}
                          </time>
                          {b.readings.length > 1 && (
                            <span className="ml-1 text-[var(--color-black)]/40">
                              ({b.readings.length}x)
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Layout>
  );
}
