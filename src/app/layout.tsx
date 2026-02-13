import { DocsLayout } from "@/components/docs-layout";
import { ThemeProvider } from "@/components/theme-provider";
import { getDomains } from "@/lib/metadata/load-metadata";
import { getTransformDomains } from "@/lib/metadata/transform-metadata";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { constructMetadata } from "@/lib/seo-config";

export const metadata: Metadata = constructMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const loadDomains = getDomains();
  const transformDomains = getTransformDomains();
  const sidebarLoadDomains = loadDomains.map((d) => ({
    name: d.name,
    tables: d.tables.map((t) => ({ name: t.name })),
  }));
  const sidebarTransformDomains = transformDomains.map((d) => ({
    name: d.name,
    tasks: d.tasks.map((t) => ({ name: t.name })),
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Starlake Docs",
    "url": "https://starlake.ai",
    "description": "Comprehensive documentation for Starlake data integration platform.",
    "publisher": {
      "@type": "Organization",
      "name": "Starlake",
      "logo": {
        "@type": "ImageObject",
        "url": "https://starlake.ai/starlake-logo.png"
      }
    }
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <NextTopLoader 
            color="rgb(var(--primary))"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px rgb(var(--primary)), 0 0 5px rgb(var(--primary))"
          />
          <DocsLayout
            loadDomains={sidebarLoadDomains}
            transformDomains={sidebarTransformDomains}
          >
            {children}
          </DocsLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
