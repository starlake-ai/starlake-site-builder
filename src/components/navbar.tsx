"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "@/components/global-search";

interface NavbarProps {
  onMenuClick?: () => void;
  className?: string;
}

export function Navbar({ onMenuClick, className }: NavbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-16 items-center gap-4 border-b border-border/50 bg-background/80 px-6 backdrop-blur-xl shadow-sm",
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden hover:bg-primary/10"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <Link
        href="/"
        className="flex items-center gap-2 text-lg font-bold text-foreground no-underline transition-all hover:text-primary shrink-0"
      >
        <img 
          src="/starlake-logo.png" 
          alt="Starlake Logo" 
          className="h-8 w-8 object-contain dark:invert" 
        />
        <span className="hidden sm:inline-block">Starlake Docs</span>
      </Link>

      <div className="flex-1 flex justify-center max-w-2xl mx-auto px-4">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-3">
        <ModeToggle />
      </div>
    </header>
  );
}
