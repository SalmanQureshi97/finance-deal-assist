"use client";

import type { Analysis, Doc } from "@/types";
import { getClient, MODEL } from "./client";
import {
  buildClaimsBlock,
  buildCorpusBlock,
  MEMO_SYSTEM,
} from "./prompts";

export async function generateMemo(
  apiKey: string,
  docs: Doc[],
  analysis: Analysis,
  onDelta?: (chunk: string) => void,
): Promise<string> {
  const client = getClient(apiKey);

  const corpus = buildCorpusBlock(docs);
  const claimsBlock = buildClaimsBlock(analysis.claims, docs);

  const contradictionsBlock =
    analysis.contradictions.length === 0
      ? "(none detected)"
      : analysis.contradictions
          .map(
            (c) =>
              `- [${c.severity.toUpperCase()}] ${c.topic}: ${c.rationale} (claimIds: ${c.claimIds.join(", ")})`,
          )
          .join("\n");

  const confidencesBlock = analysis.confidences
    .map(
      (c) =>
        `- ${c.claimId}: ${c.level}${
          c.supportingClaimIds.length
            ? ` | supports: ${c.supportingClaimIds.join(", ")}`
            : ""
        }${
          c.contradictingClaimIds.length
            ? ` | contradicts: ${c.contradictingClaimIds.join(", ")}`
            : ""
        }`,
    )
    .join("\n");

  const userText = `SOURCE CORPUS:

${corpus}

EXTRACTED CLAIMS:
${claimsBlock}

CONTRADICTIONS:
${contradictionsBlock}

CONFIDENCES:
${confidencesBlock}

Write the investment memo per the system instructions. Remember: every factual claim MUST cite at least one claimId using [claim:CLAIM_ID].`;

  let memo = "";

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: MEMO_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userText }],
  });

  stream.on("text", (delta) => {
    memo += delta;
    onDelta?.(delta);
  });

  await stream.finalMessage();
  return memo;
}
