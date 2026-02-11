"use client";

import Link from "next/link";
import { Menu, Zap } from "lucide-react";
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
        "sticky top-0 z-50 flex h-16 items-center gap-4 px-6 glass",
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <Link
        href="/"
        className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-90 transition-opacity"
      >
        <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
          <Zap className="h-5 w-5 fill-current" />
        </div>
        <span className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
          TPCH Docs
        </span>
      </Link>
      <div className="ml-auto flex items-center gap-4">
        <ModeToggle />
      </div>
    </header>
  );
}
