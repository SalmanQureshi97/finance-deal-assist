"use client";

import type { Claim, Doc } from "@/types";
import { uid } from "../utils";
import { getClient, MODEL } from "./client";
import { EXTRACTOR_SYSTEM, TOPIC_ENUM } from "./prompts";

const TOOL = {
  name: "submit_claims",
  description: "Submit the list of atomic factual claims extracted from the document.",
  input_schema: {
    type: "object" as const,
    properties: {
      claims: {
        type: "array",
        items: {
          type: "object",
          properties: {
            statement: {
              type: "string",
              description:
                "Normalized, declarative, self-contained version of the claim.",
            },
            topic: {
              type: "string",
              enum: TOPIC_ENUM,
            },
            quote: {
              type: "string",
              description:
                "Verbatim quote from the document supporting this claim. Must appear character-for-character in the source.",
            },
            quoteLocation: {
              type: "string",
              description:
                "Most precise locator available: slide number, section heading, paragraph, or Q&A item.",
            },
          },
          required: ["statement", "topic", "quote", "quoteLocation"],
        },
      },
    },
    required: ["claims"],
  },
};

type RawClaim = {
  statement: string;
  topic: (typeof TOPIC_ENUM)[number];
  quote: string;
  quoteLocation: string;
};

export async function extractClaimsForDoc(
  apiKey: string,
  doc: Doc,
): Promise<Claim[]> {
  const client = getClient(apiKey);

  const userText = `Here is the source document. Extract its atomic factual claims using the submit_claims tool.

===== DOCUMENT =====
TITLE: ${doc.title}

${doc.text}
===== END DOCUMENT =====`;

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: EXTRACTOR_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [TOOL],
    tool_choice: { type: "tool", name: "submit_claims" },
    messages: [{ role: "user", content: userText }],
  });

  const toolUse = resp.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error(`Extractor returned no tool_use for "${doc.title}"`);
  }
  const input = toolUse.input as { claims?: RawClaim[] };
  const raws = Array.isArray(input.claims) ? input.claims : [];

  return raws
    .filter((r) => r.statement && r.quote)
    .map<Claim>((r) => ({
      id: uid("clm"),
      statement: r.statement.trim(),
      topic: TOPIC_ENUM.includes(r.topic) ? r.topic : "other",
      sourceDocId: doc.id,
      quote: r.quote.trim(),
      quoteLocation: r.quoteLocation?.trim() || "—",
    }));
}
