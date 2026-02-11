import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Database, Workflow, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="space-y-12 py-8 max-w-5xl mx-auto">
      <div className="space-y-6 text-center sm:text-left">
        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm">
          <Sparkles className="mr-2 h-3.5 w-3.5" />
          Documentation v2.0
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-balance bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent pb-1">
          TPCH Data Documentation
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl text-balance leading-relaxed">
          Comprehensive documentation for load domains, table definitions, and transform tasks. 
          Navigate through your data infrastructure with ease.
        </p>
        
        <div className="flex flex-wrap gap-4 pt-2 justify-center sm:justify-start">
          <Button asChild size="lg" className="rounded-full shadow-lg shadow-primary/25">
            <Link href="/load">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-primary/5">
            <Link href="/transform">
              View Transforms
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Link
          href="/load"
          className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
        >
          <div className="h-full glass-card rounded-2xl p-6 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:border-primary/30 group-hover:bg-card/80">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">Load Domains</h3>
            <p className="text-muted-foreground leading-relaxed">
              Explore data ingestion layers. View schema definitions, column types, and metadata for each table in your load domains.
            </p>
          </div>
        </Link>

        <Link
          href="/transform"
          className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
        >
          <div className="h-full glass-card rounded-2xl p-6 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:border-primary/30 group-hover:bg-card/80">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300 dark:text-indigo-400">
              <Workflow className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-500 transition-colors dark:group-hover:text-indigo-400">Transform Tasks</h3>
            <p className="text-muted-foreground leading-relaxed">
              Understand data transformation logic. Browse task domains, dependencies, and execution details for your ETL pipelines.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
