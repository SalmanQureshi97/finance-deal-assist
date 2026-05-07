"use client";

import { ShieldAlert } from "lucide-react";
import type { Claim, Contradiction, Doc } from "@/types";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SourcePill } from "./source-pill";
import { QuoteBlock } from "./quote-block";

const SEV_TONE = {
  high: "danger",
  medium: "warn",
  low: "muted",
} as const;

export function ContradictionsView({
  contradictions,
  claims,
  docs,
}: {
  contradictions: Contradiction[];
  claims: Claim[];
  docs: Doc[];
}) {
  if (contradictions.length === 0) {
    return (
      <Card>
        <CardBody className="py-12 text-center">
          <ShieldAlert
            size={28}
            className="mx-auto mb-3 text-[var(--muted)]"
          />
          <p className="text-sm font-medium">No contradictions detected.</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Sources broadly aligned. Try the Claims tab to inspect what was
            extracted.
          </p>
        </CardBody>
      </Card>
    );
  }

  const claimMap = new Map(claims.map((c) => [c.id, c]));
  const docMap = new Map(docs.map((d) => [d.id, d]));

  return (
    <div className="space-y-4">
      {contradictions.map((c) => (
        <Card key={c.id}>
          <CardBody>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold tracking-tight">
                  {c.topic}
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {c.rationale}
                </p>
              </div>
              <Badge tone={SEV_TONE[c.severity]} className="shrink-0 capitalize">
                {c.severity} severity
              </Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {c.claimIds.slice(0, 4).map((id) => {
                const claim = claimMap.get(id);
                if (!claim) return null;
                const doc = docMap.get(claim.sourceDocId);
                return (
                  <div
                    key={id}
                    className="rounded-lg border border-[var(--border)] bg-[var(--muted-bg)]/30 p-3"
                  >
                    <SourcePill
                      title={doc?.title ?? "Unknown"}
                      location={claim.quoteLocation}
                    />
                    <p className="mt-2 text-sm font-medium">
                      {claim.statement}
                    </p>
                    <QuoteBlock quote={claim.quote} className="mt-2" />
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
