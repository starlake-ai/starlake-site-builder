"use client";

import type { LoadDomain, TransformDomain } from "@/components/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface SidebarContentProps {
  loadDomains: LoadDomain[];
  transformDomains: TransformDomain[];
  onLinkClick?: () => void;
}

export function SidebarContent({
  loadDomains,
  transformDomains,
  onLinkClick,
}: SidebarContentProps) {
  const pathname = usePathname();
  const path = pathname.replace(/\/$/, "") || "/";
  const [loadOpen, setLoadOpen] = useState(false);
  const [transformOpen, setTransformOpen] = useState(false);
  const [openDomains, setOpenDomains] = useState<Record<string, boolean>>({});
  const [openTransformDomains, setOpenTransformDomains] = useState<
    Record<string, boolean>
  >({});

  // Auto-expand sidebar sections based on path
  useEffect(() => {
    if (path.startsWith("/load")) {
      setLoadOpen(true);
      const parts = path.split("/");
      if (parts.length >= 3) {
        const domainName = parts[2];
        setOpenDomains((prev) => ({ ...prev, [domainName]: true }));
      }
    } else if (path.startsWith("/transform")) {
      setTransformOpen(true);
      const parts = path.split("/");
      if (parts.length >= 3) {
        const domainName = parts[2];
        setOpenTransformDomains((prev) => ({ ...prev, [domainName]: true }));
      }
    }
  }, [path]);

  const toggleDomain = (domain: string) => {
    setOpenDomains((prev) => ({ ...prev, [domain]: !prev[domain] }));
  };
  const toggleTransformDomain = (domain: string) => {
    setOpenTransformDomains((prev) => ({ ...prev, [domain]: !prev[domain] }));
  };

  const isLoadActive = path === "/load";
  const isDomainActive = (domain: string) => path === `/load/${domain}`;
  const isTableActive = (domain: string, table: string) =>
    path === `/load/${domain}/${table}`;

  const isTransformActive = path === "/transform";
  const isTransformDomainActive = (domain: string) =>
    path === `/transform/${domain}`;
  const isTransformTaskActive = (domain: string, task: string) =>
    path === `/transform/${domain}/${task}`;

  return (
    <ScrollArea className="h-full flex-1">
      <nav className="flex flex-col gap-1 p-3">
        <Collapsible open={loadOpen} onOpenChange={setLoadOpen}>
          <div className="flex items-center gap-1.5">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex size-7 items-center justify-center rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
                aria-expanded={loadOpen}
              >
                {loadOpen ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </button>
            </CollapsibleTrigger>
            <Link
              href="/load"
              onClick={onLinkClick}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-sm font-bold tracking-tight transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isLoadActive ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" : "text-foreground/70"
              )}
            >
              Load
            </Link>
          </div>
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-300">
            <div className="ml-3.5 mt-1.5 flex flex-col gap-1 border-l border-sidebar-border/60 pl-3">
              {loadDomains.map((domain) => {
                const domainOpen = openDomains[domain.name] ?? false;
                return (
                  <Collapsible
                    key={domain.name}
                    open={domainOpen}
                    onOpenChange={() => toggleDomain(domain.name)}
                  >
                    <div className="flex items-center gap-1.5 py-0.5">
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex size-6 items-center justify-center rounded-md hover:bg-sidebar-accent transition-all duration-200"
                          aria-expanded={domainOpen}
                        >
                          {domainOpen ? (
                            <ChevronDown className="size-3.5" />
                          ) : (
                            <ChevronRight className="size-3.5" />
                          )}
                        </button>
                      </CollapsibleTrigger>
                      <Link
                        href={`/load/${domain.name}`}
                        onClick={onLinkClick}
                        title={domain.name}
                        className={cn(
                          "min-w-0 flex-1 wrap-break-word rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          isDomainActive(domain.name) ?
                            "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {domain.name}
                      </Link>
                    </div>
                    <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 overflow-hidden duration-300">
                      <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-sidebar-border/40 pl-3.5">
                        {domain.tables.map((table) => (
                          <Link
                            key={table.name}
                            href={`/load/${domain.name}/${table.name}`}
                            onClick={onLinkClick}
                            title={table.name}
                            className={cn(
                              "block min-w-0 wrap-break-word rounded-lg px-3 py-1.5 text-[13px] transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              isTableActive(domain.name, table.name)
                                ? "bg-sidebar-accent/80 text-sidebar-accent-foreground font-bold shadow-sm"
                                : "text-muted-foreground/80 hover:text-foreground"
                            )}
                          >
                            {table.name}
                          </Link>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={transformOpen} onOpenChange={setTransformOpen}>
          <div className="flex items-center gap-1.5">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex size-7 items-center justify-center rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
                aria-expanded={transformOpen}
              >
                {transformOpen ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </button>
            </CollapsibleTrigger>
            <Link
              href="/transform"
              onClick={onLinkClick}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-sm font-bold tracking-tight transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isTransformActive ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" : "text-foreground/70"
              )}
            >
              Transform
            </Link>
          </div>
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200">
            <div className="ml-3.5 mt-1.5 flex flex-col gap-1 border-l border-sidebar-border/60 pl-3">
              {transformDomains.map((domain) => {
                const domainOpen = openTransformDomains[domain.name] ?? false;
                return (
                  <Collapsible
                    key={domain.name}
                    open={domainOpen}
                    onOpenChange={() => toggleTransformDomain(domain.name)}
                  >
                    <div className="flex items-center gap-1.5 py-0.5">
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex size-6 items-center justify-center rounded-md hover:bg-sidebar-accent transition-all duration-200"
                          aria-expanded={domainOpen}
                        >
                          {domainOpen ? (
                            <ChevronDown className="size-3.5" />
                          ) : (
                            <ChevronRight className="size-3.5" />
                          )}
                        </button>
                      </CollapsibleTrigger>
                      <Link
                        href={`/transform/${domain.name}`}
                        onClick={onLinkClick}
                        title={domain.name}
                        className={cn(
                          "min-w-0 flex-1 wrap-break-word rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          isTransformDomainActive(domain.name) ?
                            "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {domain.name}
                      </Link>
                    </div>
                    <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 overflow-hidden duration-300">
                      <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-sidebar-border/40 pl-3.5">
                        {domain.tasks.map((task: { name: string }) => (
                          <Link
                            key={task.name}
                            href={`/transform/${domain.name}/${task.name}`}
                            onClick={onLinkClick}
                            title={task.name}
                            className={cn(
                              "block min-w-0 wrap-break-word rounded-lg px-3 py-1.5 text-[13px] transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              isTransformTaskActive(domain.name, task.name)
                                ? "bg-sidebar-accent/80 text-sidebar-accent-foreground font-bold shadow-sm"
                                : "text-muted-foreground/80 hover:text-foreground"
                            )}
                          >
                            {task.name}
                          </Link>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </nav>
    </ScrollArea>
  );
}
