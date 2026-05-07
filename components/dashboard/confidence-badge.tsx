"use client";

import { Check, CircleAlert, Minus } from "lucide-react";
import type { ConfidenceLevel } from "@/types";
import { Badge } from "@/components/ui/badge";

const LABEL: Record<ConfidenceLevel, string> = {
  corroborated: "Corroborated",
  single: "Single source",
  contested: "Contested",
};

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const tone =
    level === "corroborated"
      ? "success"
      : level === "contested"
        ? "danger"
        : "muted";
  const Icon =
    level === "corroborated"
      ? Check
      : level === "contested"
        ? CircleAlert
        : Minus;
  return (
    <Badge tone={tone} className="gap-1">
      <Icon size={11} />
      {LABEL[level]}
    </Badge>
  );
}
