export const siteConfig = {
  name: "Matthew Malan",
  domain: "https://matthewmalan.com",
  title: "Matthew Malan — Public Speaker & Podcast Host",
  description:
    "Matthew Malan is a public speaker and podcast host exploring leadership, creativity, and the conversations that shape how we work.",
  twitter: "@matthewmalan8",
  ogImage: "/images/og-image.webp",
};

export type PageSeo = {
  title?: string;
  description?: string;
  path?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: string;
};

function absoluteUrl(maybePath: string): string {
  if (/^https?:\/\//i.test(maybePath)) return maybePath;
  return `${siteConfig.domain}${maybePath.startsWith("/") ? "" : "/"}${maybePath}`;
}

function imageMimeType(url: string): string {
  if (/\.png(\?|$)/i.test(url)) return "image/png";
  if (/\.jpe?g(\?|$)/i.test(url)) return "image/jpeg";
  if (/\.webp(\?|$)/i.test(url)) return "image/webp";
  if (/\.gif(\?|$)/i.test(url)) return "image/gif";
  return "image/png";
}

export function buildSeo({
  title,
  description,
  path = "/",
  ogImage,
  ogImageAlt,
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
      images: [
        {
          url: image,
          secureUrl: image,
          alt: ogImageAlt ?? fullTitle,
          type: imageMimeType(image),
        },
      ],
    },
    twitter: {
      handle: siteConfig.twitter,
      site: siteConfig.twitter,
      cardType: "summary_large_image",
    },
  };
}
