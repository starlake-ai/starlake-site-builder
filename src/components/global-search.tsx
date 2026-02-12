"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search as SearchIcon, FileText, Database, Workflow, Command as IconCommand } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SearchResult } from "@/lib/search";

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => {
          if (!open) setTimeout(() => inputRef.current?.focus(), 10);
          return !open;
        });
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setResults([]);
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        setResults(data.getResults || data.results || []);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  const onSelect = (url: string) => {
    router.push(url);
    setOpen(false);
    setQuery("");
  };

  const loadResults = results.filter(r => r.category === "Load");
  const transformResults = results.filter(r => r.category === "Transform");

  return (
    <div className="relative w-full max-w-md mx-auto">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div 
            className={cn(
              "group flex items-center w-full gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-text",
              "bg-muted/30 border-border/50 hover:bg-muted/50 hover:border-primary/30",
              open && "ring-2 ring-primary/20 bg-background border-primary/50"
            )}
            onClick={(e) => {
              if (open) e.preventDefault();
              setOpen(true);
            }}
          >
            <SearchIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <input
              ref={inputRef}
              placeholder="Search documentation..."
              className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground h-7"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!open) setOpen(true);
              }}
              onFocus={() => setOpen(true)}
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground transition-colors group-hover:border-primary/30 group-hover:text-primary">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="p-0 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-xl border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          align="start"
          sideOffset={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (e.target instanceof Element && inputRef.current?.contains(e.target)) {
              e.preventDefault();
            }
          }}
        >
          <Command className="bg-transparent" shouldFilter={false}>
            <CommandList className="max-h-[min(450px,70vh)] scrollbar-thin scrollbar-thumb-primary/10">
              {isLoading && (
                <div className="py-10 text-center text-sm text-muted-foreground animate-pulse">
                  Searching documentation...
                </div>
              )}
              
              {!isLoading && query.trim() !== "" && results.length === 0 && (
                <div className="py-12 px-4 text-center animate-in fade-in duration-300">
                  <div className="inline-flex p-3 rounded-full bg-muted mb-4">
                    <SearchIcon className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">No results found</h3>
                  <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                    We couldn&apos;t find anything matching &quot;{query}&quot;. Try a different keyword.
                  </p>
                </div>
              )}

              {!isLoading && !query && (
                <div className="p-4 space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 px-2">Quick Navigation</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => onSelect("/load")} className="flex items-center gap-2 p-2 rounded-lg hover:bg-primary/5 text-sm transition-colors text-left group">
                        <div className="p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Database className="h-4 w-4" />
                        </div>
                        <span>Load Domains</span>
                      </button>
                      <button onClick={() => onSelect("/transform")} className="flex items-center gap-2 p-2 rounded-lg hover:bg-primary/5 text-sm transition-colors text-left group">
                        <div className="p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Workflow className="h-4 w-4" />
                        </div>
                        <span>Transform Tasks</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {loadResults.length > 0 && (
                <CommandGroup heading="Load Documentation" className="p-2">
                  {loadResults.map((result) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => onSelect(result.url)}
                      className="group flex flex-col items-start gap-1 p-3 rounded-lg cursor-pointer data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground transition-colors"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className="p-1 rounded-md bg-primary/10 text-primary group-data-[selected=true]:bg-primary-foreground/20 group-data-[selected=true]:text-primary-foreground transition-colors text-inherit">
                          {result.type === 'domain' ? <Database className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                        </div>
                        <span className="font-medium text-foreground group-data-[selected=true]:text-primary-foreground">{result.title}</span>
                        <span className="ml-auto text-[10px] font-semibold bg-primary/10 text-primary group-data-[selected=true]:bg-primary-foreground/20 group-data-[selected=true]:text-primary-foreground px-1.5 py-0.5 rounded-full uppercase tracking-tight transition-colors">
                          {result.type}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 pl-7 opacity-70 group-data-[selected=true]:text-primary-foreground/80 group-data-[selected=true]:opacity-100 transition-colors">
                        {result.breadcrumb}
                      </p>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {transformResults.length > 0 && (
                <>
                  <CommandSeparator className="bg-border/30 mx-2" />
                  <CommandGroup heading="Transform Documentation" className="p-2">
                    {transformResults.map((result) => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => onSelect(result.url)}
                        className="group flex flex-col items-start gap-1 p-3 rounded-lg cursor-pointer data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground transition-colors"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="p-1 rounded-md bg-primary/10 text-primary group-data-[selected=true]:bg-primary-foreground/20 group-data-[selected=true]:text-primary-foreground transition-colors text-inherit">
                            {result.type === 'transform-domain' ? <Workflow className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                          </div>
                          <span className="font-medium text-foreground group-data-[selected=true]:text-primary-foreground">{result.title}</span>
                          <span className="ml-auto text-[10px] font-semibold bg-primary/10 text-primary group-data-[selected=true]:bg-primary-foreground/20 group-data-[selected=true]:text-primary-foreground px-1.5 py-0.5 rounded-full uppercase tracking-tight transition-colors">
                            {result.type === 'transform-domain' ? 'domain' : 'task'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 pl-7 opacity-70 group-data-[selected=true]:text-primary-foreground/80 group-data-[selected=true]:opacity-100 transition-colors">
                          {result.breadcrumb}
                        </p>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
            
            <div className="border-t border-border/30 p-2.5 flex items-center justify-between text-[10px] text-muted-foreground/60 bg-muted/20">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border/50 bg-background px-1 px-1.5 py-0.5 font-mono text-[9px]">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border/50 bg-background px-1.5 py-0.5 font-mono text-[9px]">↵</kbd>
                  Select
                </span>
              </div>
              <div className="flex items-center gap-1">
                <IconCommand className="h-3 w-3" />
                <span>Documentation Search</span>
              </div>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
