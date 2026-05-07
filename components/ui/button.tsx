"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--accent)] text-white hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-stone-300 disabled:text-stone-500",
  secondary:
    "bg-white text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--muted-bg)] disabled:opacity-50",
  ghost:
    "bg-transparent text-[var(--foreground)] hover:bg-[var(--muted-bg)] disabled:opacity-50",
  danger:
    "bg-[var(--danger)] text-white hover:bg-red-800 disabled:opacity-50",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  ({ variant = "primary", size = "md", className, ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    />
  ),
);
Button.displayName = "Button";
