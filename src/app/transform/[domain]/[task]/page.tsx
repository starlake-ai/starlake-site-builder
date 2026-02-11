import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTransformDomain,
  getTaskJson,
} from "@/lib/tpch/transform-metadata";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ domain: string; task: string }>;
}

export default async function TransformTaskPage({ params }: PageProps) {
  const { domain: domainSlug, task: taskSlug } = await params;
  const domain = getTransformDomain(domainSlug);
  if (!domain) notFound();
  const taskMeta = domain.tasks.find((t) => t.name === taskSlug);
  if (!taskMeta) notFound();

  const taskJson = getTaskJson(domainSlug, taskSlug);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href="/transform"
            className="hover:text-foreground transition-colors"
          >
            Transform
          </Link>
          <span>/</span>
          <Link
            href={`/transform/${domainSlug}`}
            className="hover:text-foreground transition-colors"
          >
            {domainSlug}
          </Link>
          <span>/</span>
          <span className="text-foreground font-mono">{taskSlug}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mt-2 font-mono">
          {taskSlug}
        </h1>
        <p className="text-muted-foreground mt-2">
          Task definition for {domainSlug}.{taskSlug}
        </p>
      </div>

      {taskJson && (
        <Card>
          <CardHeader>
            <CardTitle>Schema & metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="rounded-lg border bg-muted/50 p-4 text-sm overflow-x-auto">
              {JSON.stringify(taskJson, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {!taskJson && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No task data available for {domainSlug}.{taskSlug}.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
