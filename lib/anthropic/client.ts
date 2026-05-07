"use client";

import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-sonnet-4-6";

export function getClient(apiKey: string): Anthropic {
  if (!apiKey) throw new Error("Missing Anthropic API key");
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}
