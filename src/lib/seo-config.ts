import { Metadata } from "next";

export const siteConfig = {
  name: "Starlake Docs",
  description: "A.I. Powered Data Integration Platform. Transform your data with Starlake's open-source platform. Build scalable data pipelines, automate data integration, and ensure data quality.",
  url: "https://starlake.ai",
  ogImage: "/main-starlake.webp",
  links: {
    twitter: "https://twitter.com/starlake_ai",
    github: "https://github.com/starlake-ai/starlake",
  },
  keywords: [
    "ETL",
    "data integration",
    "open source",
    "data transformation",
    "data quality",
    "data pipelines",
    "data orchestration",
    "OLTP",
    "OLAP",
    "Starlake",
    "Documentation"
  ],
};

export function constructMetadata({
  title = siteConfig.name,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  noIndex = false,
}: {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
} = {}): Metadata {
  return {
    title: {
      default: title,
      template: `%s | ${siteConfig.name}`,
    },
    description,
    keywords: siteConfig.keywords,
    authors: [
      {
        name: "Starlake Team",
        url: siteConfig.url,
      },
    ],
    creator: "Starlake",
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteConfig.url,
      title,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@starlake_ai",
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/favicon.ico",
    },
    metadataBase: new URL(siteConfig.url),
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}
