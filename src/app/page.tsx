import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Starlake Docs</h1>
        <p className="text-muted-foreground mt-2">
          Documentation for load domains, table definitions, and transform
          tasks.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/load"
          className="transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl"
        >
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle>Load</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Browse domains and tables. View schema and metadata for each
                table.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link
          href="/transform"
          className="transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl"
        >
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle>Transform</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Browse task domains and transforms. View definition and metadata
                for each task.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
