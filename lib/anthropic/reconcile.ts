"use client";

import type { Claim, Confidence, Contradiction, Doc } from "@/types";
import { uid } from "../utils";
import { getClient, MODEL } from "./client";
import { buildClaimsBlock, RECONCILER_SYSTEM } from "./prompts";

const TOOL = {
  name: "submit_reconciliation",
  description:
    "Submit cross-source contradictions and per-claim confidence scores.",
  input_schema: {
    type: "object" as const,
    properties: {
      contradictions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            topic: { type: "string" },
            rationale: { type: "string" },
            severity: { type: "string", enum: ["high", "medium", "low"] },
            claimIds: { type: "array", items: { type: "string" } },
          },
          required: ["topic", "rationale", "severity", "claimIds"],
        },
      },
      confidences: {
        type: "array",
        items: {
          type: "object",
          properties: {
            claimId: { type: "string" },
            level: {
              type: "string",
              enum: ["corroborated", "single", "contested"],
            },
            supportingClaimIds: { type: "array", items: { type: "string" } },
            contradictingClaimIds: { type: "array", items: { type: "string" } },
          },
          required: [
            "claimId",
            "level",
            "supportingClaimIds",
            "contradictingClaimIds",
          ],
        },
      },
    },
    required: ["contradictions", "confidences"],
  },
};

type RawContradiction = {
  topic: string;
  rationale: string;
  severity: "high" | "medium" | "low";
  claimIds: string[];
};

type RawConfidence = {
  claimId: string;
  level: "corroborated" | "single" | "contested";
  supportingClaimIds: string[];
  contradictingClaimIds: string[];
};

export async function reconcile(
  apiKey: string,
  claims: Claim[],
  docs: Doc[],
): Promise<{ contradictions: Contradiction[]; confidences: Confidence[] }> {
  const client = getClient(apiKey);

  const claimIdSet = new Set(claims.map((c) => c.id));
  const sameDocPairs = (a: string, b: string) => {
    const da = claims.find((c) => c.id === a)?.sourceDocId;
    const db = claims.find((c) => c.id === b)?.sourceDocId;
    return da !== undefined && da === db;
  };

  const userText = `Here are the atomic claims extracted from the deal corpus. Identify cross-source contradictions and score every claim's confidence using the submit_reconciliation tool.

CLAIMS:
${buildClaimsBlock(claims, docs)}`;

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: [
      {
        type: "text",
        text: RECONCILER_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [TOOL],
    tool_choice: { type: "tool", name: "submit_reconciliation" },
    messages: [{ role: "user", content: userText }],
  });

  const toolUse = resp.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Reconciler returned no tool_use");
  }
  const input = toolUse.input as {
    contradictions?: RawContradiction[];
    confidences?: RawConfidence[];
  };

  const contradictions: Contradiction[] = (input.contradictions ?? [])
    .filter(
      (c) =>
        Array.isArray(c.claimIds) &&
        c.claimIds.length >= 2 &&
        c.claimIds.every((id) => claimIdSet.has(id)) &&
        // ensure at least one cross-doc pair exists
        c.claimIds.some((a, i) =>
          c.claimIds.slice(i + 1).some((b) => !sameDocPairs(a, b)),
        ),
    )
    .map<Contradiction>((c) => ({
      id: uid("ctd"),
      topic: c.topic.trim(),
      rationale: c.rationale.trim(),
      severity: c.severity,
      claimIds: c.claimIds,
    }));

  const seen = new Set<string>();
  const confidences: Confidence[] = [];
  for (const r of input.confidences ?? []) {
    if (!claimIdSet.has(r.claimId) || seen.has(r.claimId)) continue;
    seen.add(r.claimId);
    confidences.push({
      claimId: r.claimId,
      level: r.level,
      supportingClaimIds: (r.supportingClaimIds ?? []).filter(
        (id) => claimIdSet.has(id) && id !== r.claimId,
      ),
      contradictingClaimIds: (r.contradictingClaimIds ?? []).filter(
        (id) => claimIdSet.has(id) && id !== r.claimId,
      ),
    });
  }
  // Backfill any missing claims as "single".
  for (const c of claims) {
    if (!seen.has(c.id)) {
      confidences.push({
        claimId: c.id,
        level: "single",
        supportingClaimIds: [],
        contradictingClaimIds: [],
      });
    }
  }

  return { contradictions, confidences };
}
