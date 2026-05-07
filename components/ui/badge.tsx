"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Tone =
  | "neutral"
  | "accent"
  | "success"
  | "warn"
  | "danger"
  | "muted";

const tones: Record<Tone, string> = {
  neutral:
    "bg-[var(--muted-bg)] text-[var(--foreground)] border-[var(--border)]",
  accent:
    "bg-[var(--accent-soft)] text-[var(--accent)] border-indigo-200",
  success:
    "bg-[var(--success-soft)] text-[var(--success)] border-emerald-200",
  warn: "bg-[var(--warn-soft)] text-[var(--warn)] border-amber-200",
  danger:
    "bg-[var(--danger-soft)] text-[var(--danger)] border-red-200",
  muted: "bg-transparent text-[var(--muted)] border-[var(--border)]",
};

export function Badge({
  tone = "neutral",
  className,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
