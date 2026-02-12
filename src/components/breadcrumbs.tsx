import Link from "next/link";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items.length) return null;

  const lastIndex = items.length - 1;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground/60"
    >
      {items.map((item, index) => {
        const isLast = index === lastIndex;

        return (
          <div key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 && <span className="text-muted-foreground/30">/</span>}
            {isLast || !item.href ? (
              <span
                className={cn(
                  "truncate max-w-[200px]",
                  isLast ? "text-foreground font-bold" : "text-muted-foreground/60"
                )}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-foreground transition-all duration-200 hover:underline underline-offset-4"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

interface NavItem {
  label: string;
  href: string;
}

interface PrevNextNavProps {
  previous?: NavItem | null;
  next?: NavItem | null;
}

export function PrevNextNav({ previous, next }: PrevNextNavProps) {
  if (!previous && !next) return null;

  return (
    <nav
      aria-label="Pagination"
      className="mt-12 flex flex-wrap items-stretch justify-between gap-6 border-t border-border/40 pt-10"
    >
      {previous ? (
        <Link
          href={previous.href}
          className="group flex min-w-48 max-w-sm flex-1 flex-col rounded-2xl border border-border/50 bg-card p-5 text-left transition-all duration-300 hover:border-primary/50 hover:bg-muted/30 hover:shadow-xl"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Previous
          </span>
          <span className="mt-1 truncate text-[15px] font-bold text-foreground group-hover:text-primary transition-colors">
            {previous.label}
          </span>
        </Link>
      ) : (
        <span />
      )}

      {next && (
        <Link
          href={next.href}
          className="group flex min-w-48 max-w-sm flex-1 flex-col items-end rounded-2xl border border-border/50 bg-card p-5 text-right transition-all duration-300 hover:border-primary/50 hover:bg-muted/30 hover:shadow-xl"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Next
          </span>
          <span className="mt-1 truncate text-[15px] font-bold text-foreground group-hover:text-primary transition-colors">
            {next.label}
          </span>
        </Link>
      )}
    </nav>
  );
}

