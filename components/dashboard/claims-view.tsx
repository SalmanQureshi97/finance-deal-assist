"use client";

import * as React from "react";
import type { Claim, ClaimTopic, Confidence, Doc } from "@/types";
import { Card, CardBody } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ConfidenceBadge } from "./confidence-badge";
import { SourcePill } from "./source-pill";
import { QuoteBlock } from "./quote-block";
import { cn } from "@/lib/utils";

const TOPIC_ORDER: ClaimTopic[] = [
  "team",
  "traction",
  "market",
  "financials",
  "technology",
  "security",
  "risk",
  "product",
  "competition",
  "other",
];

export function ClaimsView({
  claims,
  confidences,
  docs,
}: {
  claims: Claim[];
  confidences: Confidence[];
  docs: Doc[];
}) {
  const [topicFilter, setTopicFilter] = React.useState<ClaimTopic | "all">(
    "all",
  );
  const [confFilter, setConfFilter] = React.useState<
    "all" | "corroborated" | "single" | "contested"
  >("all");
  const [openClaimId, setOpenClaimId] = React.useState<string | null>(null);

  const docMap = React.useMemo(
    () => new Map(docs.map((d) => [d.id, d])),
    [docs],
  );
  const confMap = React.useMemo(
    () => new Map(confidences.map((c) => [c.claimId, c])),
    [confidences],
  );
  const claimMap = React.useMemo(
    () => new Map(claims.map((c) => [c.id, c])),
    [claims],
  );

  const presentTopics = React.useMemo(() => {
    const set = new Set(claims.map((c) => c.topic));
    return TOPIC_ORDER.filter((t) => set.has(t));
  }, [claims]);

  const filtered = claims.filter((c) => {
    if (topicFilter !== "all" && c.topic !== topicFilter) return false;
    if (confFilter !== "all") {
      const conf = confMap.get(c.id);
      if (!conf || conf.level !== confFilter) return false;
    }
    return true;
  });

  const openClaim = openClaimId ? claimMap.get(openClaimId) : null;
  const openConf = openClaimId ? confMap.get(openClaimId) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          active={topicFilter === "all"}
          onClick={() => setTopicFilter("all")}
        >
          All topics
        </FilterChip>
        {presentTopics.map((t) => (
          <FilterChip
            key={t}
            active={topicFilter === t}
            onClick={() => setTopicFilter(t)}
          >
            <span className="capitalize">{t}</span>
          </FilterChip>
        ))}
        <span className="mx-2 h-5 w-px bg-[var(--border)]" />
        {(["all", "corroborated", "single", "contested"] as const).map((c) => (
          <FilterChip
            key={c}
            active={confFilter === c}
            onClick={() => setConfFilter(c)}
          >
            <span className="capitalize">
              {c === "all" ? "All confidence" : c}
            </span>
          </FilterChip>
        ))}
      </div>

      <Card>
        <CardBody className="p-0">
          <div className="divide-y divide-[var(--border)]">
            {filtered.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-[var(--muted)]">
                No claims match the current filters.
              </div>
            )}
            {filtered.map((c) => {
              const conf = confMap.get(c.id);
              const doc = docMap.get(c.sourceDocId);
              return (
                <button
                  key={c.id}
                  onClick={() => setOpenClaimId(c.id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left transition hover:bg-[var(--muted-bg)]/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {c.statement}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge tone="accent" className="capitalize">
                        {c.topic}
                      </Badge>
                      <SourcePill
                        title={doc?.title ?? "Unknown"}
                        location={c.quoteLocation}
                      />
                    </div>
                  </div>
                  <div className="shrink-0">
                    {conf && <ConfidenceBadge level={conf.level} />}
                  </div>
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <Sheet
        open={!!openClaimId}
        onOpenChange={(v) => !v && setOpenClaimId(null)}
      >
        <SheetContent>
          {openClaim && (
            <div className="space-y-5">
              <div>
                <SheetTitle>Claim detail</SheetTitle>
                <div className="mt-3 flex items-center gap-2">
                  <Badge tone="accent" className="capitalize">
                    {openClaim.topic}
                  </Badge>
                  {openConf && <ConfidenceBadge level={openConf.level} />}
                </div>
              </div>

              <div>
                <p className="text-sm leading-relaxed">{openClaim.statement}</p>
              </div>

              <Section heading="Source">
                <SourcePill
                  title={docMap.get(openClaim.sourceDocId)?.title ?? "—"}
                  location={openClaim.quoteLocation}
                />
                <QuoteBlock quote={openClaim.quote} className="mt-2" />
              </Section>

              {openConf && openConf.supportingClaimIds.length > 0 && (
                <Section heading="Supporting evidence (other sources)">
                  <RelatedClaims
                    ids={openConf.supportingClaimIds}
                    claimMap={claimMap}
                    docMap={docMap}
                  />
                </Section>
              )}

              {openConf && openConf.contradictingClaimIds.length > 0 && (
                <Section heading="Contradicting evidence (other sources)">
                  <RelatedClaims
                    ids={openConf.contradictingClaimIds}
                    claimMap={claimMap}
                    docMap={docMap}
                  />
                </Section>
              )}

              {openConf?.level === "single" && (
                <p className="text-xs text-[var(--muted)]">
                  No corroborating or contradicting evidence found in other
                  documents.
                </p>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        {heading}
      </div>
      {children}
    </div>
  );
}

function RelatedClaims({
  ids,
  claimMap,
  docMap,
}: {
  ids: string[];
  claimMap: Map<string, Claim>;
  docMap: Map<string, Doc>;
}) {
  return (
    <div className="space-y-3">
      {ids.map((id) => {
        const claim = claimMap.get(id);
        if (!claim) return null;
        const doc = docMap.get(claim.sourceDocId);
        return (
          <div
            key={id}
            className="rounded-md border border-[var(--border)] bg-[var(--muted-bg)]/30 p-3"
          >
            <SourcePill
              title={doc?.title ?? "—"}
              location={claim.quoteLocation}
            />
            <p className="mt-2 text-sm font-medium">{claim.statement}</p>
            <QuoteBlock quote={claim.quote} className="mt-2" />
          </div>
        );
      })}
    </div>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition",
        active
          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
          : "border-[var(--border)] bg-white text-[var(--muted)] hover:bg-[var(--muted-bg)]",
      )}
    >
      {children}
    </button>
  );
}
