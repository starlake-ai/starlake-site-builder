import Link from "next/link";
import { getDomains } from "@/lib/tpch/load-metadata";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Breadcrumbs } from "@/components/breadcrumbs";

export default function LoadPage() {
  const domains = getDomains();

  return (
    <div className="space-y-8">
      <div>
        <Breadcrumbs items={[{ label: "Load" }]} />
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Load</h1>
        <p className="text-muted-foreground mt-2">
          Domains and tables available for load. Select a domain to view its
          tables.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {domains.map((domain) => (
          <Link
            key={domain.name}
            href={`/load/${domain.name}`}
            className="transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl"
          >
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="capitalize">{domain.name}</CardTitle>
                <CardDescription>
                  {domain.tables.length} table
                  {domain.tables.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground flex flex-wrap gap-x-2 gap-y-1">
                  {domain.tables.slice(0, 5).map((t) => (
                    <li key={t.name}>{t.name}</li>
                  ))}
                  {domain.tables.length > 5 && (
                    <li>+{domain.tables.length - 5} more</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
