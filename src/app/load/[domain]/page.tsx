import Link from "next/link";
import { notFound } from "next/navigation";
import { getDomain, getDomains } from "@/lib/tpch/load-metadata";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Breadcrumbs, PrevNextNav } from "@/components/breadcrumbs";

import { Metadata } from "next";
import { constructMetadata } from "@/lib/seo-config";

interface PageProps {
  params: Promise<{ domain: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { domain } = await params;
  return constructMetadata({
    title: `${domain} | Load`,
    description: `Explore all tables and data definitions within the ${domain} domain in Starlake.`,
  });
}

export default async function DomainPage({ params }: PageProps) {
  const { domain: domainSlug } = await params;
  const domain = getDomain(domainSlug);
  if (!domain) notFound();

  const domains = getDomains();
  const domainIndex = domains.findIndex((d) => d.name === domainSlug);
  const previousDomain =
    domainIndex > 0 ? domains[domainIndex - 1] : null;
  const nextDomain =
    domainIndex >= 0 && domainIndex < domains.length - 1
      ? domains[domainIndex + 1]
      : null;

  return (
    <div className="space-y-8">
      <div>
        <Breadcrumbs
          items={[
            { label: "Load", href: "/load" },
            { label: domainSlug },
          ]}
        />
        <h1 className="mt-2 text-3xl font-bold tracking-tight capitalize">
          {domain.name}
        </h1>
        <p className="text-muted-foreground mt-2">
          Tables in this domain. Select a table to view its definition.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {domain.tables.map((table) => (
          <Link
            key={table.name}
            href={`/load/${domain.name}/${table.name}`}
            className="transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl"
          >
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="capitalize">{table.name}</CardTitle>
                <CardDescription>Table definition</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View schema and metadata for {domain.name}.{table.name}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <PrevNextNav
        previous={
          previousDomain && {
            label: previousDomain.name,
            href: `/load/${previousDomain.name}`,
          }
        }
        next={
          nextDomain && {
            label: nextDomain.name,
            href: `/load/${nextDomain.name}`,
          }
        }
      />
    </div>
  );
}
