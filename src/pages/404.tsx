import Link from "next/link";
import Layout from "@/components/Layout";

export default function NotFound() {
  return (
    <Layout
      title="404 — Page not found"
      description="The page you're looking for doesn't exist."
      path="/404/"
    >
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-24 pb-32 lg:pt-32 lg:pb-40 min-h-[70vh] flex flex-col items-start justify-center">
        <p className="font-[family-name:var(--font-display)] text-[8rem] sm:text-[12rem] leading-none tracking-tight">
          <span className="bg-[var(--color-yellow)] px-4 inline-block -rotate-1">
            404
          </span>
        </p>
        <h1 className="mt-8 text-4xl sm:text-6xl tracking-tight max-w-3xl">
          We couldn't find that page.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-[var(--color-black)]/70 leading-relaxed">
          The link might be broken or the page may have moved. Let's get you
          back to something useful.
        </p>
        <Link
          href="/"
          className="mt-10 inline-flex items-center bg-[var(--color-black)] text-[var(--color-yellow)] px-7 py-4 text-base font-semibold rounded-full hover:bg-[var(--color-lime)] hover:text-[var(--color-black)] transition-colors"
        >
          Back to home
        </Link>
      </section>
    </Layout>
  );
}
