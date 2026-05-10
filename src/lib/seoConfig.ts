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
  ogImage?: string;
  ogType?: string;
};

function absoluteUrl(maybePath: string): string {
  if (/^https?:\/\//i.test(maybePath)) return maybePath;
  return `${siteConfig.domain}${maybePath.startsWith("/") ? "" : "/"}${maybePath}`;
}

export function buildSeo({
  title,
  description,
  path = "/",
  ogImage,
  ogType = "website",
}: PageSeo = {}) {
  const url = `${siteConfig.domain}${path}`;
  const fullTitle = title ? `${title} — ${siteConfig.name}` : siteConfig.title;
  const desc = description ?? siteConfig.description;
  const image = absoluteUrl(ogImage ?? siteConfig.ogImage);

  return {
    title: fullTitle,
    description: desc,
    canonical: url,
    openGraph: {
      type: ogType,
      url,
      title: fullTitle,
      description: desc,
      site_name: siteConfig.name,
      images: [{ url: image }],
    },
    twitter: {
      handle: siteConfig.twitter,
      site: siteConfig.twitter,
      cardType: "summary_large_image",
    },
  };
}
