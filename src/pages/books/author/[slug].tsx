import Link from "next/link";
import type { GetStaticPaths, GetStaticProps } from "next";
import Layout from "@/components/Layout";
import AuthorTag from "@/components/AuthorTag";
import StarRating from "@/components/StarRating";
import { getAllBooks } from "@/lib/books";
import {
  authorSlug,
  formatReadOn,
  getRelatedAuthors,
  type AuthorSummary,
  type BookMeta,
} from "@/lib/book-utils";

type Props = {
  author: string;
  authorPhoto: string;
  authorPhotoAlt: string;
  books: BookMeta[];
  relatedAuthors: AuthorSummary[];
};

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = new Set<string>();
  for (const b of getAllBooks()) {
    const s = authorSlug(b.author);
    if (s) slugs.add(s);
  }
  return {
    paths: Array.from(slugs).map((slug) => ({ params: { slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "");
  const all = getAllBooks();
  const matching = all.filter((b) => authorSlug(b.author) === slug);
  if (matching.length === 0) return { notFound: true };

  // Display name: take the most recent book's spelling of the author.
  // Same for the photo (in case the user added a photo later but not on
  // older books).
  const display = matching[0];
  const withPhoto = matching.find((b) => b.authorPhoto);

  return {
    props: {
      author: display.author,
      authorPhoto: withPhoto?.authorPhoto ?? "",
      authorPhotoAlt: withPhoto?.authorPhotoAlt ?? "",
      books: matching,
      relatedAuthors: getRelatedAuthors(display.author, all, 4),
    },
  };
};

export default function AuthorPage({
  author,
  authorPhoto,
  authorPhotoAlt,
  books,
  relatedAuthors,
}: Props) {
  const count = books.length;
  return (
    <Layout
      title={`Books by ${author}`}
      description={`Every book by ${author} that Matthew Malan has read, with star ratings and review notes.`}
      path={`/books/author/${authorSlug(author)}/`}
      ogImage="/og/books.png"
    >
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 sm:pt-20 pb-10 sm:pb-12">
        <Link
          href="/books/"
          className="text-sm font-semibold text-[var(--color-black)]/60 hover:text-[var(--color-black)]"
        >
          ← Back to all books
        </Link>
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
          {authorPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={authorPhoto}
              alt={authorPhotoAlt || author}
              className="w-40 h-40 sm:w-56 sm:h-56 lg:w-64 lg:h-64 rounded-full object-cover ring-4 ring-[var(--color-warm-gray)] shadow-xl flex-shrink-0"
              loading="lazy"
            />
          ) : (
            <span
              aria-hidden="true"
              className="w-40 h-40 sm:w-56 sm:h-56 lg:w-64 lg:h-64 rounded-full bg-[var(--color-warm-gray)]/40 text-[var(--color-black)]/70 inline-flex items-center justify-center text-5xl sm:text-6xl font-semibold ring-4 ring-[var(--color-warm-gray)] flex-shrink-0"
            >
              {author
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase() ?? "")
                .join("")}
            </span>
          )}
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
              Books by
            </p>
            <h1 className="mt-2 text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.05]">
              <span className="bg-[var(--color-yellow)] px-2">{author}</span>
            </h1>
            <p className="mt-3 text-sm text-[var(--color-black)]/60">
              {count} {count === 1 ? "book" : "books"} read.
            </p>
          </div>
        </div>
      </section>

      {/* Book grid */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-24">
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
          {books.map((b) => (
            <li key={b.slug} className="group">
              <Link href={`/books/${b.slug}/`} className="block">
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
              </Link>
              <div className="mt-1.5 text-sm text-[var(--color-black)]/70">
                <AuthorTag
                  name={b.author}
                  photo={b.authorPhoto}
                  photoAlt={b.authorPhotoAlt}
                  size="sm"
                />
              </div>
              <div className="mt-1.5 text-sm">
                <StarRating rating={b.rating} />
              </div>
              {b.lastReadOn && (
                <p className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-[var(--color-black)]/50">
                  {b.readings.length > 1 ? "Last read:" : "Read on:"}{" "}
                  <time dateTime={b.lastReadOn}>
                    {formatReadOn(b.lastReadOn)}
                  </time>
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* "If you liked X" — yellow shelf, visually distinct from the
          dark footer. Hidden when the library is too thin to recommend. */}
      {relatedAuthors.length > 0 && (
        <section className="relative bg-[var(--color-yellow)] text-[var(--color-black)] overflow-hidden">
          {/* Black accent strip top + bottom for shelf feel */}
          <div
            aria-hidden="true"
            className="absolute top-0 left-0 right-0 h-1 bg-[var(--color-black)]"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--color-black)]"
          />
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 sm:py-20">
            <div className="flex items-end justify-between gap-4 flex-wrap mb-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-black)]/70">
                  If you liked {author.split(/\s+/)[0]}
                </p>
                <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-5xl tracking-tight max-w-2xl leading-[1.05]">
                  Authors with similar themes.
                </h2>
              </div>
              <span
                aria-hidden="true"
                className="hidden sm:inline-block text-7xl lg:text-8xl leading-none text-[var(--color-black)]/15 select-none"
              >
                ✦
              </span>
            </div>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {relatedAuthors.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/books/author/${a.slug}/`}
                    className="group flex flex-col items-center text-center bg-[var(--color-off-white)] rounded-2xl px-4 py-6 ring-2 ring-[var(--color-black)] shadow-[6px_6px_0_var(--color-black)] hover:shadow-[10px_10px_0_var(--color-black)] hover:-translate-x-1 hover:-translate-y-1 transition-all"
                  >
                    {a.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.photo}
                        alt={a.photoAlt || a.name}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-2 ring-[var(--color-black)]"
                        loading="lazy"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[var(--color-warm-gray)]/30 text-[var(--color-black)]/70 inline-flex items-center justify-center text-2xl font-bold ring-2 ring-[var(--color-black)]"
                      >
                        {a.name
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((p) => p[0]?.toUpperCase() ?? "")
                          .join("")}
                      </span>
                    )}
                    <h3 className="mt-4 font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--color-black)] leading-tight">
                      {a.name}
                    </h3>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-black)]/60">
                      {a.bookCount} {a.bookCount === 1 ? "book" : "books"} read
                    </p>
                    {a.sharedTags.length > 0 && (
                      <p className="mt-2 text-xs text-[var(--color-black)]/70 line-clamp-2">
                        {a.sharedTags.slice(0, 3).join(" · ")}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </Layout>
  );
}
