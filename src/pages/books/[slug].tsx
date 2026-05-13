import Link from "next/link";
import type { GetStaticPaths, GetStaticProps } from "next";
import Layout from "@/components/Layout";
import { getAllBookSlugs, getBookBySlug } from "@/lib/books";
import { formatReadOn, ratingStars, type Book } from "@/lib/book-utils";

type Props = { book: Book };

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: getAllBookSlugs().map((slug) => ({ params: { slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  const book = await getBookBySlug(slug);
  return { props: { book } };
};

export default function BookReviewPage({ book }: Props) {
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
        {/* Header */}
        <header className="bg-[var(--color-off-white)]">
          <div className="max-w-5xl mx-auto px-6 lg:px-10 pt-12 pb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-black)]/60">
              <Link href="/books/" className="hover:underline">
                Book Reviews
              </Link>
            </p>
          </div>
        </header>

        <section className="max-w-5xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">
            {/* Cover */}
            {book.coverImage && (
              <div className="md:col-span-5">
                <div className="aspect-[2/3] overflow-hidden rounded-xl bg-[var(--color-warm-gray)] shadow-2xl max-w-sm mx-auto md:mx-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={book.coverImage}
                    alt={book.coverImageAlt || book.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Details */}
            <div className={book.coverImage ? "md:col-span-7" : "md:col-span-12"}>
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
            </div>
          </div>
        </section>

        {/* Review */}
        {book.reviewHtml.trim() && (
          <section className="max-w-3xl mx-auto px-6 lg:px-10 mt-12">
            <div
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: book.reviewHtml }}
            />
          </section>
        )}

        {/* Amazon CTA */}
        {book.amazonLink && (
          <section className="max-w-3xl mx-auto px-6 lg:px-10 mt-16 pt-10 border-t border-[var(--color-warm-gray)]">
            <a
              href={book.amazonLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-[var(--color-black)] text-[var(--color-yellow)] px-6 py-3 text-sm font-semibold rounded-full hover:bg-[var(--color-off-white)] hover:text-[var(--color-black)] transition-colors"
            >
              Get the book on Amazon →
            </a>
            <p className="mt-4 text-xs text-[var(--color-black)]/60 italic">
              As an Amazon Associate, I earn from qualifying purchases at no
              extra cost to you.
            </p>
          </section>
        )}

        {/* Back link */}
        <div className="max-w-3xl mx-auto px-6 lg:px-10 mt-16">
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
