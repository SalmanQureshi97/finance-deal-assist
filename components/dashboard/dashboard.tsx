"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  KeyRound,
  Loader2,
  Play,
  RotateCw,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApiKeyModal } from "@/components/settings/api-key-modal";
import { Logo } from "@/components/logo";
import { useStore } from "@/lib/store";
import { runAnalysis } from "@/lib/anthropic/run-analysis";
import { ContradictionsView } from "./contradictions-view";
import { ClaimsView } from "./claims-view";
import { MemoView } from "./memo-view";
import { DocDrawer } from "./doc-drawer";

export function Dashboard() {
  const router = useRouter();
  const docs = useStore((s) => s.docs);
  const apiKey = useStore((s) => s.apiKey);
  const analysis = useStore((s) => s.analysis);
  const progress = useStore((s) => s.progress);
  const setAnalysis = useStore((s) => s.setAnalysis);
  const setProgress = useStore((s) => s.setProgress);
  const setMemo = useStore((s) => s.setMemo);

  const [keyOpen, setKeyOpen] = React.useState(false);
  const [openDocId, setOpenDocId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (docs.length === 0) router.replace("/");
  }, [docs.length, router]);

  const run = async () => {
    if (!apiKey) {
      setKeyOpen(true);
      return;
    }
    setError(null);
    setMemo(null);
    try {
      const result = await runAnalysis(apiKey, docs, setProgress);
      setAnalysis(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed");
      setProgress({
        phase: "error",
        error: e instanceof Error ? e.message : "Analysis failed",
      });
    }
  };

  const running =
    progress.phase === "extracting" || progress.phase === "reconciling";

  const openDoc = openDocId ? docs.find((d) => d.id === openDocId) ?? null : null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--card)]/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="text-sm text-[var(--muted)]">/ deal corpus</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button size="sm" variant="ghost">
                <ArrowLeft size={14} /> Documents
              </Button>
            </Link>
            <Button
              size="sm"
              variant={apiKey ? "ghost" : "secondary"}
              onClick={() => setKeyOpen(true)}
            >
              <KeyRound size={14} />
              {apiKey ? "Key" : "Set API key"}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {docs.map((d) => (
              <button
                key={d.id}
                onClick={() => setOpenDocId(d.id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--muted-bg)]"
              >
                <FileText size={12} />
                {d.title}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {analysis && (
              <Badge tone="success" className="gap-1">
                <Zap size={11} />
                {analysis.claims.length} claims ·{" "}
                {analysis.contradictions.length} contradictions
              </Badge>
            )}
            <Button onClick={run} disabled={running}>
              {running ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Running…
                </>
              ) : analysis ? (
                <>
                  <RotateCw size={14} /> Re-run analysis
                </>
              ) : (
                <>
                  <Play size={14} /> Run analysis
                </>
              )}
            </Button>
          </div>
        </div>

        {running && (
          <Card className="mb-6">
            <CardBody className="flex items-center gap-3 py-4">
              <Loader2 size={16} className="animate-spin text-[var(--accent)]" />
              <div className="text-sm">
                {progress.message ?? "Working…"}
                {progress.total ? (
                  <span className="ml-2 text-[var(--muted)]">
                    {progress.current}/{progress.total}
                  </span>
                ) : null}
              </div>
            </CardBody>
          </Card>
        )}

        {error && (
          <Card className="mb-6">
            <CardBody className="text-sm text-[var(--danger)]">
              {error}
            </CardBody>
          </Card>
        )}

        {!analysis && !running && (
          <EmptyState onRun={run} hasKey={!!apiKey} />
        )}

        {analysis && (
          <Tabs defaultValue="contradictions">
            <TabsList>
              <TabsTrigger value="contradictions">
                <ShieldAlert size={14} />
                Contradictions
                <Badge tone="danger" className="ml-1">
                  {analysis.contradictions.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="claims">
                <FileText size={14} />
                Claims
                <Badge tone="muted" className="ml-1">
                  {analysis.claims.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="memo">
                <Sparkles size={14} />
                Memo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contradictions">
              <ContradictionsView
                contradictions={analysis.contradictions}
                claims={analysis.claims}
                docs={docs}
              />
            </TabsContent>

            <TabsContent value="claims">
              <ClaimsView
                claims={analysis.claims}
                confidences={analysis.confidences}
                docs={docs}
              />
            </TabsContent>

            <TabsContent value="memo">
              <MemoView docs={docs} analysis={analysis} />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <ApiKeyModal open={keyOpen} onOpenChange={setKeyOpen} />
      <DocDrawer
        doc={openDoc}
        open={!!openDocId}
        onOpenChange={(v) => !v && setOpenDocId(null)}
      />
    </div>
  );
}

function EmptyState({
  onRun,
  hasKey,
}: {
  onRun: () => void;
  hasKey: boolean;
}) {
  return (
    <Card>
      <CardBody className="py-16 text-center">
        <Zap size={28} className="mx-auto mb-3 text-[var(--accent)]" />
        <p className="text-base font-semibold tracking-tight">
          Ready to analyse the corpus
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
          Extracts atomic claims from each document, then cross-references
          them to surface contradictions, corroboration gaps, and confidence
          per claim.
        </p>
        <Button onClick={onRun} className="mt-6" size="lg" disabled={!hasKey}>
          <Play size={14} /> Run analysis
        </Button>
        {!hasKey && (
          <p className="mt-3 text-xs text-[var(--warn)]">
            Set your Anthropic API key first.
          </p>
        )}
      </CardBody>
    </Card>
  );
}
