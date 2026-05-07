"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] placeholder:text-[var(--muted)]",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] placeholder:text-[var(--muted)]",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
