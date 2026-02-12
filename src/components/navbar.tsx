"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";

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
        className="flex items-center gap-2 text-lg font-bold text-foreground no-underline transition-all hover:text-primary"
      >
        TPCH Docs
      </Link>
      <div className="ml-auto flex items-center gap-3">
        <ModeToggle />
      </div>
    </header>
  );
}
