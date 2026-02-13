import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTransformDomains } from "@/lib/metadata/transform-metadata";
import { constructMetadata } from "@/lib/seo-config";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = constructMetadata({
  title: "Transform Tasks",
  description: "Browse and explore Starlake transformation tasks and data pipelines.",
});

export default function TransformPage() {
  const domains = getTransformDomains();

  return (
    <div className="space-y-8">
      <div>
        <Breadcrumbs items={[{ label: "Transform" }]} />
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Transform</h1>
        <p className="text-muted-foreground mt-2">
          Task domains and transforms. Select a domain to view its tasks.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {domains.map((domain) => (
          <Link
            key={domain.name}
            href={`/transform/${domain.name}`}
            className="transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl"
          >
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="capitalize">{domain.name}</CardTitle>
                <CardDescription>
                  {domain.tasks.length} task
                  {domain.tasks.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground flex flex-wrap gap-x-2 gap-y-1">
                  {domain.tasks.slice(0, 5).map((t) => (
                    <li key={t.name}>{t.name}</li>
                  ))}
                  {domain.tasks.length > 5 && (
                    <li>+{domain.tasks.length - 5} more</li>
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
