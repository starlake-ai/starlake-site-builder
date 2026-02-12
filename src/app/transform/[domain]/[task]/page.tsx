import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTransformDomain,
  getTaskJson,
} from "@/lib/tpch/transform-metadata";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs, PrevNextNav } from "@/components/breadcrumbs";
import { TransformTaskDetails } from "@/components/transform-task-details";

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

  const taskIndex = domain.tasks.findIndex((t) => t.name === taskSlug);
  const previousTask =
    taskIndex > 0 ? domain.tasks[taskIndex - 1] : null;
  const nextTask =
    taskIndex >= 0 && taskIndex < domain.tasks.length - 1
      ? domain.tasks[taskIndex + 1]
      : null;

  return (
    <div className="space-y-8">
      <div>
        <Breadcrumbs
          items={[
            { label: "Transform", href: "/transform" },
            { label: domainSlug, href: `/transform/${domainSlug}` },
            { label: taskSlug },
          ]}
        />
        <h1 className="mt-2 text-3xl font-bold tracking-tight font-mono">
          {taskSlug}
        </h1>
        <p className="text-muted-foreground mt-2">
          Task definition for {domainSlug}.{taskSlug}
        </p>
      </div>

      {taskJson && (
        <Card>
          <CardHeader>
            <CardTitle>Task details</CardTitle>
          </CardHeader>
          <CardContent>
            <TransformTaskDetails taskName={taskSlug} taskJson={taskJson} />
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
      <PrevNextNav
        previous={
          previousTask && {
            label: previousTask.name,
            href: `/transform/${domainSlug}/${previousTask.name}`,
          }
        }
        next={
          nextTask && {
            label: nextTask.name,
            href: `/transform/${domainSlug}/${nextTask.name}`,
          }
        }
      />
    </div>
  );
}
