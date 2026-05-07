"use client";

import type { Analysis, Doc } from "@/types";
import { extractClaimsForDoc } from "./extract-claims";
import { reconcile } from "./reconcile";
import type { AnalysisProgress } from "@/types";

export async function runAnalysis(
  apiKey: string,
  docs: Doc[],
  setProgress: (p: AnalysisProgress) => void,
): Promise<Analysis> {
  if (docs.length < 2) {
    throw new Error("Add at least two documents before running analysis.");
  }

  const allClaims = [];
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    setProgress({
      phase: "extracting",
      current: i + 1,
      total: docs.length,
      currentDocTitle: doc.title,
      message: `Extracting claims from ${doc.title}…`,
    });
    const claims = await extractClaimsForDoc(apiKey, doc);
    allClaims.push(...claims);
  }

  setProgress({
    phase: "reconciling",
    message: `Cross-referencing ${allClaims.length} claims across ${docs.length} sources…`,
  });

  const { contradictions, confidences } = await reconcile(
    apiKey,
    allClaims,
    docs,
  );

  setProgress({ phase: "done", message: "Analysis complete." });

  return {
    claims: allClaims,
    contradictions,
    confidences,
    generatedAt: Date.now(),
  };
}
