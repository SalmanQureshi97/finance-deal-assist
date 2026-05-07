"use client";

import { FileText } from "lucide-react";
import { cn, shortenSource } from "@/lib/utils";

export function SourcePill({
  title,
  location,
  className,
}: {
  title: string;
  location?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--muted-bg)] px-2 py-0.5 text-xs text-[var(--muted)]",
        className,
      )}
      title={`${title}${location ? ` — ${location}` : ""}`}
    >
      <FileText size={11} />
      <span className="truncate font-medium text-[var(--foreground)]">
        {shortenSource(title, 30)}
      </span>
      {location && (
        <span className="truncate">· {shortenSource(location, 24)}</span>
      )}
    </span>
  );
}
