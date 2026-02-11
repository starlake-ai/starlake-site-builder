"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { LoadDomain, TransformDomain } from "@/components/sidebar";

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
  const [loadOpen, setLoadOpen] = useState(true);
  const [transformOpen, setTransformOpen] = useState(true);
  const [openDomains, setOpenDomains] = useState<Record<string, boolean>>({});
  const [openTransformDomains, setOpenTransformDomains] = useState<
    Record<string, boolean>
  >({});

  const toggleDomain = (domain: string) => {
    setOpenDomains((prev) => ({ ...prev, [domain]: !prev[domain] }));
  };
  const toggleTransformDomain = (domain: string) => {
    setOpenTransformDomains((prev) => ({ ...prev, [domain]: !prev[domain] }));
  };

  // Only the exact current page link is active (selected), not ancestors or siblings
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
          <div className="flex items-center gap-1">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex size-7 items-center justify-center rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
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
                "flex-1 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isLoadActive && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
            >
              Load
            </Link>
          </div>
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200">
            <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-sidebar-border pl-3">
              {loadDomains.map((domain) => {
                const domainOpen = openDomains[domain.name] ?? true;
                return (
                  <Collapsible
                    key={domain.name}
                    open={domainOpen}
                    onOpenChange={() => toggleDomain(domain.name)}
                  >
                    <div className="flex items-center gap-1 py-0.5">
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex size-6 items-center justify-center rounded hover:bg-sidebar-accent transition-colors"
                          aria-expanded={domainOpen}
                        >
                          {domainOpen ? (
                            <ChevronDown className="size-3" />
                          ) : (
                            <ChevronRight className="size-3" />
                          )}
                        </button>
                      </CollapsibleTrigger>
                      <Link
                        href={`/load/${domain.name}`}
                        onClick={onLinkClick}
                        title={domain.name}
                        className={cn(
                          "min-w-0 flex-1 break-words rounded px-2 py-1 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          isDomainActive(domain.name) &&
                            "bg-sidebar-accent text-sidebar-accent-foreground"
                        )}
                      >
                        {domain.name}
                      </Link>
                    </div>
                    <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 overflow-hidden duration-150">
                      <div className="ml-4 flex flex-col gap-0.5 border-l border-sidebar-border pl-3">
                        {domain.tables.map((table) => (
                          <Link
                            key={table.name}
                            href={`/load/${domain.name}/${table.name}`}
                            onClick={onLinkClick}
                            title={table.name}
                            className={cn(
                              "block min-w-0 break-words rounded px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              isTableActive(domain.name, table.name) &&
                                "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
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
          <div className="flex items-center gap-1">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex size-7 items-center justify-center rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
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
                "flex-1 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isTransformActive &&
                  "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
            >
              Transform
            </Link>
          </div>
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200">
            <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-sidebar-border pl-3">
              {transformDomains.map((domain) => {
                const domainOpen = openTransformDomains[domain.name] ?? true;
                return (
                  <Collapsible
                    key={domain.name}
                    open={domainOpen}
                    onOpenChange={() => toggleTransformDomain(domain.name)}
                  >
                    <div className="flex items-center gap-1 py-0.5">
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex size-6 items-center justify-center rounded hover:bg-sidebar-accent transition-colors"
                          aria-expanded={domainOpen}
                        >
                          {domainOpen ? (
                            <ChevronDown className="size-3" />
                          ) : (
                            <ChevronRight className="size-3" />
                          )}
                        </button>
                      </CollapsibleTrigger>
                      <Link
                        href={`/transform/${domain.name}`}
                        onClick={onLinkClick}
                        title={domain.name}
                        className={cn(
                          "min-w-0 flex-1 break-words rounded px-2 py-1 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          isTransformDomainActive(domain.name) &&
                            "bg-sidebar-accent text-sidebar-accent-foreground"
                        )}
                      >
                        {domain.name}
                      </Link>
                    </div>
                    <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 overflow-hidden duration-150">
                      <div className="ml-4 flex flex-col gap-0.5 border-l border-sidebar-border pl-3">
                        {domain.tasks.map((task) => (
                          <Link
                            key={task.name}
                            href={`/transform/${domain.name}/${task.name}`}
                            onClick={onLinkClick}
                            title={task.name}
                            className={cn(
                              "block min-w-0 break-words rounded px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              isTransformTaskActive(domain.name, task.name) &&
                                "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
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
