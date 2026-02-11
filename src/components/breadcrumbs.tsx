import Link from "next/link";

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
      className="flex items-center gap-2 text-sm text-muted-foreground"
    >
      {items.map((item, index) => {
        const isLast = index === lastIndex;

        return (
          <div key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 && <span>/</span>}
            {isLast || !item.href ? (
              <span
                className={isLast ? "text-foreground" : "text-muted-foreground"}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors"
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
      className="mt-8 flex flex-wrap items-stretch justify-between gap-4 border-t pt-6"
    >
      {previous ? (
        <Link
          href={previous.href}
          className="group inline-flex min-w-40 max-w-sm flex-1 flex-col rounded-lg border bg-card px-4 py-3 text-left text-sm shadow-sm transition-colors hover:bg-accent"
        >
          <span className="text-xs font-medium uppercase text-muted-foreground">
            Previous
          </span>
          <span className="truncate font-medium text-foreground group-hover:underline">
            {previous.label}
          </span>
        </Link>
      ) : (
        <span />
      )}

      {next && (
        <Link
          href={next.href}
          className="group inline-flex min-w-40 max-w-sm flex-1 flex-col items-end rounded-lg border bg-card px-4 py-3 text-right text-sm shadow-sm transition-colors hover:bg-accent"
        >
          <span className="text-xs font-medium uppercase text-muted-foreground">
            Next
          </span>
          <span className="truncate font-medium text-foreground group-hover:underline">
            {next.label}
          </span>
        </Link>
      )}
    </nav>
  );
}

