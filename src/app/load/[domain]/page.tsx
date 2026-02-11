import Link from "next/link";
import { notFound } from "next/navigation";
import { getDomain } from "@/lib/tpch/load-metadata";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PageProps {
  params: Promise<{ domain: string }>;
}

export default async function DomainPage({ params }: PageProps) {
  const { domain: domainSlug } = await params;
  const domain = getDomain(domainSlug);
  if (!domain) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/load"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Load
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mt-2 capitalize">
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
    </div>
  );
}
