import Link from "next/link";
import { notFound } from "next/navigation";
import { getDomain, getTableJson } from "@/lib/tpch/load-metadata";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ domain: string; table: string }>;
}

export default async function TablePage({ params }: PageProps) {
  const { domain: domainSlug, table: tableSlug } = await params;
  const domain = getDomain(domainSlug);
  if (!domain) notFound();
  const tableMeta = domain.tables.find((t) => t.name === tableSlug);
  if (!tableMeta) notFound();

  const tableJson = getTableJson(domainSlug, tableSlug);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/load" className="hover:text-foreground transition-colors">
            Load
          </Link>
          <span>/</span>
          <Link
            href={`/load/${domainSlug}`}
            className="hover:text-foreground transition-colors"
          >
            {domainSlug}
          </Link>
          <span>/</span>
          <span className="text-foreground">{tableSlug}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mt-2 capitalize">
          {tableSlug}
        </h1>
        <p className="text-muted-foreground mt-2">
          Table definition for {domainSlug}.{tableSlug}
        </p>
      </div>

      {tableJson && (
        <Card>
          <CardHeader>
            <CardTitle>Schema & metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="rounded-lg border bg-muted/50 p-4 text-sm overflow-x-auto">
              {JSON.stringify(tableJson, null, 2)}
            </pre>
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
    </div>
  );
}
