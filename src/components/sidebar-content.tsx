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
import { useCallback, useEffect, useState } from "react";

interface NavDomain {
  name: string;
  items: { name: string }[];
}

interface NavSectionProps {
  label: string;
  basePath: string;
  domains: NavDomain[];
  sectionOpen: boolean;
  onSectionToggle: (open: boolean) => void;
  openDomains: Record<string, boolean>;
  onToggleDomain: (name: string) => void;
  currentPath: string;
  onLinkClick?: () => void;
}

function NavSection({
  label,
  basePath,
  domains,
  sectionOpen,
  onSectionToggle,
  openDomains,
  onToggleDomain,
  currentPath,
  onLinkClick,
}: NavSectionProps) {
  const isSectionActive = currentPath === basePath;
  const isDomainActive = (domain: string) => currentPath === `${basePath}/${domain}`;
  const isItemActive = (domain: string, item: string) =>
    currentPath === `${basePath}/${domain}/${item}`;

  return (
    <Collapsible open={sectionOpen} onOpenChange={onSectionToggle}>
      <div className="flex items-center gap-1.5">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
            aria-expanded={sectionOpen}
          >
            {sectionOpen ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        </CollapsibleTrigger>
        <Link
          href={basePath}
          onClick={onLinkClick}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-sm font-bold tracking-tight transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isSectionActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
              : "text-foreground/70"
          )}
        >
          {label}
        </Link>
      </div>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-300">
        <div className="ml-3.5 mt-1.5 flex flex-col gap-1 border-l border-sidebar-border/60 pl-3">
          {domains.map((domain) => {
            const domainOpen = openDomains[domain.name] ?? false;
            return (
              <Collapsible
                key={domain.name}
                open={domainOpen}
                onOpenChange={() => onToggleDomain(domain.name)}
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
                    href={`${basePath}/${domain.name}`}
                    onClick={onLinkClick}
                    title={domain.name}
                    className={cn(
                      "min-w-0 flex-1 wrap-break-word rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isDomainActive(domain.name)
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {domain.name}
                  </Link>
                </div>
                <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 overflow-hidden duration-300">
                  <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-sidebar-border/40 pl-3.5">
                    {domain.items.map((item) => (
                      <Link
                        key={item.name}
                        href={`${basePath}/${domain.name}/${item.name}`}
                        onClick={onLinkClick}
                        title={item.name}
                        className={cn(
                          "block min-w-0 wrap-break-word rounded-lg px-3 py-1.5 text-[13px] transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          isItemActive(domain.name, item.name)
                            ? "bg-sidebar-accent/80 text-sidebar-accent-foreground font-bold shadow-sm"
                            : "text-muted-foreground/80 hover:text-foreground"
                        )}
                      >
                        {item.name}
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
  );
}


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
  const [openLoadDomains, setOpenLoadDomains] = useState<Record<string, boolean>>({});
  const [openTransformDomains, setOpenTransformDomains] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (path.startsWith("/load")) {
      setLoadOpen(true);
      const parts = path.split("/");
      if (parts.length >= 3) {
        setOpenLoadDomains((prev) => ({ ...prev, [parts[2]]: true }));
      }
    } else if (path.startsWith("/transform")) {
      setTransformOpen(true);
      const parts = path.split("/");
      if (parts.length >= 3) {
        setOpenTransformDomains((prev) => ({ ...prev, [parts[2]]: true }));
      }
    }
  }, [path]);

  const toggleLoadDomain = useCallback(
    (name: string) => setOpenLoadDomains((prev) => ({ ...prev, [name]: !prev[name] })),
    []
  );
  const toggleTransformDomain = useCallback(
    (name: string) => setOpenTransformDomains((prev) => ({ ...prev, [name]: !prev[name] })),
    []
  );

  const loadNavDomains: NavDomain[] = loadDomains.map((d) => ({
    name: d.name,
    items: d.tables,
  }));

  const transformNavDomains: NavDomain[] = transformDomains.map((d) => ({
    name: d.name,
    items: d.tasks,
  }));

  return (
    <ScrollArea className="h-full flex-1">
      <nav className="flex flex-col gap-1 p-3">
        <NavSection
          label="Load"
          basePath="/load"
          domains={loadNavDomains}
          sectionOpen={loadOpen}
          onSectionToggle={setLoadOpen}
          openDomains={openLoadDomains}
          onToggleDomain={toggleLoadDomain}
          currentPath={path}
          onLinkClick={onLinkClick}
        />
        <NavSection
          label="Transform"
          basePath="/transform"
          domains={transformNavDomains}
          sectionOpen={transformOpen}
          onSectionToggle={setTransformOpen}
          openDomains={openTransformDomains}
          onToggleDomain={toggleTransformDomain}
          currentPath={path}
          onLinkClick={onLinkClick}
        />
      </nav>
    </ScrollArea>
  );
}
