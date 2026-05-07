"use client";

import * as React from "react";
import { FileText } from "lucide-react";
import type { Doc } from "@/types";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export function DocDrawer({
  doc,
  open,
  onOpenChange,
}: {
  doc: Doc | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {doc && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-[var(--muted)]" />
              <SheetTitle>{doc.title}</SheetTitle>
            </div>
            <div className="text-xs text-[var(--muted)]">
              {doc.charCount.toLocaleString()} characters
            </div>
            <pre className="whitespace-pre-wrap rounded-md bg-[var(--muted-bg)] p-4 font-mono text-xs leading-relaxed">
              {doc.text}
            </pre>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
