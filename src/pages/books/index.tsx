import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import type { GetStaticProps } from "next";
import Layout from "@/components/Layout";
import { getAllBooks } from "@/lib/books";
import {
  BOOK_SORTS,
  formatReadOn,
  ratingStars,
  sortBooks,
  type BookMeta,
  type BookSort,
} from "@/lib/book-utils";

type Props = { books: BookMeta[] };

export const getStaticProps: GetStaticProps<Props> = async () => {
  return { props: { books: getAllBooks() } };
};

export default function BooksPage({ books }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<BookSort>("recent");

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
    >
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
          Books
        </p>
        <h1 className="mt-6 text-5xl sm:text-7xl tracking-tight max-w-4xl">
          Matthew&apos;s{" "}
          <span className="bg-[var(--color-yellow)] px-2">Book Reviews</span>
        </h1>
        <p className="mt-8 max-w-2xl text-lg text-[var(--color-black)]/70 leading-relaxed">
          What I&apos;m reading, what I&apos;m learning, and what&apos;s worth
          your time.
        </p>
      </section>

      {/* Active-tag indicator */}
      {activeTag && (
        <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-2">
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

      {/* Search + Sort */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label htmlFor="book-search" className="sr-only">
              Search books
            </label>
            <input
              id="book-search"
              type="search"
              placeholder="Search by title or author"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-5 py-3 rounded-full border-2 border-[var(--color-black)] bg-[var(--color-off-white)] focus:outline-none focus:bg-white"
            />
          </div>
          <div>
            <label htmlFor="book-sort" className="sr-only">
              Sort books
            </label>
            <select
              id="book-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as BookSort)}
              className="w-full px-5 py-3 rounded-full border-2 border-[var(--color-black)] bg-[var(--color-off-white)] focus:outline-none cursor-pointer"
            >
              {BOOK_SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  Sort: {s.label}
                </option>
              ))}
            </select>
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
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {filtered.map((b) => (
              <li key={b.slug}>
                <Link href={`/books/${b.slug}/`} className="group block">
                  {b.coverImage && (
                    <div className="aspect-[2/3] overflow-hidden rounded-xl bg-[var(--color-warm-gray)] shadow-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.coverImage}
                        alt={b.coverImageAlt || b.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <h2 className="mt-5 text-xl tracking-tight group-hover:underline decoration-[var(--color-yellow)] decoration-2 underline-offset-2">
                    {b.title}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-black)]/70">
                    by {b.author}
                  </p>
                  <p
                    aria-label={`Rated ${b.rating} out of 5`}
                    className="mt-2 text-base text-[var(--color-black)]"
                  >
                    <span className="text-[var(--color-yellow)]">
                      {ratingStars(b.rating).slice(0, b.rating)}
                    </span>
                    <span className="text-[var(--color-warm-gray)]">
                      {ratingStars(b.rating).slice(b.rating)}
                    </span>
                  </p>
                  {b.lastReadOn && (
                    <p className="mt-2 text-xs uppercase tracking-wider text-[var(--color-black)]/50">
                      {b.readings.length > 1 ? "Last read:" : "Read on:"}{" "}
                      <time dateTime={b.lastReadOn}>
                        {formatReadOn(b.lastReadOn)}
                      </time>
                      {b.readings.length > 1 && (
                        <span className="ml-2 text-[var(--color-black)]/40">
                          ({b.readings.length}x)
                        </span>
                      )}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Layout>
  );
}
