"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SidebarContent } from "@/components/sidebar-content";
import { cn } from "@/lib/utils";

export interface LoadDomain {
  name: string;
  tables: { name: string }[];
}

export interface TransformDomain {
  name: string;
  tasks: { name: string }[];
}

interface SidebarProps {
  loadDomains: LoadDomain[];
  transformDomains: TransformDomain[];
  className?: string;
}

export function Sidebar({
  loadDomains,
  transformDomains,
  className,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full w-72 min-w-[16rem] flex-col border-r border-border/40 glass transition-[width] duration-200",
        "hidden md:flex",
        className
      )}
    >
      <SidebarContent
        loadDomains={loadDomains}
        transformDomains={transformDomains}
      />
    </aside>
  );
}

interface SidebarSheetProps {
  loadDomains: LoadDomain[];
  transformDomains: TransformDomain[];
  open: boolean;
  onClose: () => void;
}

export function SidebarSheet({
  loadDomains,
  transformDomains,
  open,
  onClose,
}: SidebarSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="left"
        showCloseButton={true}
        title="Navigation"
        className="sm:max-w-md"
      >
        <div className="flex h-full flex-col pt-8">
          <SidebarContent
            loadDomains={loadDomains}
            transformDomains={transformDomains}
            onLinkClick={onClose}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
