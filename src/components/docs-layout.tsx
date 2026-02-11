"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import {
  Sidebar,
  SidebarSheet,
  type LoadDomain,
  type TransformDomain,
} from "@/components/sidebar";

interface DocsLayoutProps {
  loadDomains: LoadDomain[];
  transformDomains: TransformDomain[];
  children: React.ReactNode;
}

export function DocsLayout({
  loadDomains,
  transformDomains,
  children,
}: DocsLayoutProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar onMenuClick={() => setSheetOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          loadDomains={loadDomains}
          transformDomains={transformDomains}
        />
        <SidebarSheet
          loadDomains={loadDomains}
          transformDomains={transformDomains}
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
