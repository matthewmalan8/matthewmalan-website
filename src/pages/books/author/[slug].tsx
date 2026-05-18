import Link from "next/link";
import type { GetStaticPaths, GetStaticProps } from "next";
import Layout from "@/components/Layout";
import AuthorTag from "@/components/AuthorTag";
import StarRating from "@/components/StarRating";
import { getAllBooks } from "@/lib/books";
import {
  authorSlug,
  formatReadOn,
  type BookMeta,
} from "@/lib/book-utils";

type Props = {
  author: string;
  authorPhoto: string;
  authorPhotoAlt: string;
  books: BookMeta[];
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
    },
  };
};

export default function AuthorPage({
  author,
  authorPhoto,
  authorPhotoAlt,
  books,
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
    </Layout>
  );
}
