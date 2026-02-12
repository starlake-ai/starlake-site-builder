import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getDomain,
  getTableJson,
  getTableRelationsJson,
} from "@/lib/tpch/load-metadata";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs, PrevNextNav } from "@/components/breadcrumbs";
import { TableDetails } from "@/components/load-table-details";

import { constructMetadata } from "@/lib/seo-config";

interface PageProps {
  params: Promise<{ domain: string; table: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { domain, table } = await params;
  return constructMetadata({
    title: `${table} | Load | ${domain}`,
    description: `View details and structure for the ${table} table within the ${domain} domain in Starlake.`,
  });
}

export default async function TablePage({ params }: PageProps) {
  const { domain: domainSlug, table: tableSlug } = await params;
  const domain = getDomain(domainSlug);
  if (!domain) notFound();
  const tableMeta = domain.tables.find((t) => t.name === tableSlug);
  if (!tableMeta) notFound();

  const tableJson = getTableJson(domainSlug, tableSlug);
  const tableRelationsJson = getTableRelationsJson(domainSlug, tableSlug);

  const tableIndex = domain.tables.findIndex((t) => t.name === tableSlug);
  const previousTable =
    tableIndex > 0 ? domain.tables[tableIndex - 1] : null;
  const nextTable =
    tableIndex >= 0 && tableIndex < domain.tables.length - 1
      ? domain.tables[tableIndex + 1]
      : null;

  return (
    <div className="space-y-8">
      <div>
        <Breadcrumbs
          items={[
            { label: "Load", href: "/load" },
            { label: domainSlug, href: `/load/${domainSlug}` },
            { label: tableSlug },
          ]}
        />
        <h1 className="mt-2 text-3xl font-bold tracking-tight capitalize">
          {tableSlug}
        </h1>
        <p className="text-muted-foreground mt-2">
          Table definition for {domainSlug}.{tableSlug}
        </p>
      </div>

      {tableJson && (
        <Card>
          <CardHeader>
            <CardTitle>Table details</CardTitle>
          </CardHeader>
          <CardContent>
            <TableDetails
              tableName={tableSlug}
              tableJson={tableJson}
              relationsJson={tableRelationsJson}
            />
          </CardContent>
        </Card>
      )}

      {!tableJson && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No table data available for {domainSlug}.{tableSlug}.
          </CardContent>
        </Card>
      )}
      <PrevNextNav
        previous={
          previousTable && {
            label: previousTable.name,
            href: `/load/${domainSlug}/${previousTable.name}`,
          }
        }
        next={
          nextTable && {
            label: nextTable.name,
            href: `/load/${domainSlug}/${nextTable.name}`,
          }
        }
      />
    </div>
  );
}
