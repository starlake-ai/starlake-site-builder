"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, Database, Workflow } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { LoadDomain, TransformDomain } from "@/components/sidebar";

const MAX_ITEM_LENGTH = 50;

interface SidebarItemProps {
  name: string;
  href: string;
  isActive: boolean;
  onClick?: () => void;
  hasActiveIndicator?: boolean;
}

const SidebarItem = ({
  name,
  href,
  isActive,
  onClick,
  hasActiveIndicator = false,
}: SidebarItemProps) => {
  const isTruncated = name.length > MAX_ITEM_LENGTH;

  const content = (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative block min-w-0 rounded-md px-2 py-1 text-sm transition-colors hover:text-primary animate-in slide-in-from-left-2 fade-in duration-300",
        isActive
          ? hasActiveIndicator
            ? "text-primary font-medium bg-primary/5"
            : "bg-primary/5 text-primary"
          : "text-foreground/70 hover:bg-primary/5"
      )}
    >
      {isActive && hasActiveIndicator && (
        <span className="absolute left-0 top-1/2 -translate-x-[calc(0.75rem_+_1px)] -translate-y-1/2 h-4 w-0.5 rounded-full bg-primary" />
      )}
      <span className="block truncate w-full">{name}</span>
    </Link>
  );

  if (isTruncated) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">
          <p>{name}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};

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
    <ScrollArea className="h-full flex-1 py-4 pr-3">
      <nav className="flex flex-col gap-4 p-3">
        {/* Load Section */}
        <Collapsible open={loadOpen} onOpenChange={setLoadOpen} className="group/root">
          <div className="flex items-center gap-2 px-2 py-1">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors"
                aria-expanded={loadOpen}
              >
                {loadOpen ? (
                  <ChevronDown className="size-3.5" />
                ) : (
                  <ChevronRight className="size-3.5" />
                )}
              </button>
            </CollapsibleTrigger>
            <Link
              href="/load"
              onClick={onLinkClick}
              className={cn(
                "flex-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold transition-all duration-200 hover:bg-primary/5 hover:text-primary",
                isLoadActive ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20" : "text-foreground/80"
              )}
            >
              <Database className="size-4 shrink-0" />
              Load
            </Link>
          </div>
          
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200">
            <div className="ml-2 mt-1 flex flex-col gap-0.5 border-l border-border/40 pl-2">
              {loadDomains.map((domain) => {
                const domainOpen = openDomains[domain.name] ?? true;
                return (
                  <Collapsible
                    key={domain.name}
                    open={domainOpen}
                    onOpenChange={() => toggleDomain(domain.name)}
                    className="group/domain animate-in slide-in-from-left-2 fade-in duration-300"
                  >
                    <div className="flex items-center gap-1 py-0.5">
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors"
                          aria-expanded={domainOpen}
                        >
                          {domainOpen ? (
                            <ChevronDown className="size-3" />
                          ) : (
                            <ChevronRight className="size-3" />
                          )}
                        </button>
                      </CollapsibleTrigger>
                      <SidebarItem
                        name={domain.name}
                        href={`/load/${domain.name}`}
                        isActive={isDomainActive(domain.name)}
                        onClick={onLinkClick}
                      />
                    </div>
                    <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 overflow-hidden duration-150">
                      <div className="ml-3 flex flex-col border-l border-border/30 pl-2 pt-0.5 pb-1">
                        {domain.tables.map((table) => (
                          <SidebarItem
                            key={table.name}
                            name={table.name}
                            href={`/load/${domain.name}/${table.name}`}
                            isActive={isTableActive(domain.name, table.name)}
                            onClick={onLinkClick}
                            hasActiveIndicator
                          />
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Transform Section */}
        <Collapsible open={transformOpen} onOpenChange={setTransformOpen} className="group/root">
          <div className="flex items-center gap-2 px-2 py-1">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors"
                aria-expanded={transformOpen}
              >
                {transformOpen ? (
                  <ChevronDown className="size-3.5" />
                ) : (
                  <ChevronRight className="size-3.5" />
                )}
              </button>
            </CollapsibleTrigger>
            <Link
              href="/transform"
              onClick={onLinkClick}
              className={cn(
                "flex-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold transition-all duration-200 hover:bg-primary/5 hover:text-primary",
                isTransformActive ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20" : "text-foreground/80"
              )}
            >
              <Workflow className="size-4 shrink-0" />
              Transform
            </Link>
          </div>

          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200">
            <div className="ml-2 mt-1 flex flex-col gap-0.5 border-l border-border/40 pl-2">
              {transformDomains.map((domain) => {
                const domainOpen = openTransformDomains[domain.name] ?? true;
                return (
                  <Collapsible
                    key={domain.name}
                    open={domainOpen}
                    onOpenChange={() => toggleTransformDomain(domain.name)}
                    className="group/domain animate-in slide-in-from-left-2 fade-in duration-300"
                  >
                    <div className="flex items-center gap-1 py-0.5">
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors"
                          aria-expanded={domainOpen}
                        >
                          {domainOpen ? (
                            <ChevronDown className="size-3" />
                          ) : (
                            <ChevronRight className="size-3" />
                          )}
                        </button>
                      </CollapsibleTrigger>
                      <SidebarItem
                        name={domain.name}
                        href={`/transform/${domain.name}`}
                        isActive={isTransformDomainActive(domain.name)}
                        onClick={onLinkClick}
                      />
                    </div>
                    <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 overflow-hidden duration-150">
                      <div className="ml-3 flex flex-col border-l border-border/30 pl-2 pt-0.5 pb-1">
                        {domain.tasks.map((task) => (
                          <SidebarItem
                            key={task.name}
                            name={task.name}
                            href={`/transform/${domain.name}/${task.name}`}
                            isActive={isTransformTaskActive(domain.name, task.name)}
                            onClick={onLinkClick}
                            hasActiveIndicator
                          />
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
