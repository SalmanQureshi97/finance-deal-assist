export type DocId = string;
export type ClaimId = string;

export type Doc = {
  id: DocId;
  title: string;
  text: string;
  charCount: number;
  addedAt: number;
};

export type ClaimTopic =
  | "team"
  | "traction"
  | "market"
  | "financials"
  | "technology"
  | "security"
  | "risk"
  | "product"
  | "competition"
  | "other";

export type Claim = {
  id: ClaimId;
  statement: string;
  topic: ClaimTopic;
  sourceDocId: DocId;
  quote: string;
  quoteLocation: string;
};

export type ContradictionSeverity = "high" | "medium" | "low";

export type Contradiction = {
  id: string;
  topic: string;
  rationale: string;
  severity: ContradictionSeverity;
  claimIds: ClaimId[];
};

export type ConfidenceLevel = "corroborated" | "single" | "contested";

export type Confidence = {
  claimId: ClaimId;
  level: ConfidenceLevel;
  supportingClaimIds: ClaimId[];
  contradictingClaimIds: ClaimId[];
};

export type Analysis = {
  claims: Claim[];
  contradictions: Contradiction[];
  confidences: Confidence[];
  generatedAt: number;
};

export type MemoSection = {
  heading: string;
  body: string;
};

export type Memo = {
  markdown: string;
  generatedAt: number;
};

export type AnalysisProgress = {
  phase: "idle" | "extracting" | "reconciling" | "done" | "error";
  current?: number;
  total?: number;
  currentDocTitle?: string;
  message?: string;
  error?: string;
};
