export const siteConfig = {
  name: "Matthew Malan",
  domain: "https://matthewmalan.com",
  title: "Matthew Malan — Public Speaker & Podcast Host",
  description:
    "Matthew Malan is a public speaker and podcast host exploring leadership, creativity, and the conversations that shape how we work.",
  twitter: "@matthewmalan",
  ogImage: "/images/og-image.webp",
};

export type PageSeo = {
  title?: string;
  description?: string;
  path?: string;
};

export function buildSeo({ title, description, path = "/" }: PageSeo = {}) {
  const url = `${siteConfig.domain}${path}`;
  const fullTitle = title ? `${title} — ${siteConfig.name}` : siteConfig.title;
  const desc = description ?? siteConfig.description;

  return {
    title: fullTitle,
    description: desc,
    canonical: url,
    openGraph: {
      type: "website",
      url,
      title: fullTitle,
      description: desc,
      site_name: siteConfig.name,
      images: [{ url: `${siteConfig.domain}${siteConfig.ogImage}` }],
    },
    twitter: {
      handle: siteConfig.twitter,
      site: siteConfig.twitter,
      cardType: "summary_large_image",
    },
  };
}
