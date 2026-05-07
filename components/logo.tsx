"use client";

import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent)] text-sm font-bold text-white">
        F
      </span>
      <span className="text-sm font-semibold tracking-tight">
        finance-deal-assist
      </span>
    </Link>
  );
}
