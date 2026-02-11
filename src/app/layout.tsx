import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { DocsLayout } from "@/components/docs-layout";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getDomains } from "@/lib/tpch/load-metadata";
import { getTransformDomains } from "@/lib/tpch/transform-metadata";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TPCH Docs",
  description: "Documentation for TPCH load and table definitions",
};

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

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <TooltipProvider>
            <DocsLayout
              loadDomains={sidebarLoadDomains}
              transformDomains={sidebarTransformDomains}
            >
              {children}
            </DocsLayout>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
