"use client";

import { cn } from "@/lib/utils";

export function QuoteBlock({
  quote,
  className,
}: {
  quote: string;
  className?: string;
}) {
  return (
    <blockquote
      className={cn(
        "border-l-2 border-[var(--accent)]/40 bg-[var(--muted-bg)]/40 px-3 py-2 text-sm italic leading-snug text-[var(--foreground)]",
        className,
      )}
    >
      &ldquo;{quote}&rdquo;
    </blockquote>
  );
}
