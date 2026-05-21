import Head from "next/head";
import { NextSeo } from "next-seo";
import { ReactNode } from "react";
import Navigation from "./Navigation";
import Footer from "./Footer";
import { buildSeo, PageSeo } from "@/lib/seoConfig";

type LayoutProps = PageSeo & {
  children: ReactNode;
  jsonLd?: object;
  noIndex?: boolean;
};

export default function Layout({
  children,
  title,
  description,
  path,
  ogImage,
  ogImageAlt,
  ogType,
  jsonLd,
  noIndex = false,
}: LayoutProps) {
  const seo = buildSeo({
    title,
    description,
    path,
    ogImage,
    ogImageAlt,
    ogType,
  });

  return (
    <>
      <NextSeo {...seo} noindex={noIndex} nofollow={noIndex} />
      <Head>
        <meta
          name="robots"
          content={noIndex ? "noindex, nofollow" : "index, follow"}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
      </Head>
      <Navigation />
      <main className="pt-16 min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
