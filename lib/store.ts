"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Analysis,
  AnalysisProgress,
  Claim,
  Confidence,
  Contradiction,
  Doc,
  Memo,
} from "@/types";
import { uid } from "./utils";

type State = {
  apiKey: string | null;
  docs: Doc[];
  analysis: Analysis | null;
  memo: Memo | null;
  progress: AnalysisProgress;
};

type Actions = {
  setApiKey: (key: string | null) => void;
  addDoc: (input: { title: string; text: string }) => Doc;
  removeDoc: (id: string) => void;
  clearAll: () => void;
  setAnalysis: (a: Analysis | null) => void;
  setProgress: (p: AnalysisProgress) => void;
  setMemo: (m: Memo | null) => void;
  patchAnalysis: (patch: Partial<{
    claims: Claim[];
    contradictions: Contradiction[];
    confidences: Confidence[];
  }>) => void;
};

const initialProgress: AnalysisProgress = { phase: "idle" };

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      apiKey: null,
      docs: [],
      analysis: null,
      memo: null,
      progress: initialProgress,

      setApiKey: (key) => set({ apiKey: key }),

      addDoc: ({ title, text }) => {
        const trimmed = text.trim();
        const doc: Doc = {
          id: uid("doc"),
          title: title.trim() || "Untitled document",
          text: trimmed,
          charCount: trimmed.length,
          addedAt: Date.now(),
        };
        set({ docs: [...get().docs, doc], analysis: null, memo: null });
        return doc;
      },

      removeDoc: (id) =>
        set({
          docs: get().docs.filter((d) => d.id !== id),
          analysis: null,
          memo: null,
        }),

      clearAll: () =>
        set({ docs: [], analysis: null, memo: null, progress: initialProgress }),

      setAnalysis: (analysis) => set({ analysis }),
      setProgress: (progress) => set({ progress }),
      setMemo: (memo) => set({ memo }),

      patchAnalysis: (patch) => {
        const a = get().analysis;
        if (!a) return;
        set({ analysis: { ...a, ...patch, generatedAt: Date.now() } });
      },
    }),
    {
      name: "fda-store",
      partialize: (s) => ({
        apiKey: s.apiKey,
        docs: s.docs,
        analysis: s.analysis,
        memo: s.memo,
      }),
    },
  ),
);
