import Link from "next/link";
import type { GetStaticPaths, GetStaticProps } from "next";
import Layout from "@/components/Layout";
import { getAllBooks, getAllBookSlugs, getBookBySlug } from "@/lib/books";
import {
  formatReadOn,
  getRelatedBooks,
  ratingStars,
  type Book,
  type BookMeta,
} from "@/lib/book-utils";

type Props = { book: Book; related: BookMeta[] };

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: getAllBookSlugs().map((slug) => ({ params: { slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  const book = await getBookBySlug(slug);
  const related = getRelatedBooks(book, getAllBooks(), 3);
  return { props: { book, related } };
};

export default function BookReviewPage({ book, related }: Props) {
  return (
    <Layout
      title={book.title}
      description={`Review of "${book.title}" by ${book.author}`}
      path={`/books/${book.slug}/`}
      ogImage={book.coverImage}
      ogImageAlt={book.coverImageAlt || book.title}
      ogType="article"
    >
      <article className="pb-24">
        {/* Breadcrumb */}
        <div className="max-w-6xl mx-auto px-6 lg:px-10 pt-12 pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
            <Link href="/books/" className="hover:underline">
              Book Reviews
            </Link>
          </p>
        </div>

        <section className="max-w-6xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 items-start">
            {/* Cover (sticky on desktop) */}
            {book.coverImage && (
              <div className="md:col-span-5">
                <div className="md:sticky md:top-24">
                  <div className="aspect-[2/3] overflow-hidden rounded-xl bg-[var(--color-warm-gray)] shadow-2xl max-w-sm mx-auto md:mx-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={book.coverImage}
                      alt={book.coverImageAlt || book.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* All content — metadata + review + CTA + back link */}
            <div
              className={book.coverImage ? "md:col-span-7" : "md:col-span-12"}
            >
              <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl tracking-tight">
                {book.title}
              </h1>
              <p className="mt-3 text-xl text-[var(--color-black)]/70">
                by{" "}
                <span className="font-medium text-[var(--color-black)]">
                  {book.author}
                </span>
              </p>
              <p
                aria-label={`Rated ${book.rating} out of 5`}
                className="mt-5 text-2xl"
              >
                <span className="text-[var(--color-yellow)]">
                  {ratingStars(book.rating).slice(0, book.rating)}
                </span>
                <span className="text-[var(--color-warm-gray)]">
                  {ratingStars(book.rating).slice(book.rating)}
                </span>
              </p>
              {book.readOn && (
                <p className="mt-4 text-sm uppercase tracking-wider text-[var(--color-black)]/60">
                  Read on:{" "}
                  <time dateTime={book.readOn}>{formatReadOn(book.readOn)}</time>
                </p>
              )}

              {/* Review */}
              {book.reviewHtml.trim() && (
                <div
                  className="blog-content mt-10"
                  dangerouslySetInnerHTML={{ __html: book.reviewHtml }}
                />
              )}

              {/* Amazon CTA */}
              {book.amazonLink && (
                <div className="mt-12 pt-8 border-t border-[var(--color-warm-gray)]">
                  <a
                    href={book.amazonLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-[var(--color-black)] text-[var(--color-yellow)] px-6 py-3 text-sm font-semibold rounded-full hover:bg-[var(--color-off-white)] hover:text-[var(--color-black)] transition-colors"
                  >
                    Get the book →
                  </a>
                  <p className="mt-4 text-xs text-[var(--color-black)]/60 italic">
                    As an Amazon Associate, I earn from qualifying purchases at
                    no extra cost to you.
                  </p>
                </div>
              )}

              </div>
          </div>
        </section>

        {/* Related books */}
        {related.length > 0 && (
          <section className="max-w-6xl mx-auto px-6 lg:px-10 mt-20 pt-12 border-t border-[var(--color-warm-gray)]">
            <h2 className="text-2xl sm:text-3xl tracking-tight">
              You may also like
            </h2>
            <ul className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
              {related.map((b) => (
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
                    <h3 className="mt-4 text-base sm:text-lg tracking-tight group-hover:underline decoration-[var(--color-yellow)] decoration-2 underline-offset-2 line-clamp-2">
                      {b.title}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--color-black)]/70">
                      by {b.author}
                    </p>
                    <p
                      aria-label={`Rated ${b.rating} out of 5`}
                      className="mt-1 text-sm"
                    >
                      <span className="text-[var(--color-yellow)]">
                        {ratingStars(b.rating).slice(0, b.rating)}
                      </span>
                      <span className="text-[var(--color-warm-gray)]">
                        {ratingStars(b.rating).slice(b.rating)}
                      </span>
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Back link */}
        <div className="max-w-6xl mx-auto px-6 lg:px-10 mt-16">
          <Link
            href="/books/"
            className="inline-flex items-center text-sm font-semibold hover:text-[#4A4A4A] transition-colors"
          >
            ← Back to all book reviews
          </Link>
        </div>
      </article>
    </Layout>
  );
}
