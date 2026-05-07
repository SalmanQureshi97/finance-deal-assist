"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Download, Sparkles } from "lucide-react";
import type { Analysis, Doc } from "@/types";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useStore } from "@/lib/store";
import { generateMemo } from "@/lib/anthropic/generate-memo";
import { SourcePill } from "./source-pill";
import { QuoteBlock } from "./quote-block";

export function MemoView({
  docs,
  analysis,
}: {
  docs: Doc[];
  analysis: Analysis;
}) {
  const apiKey = useStore((s) => s.apiKey);
  const memo = useStore((s) => s.memo);
  const setMemo = useStore((s) => s.setMemo);

  const [busy, setBusy] = React.useState(false);
  const [streamed, setStreamed] = React.useState<string>(memo?.markdown ?? "");
  const [err, setErr] = React.useState<string | null>(null);
  const [lastMemo, setLastMemo] = React.useState(memo);
  if (memo !== lastMemo) {
    setLastMemo(memo);
    setStreamed(memo?.markdown ?? "");
  }

  const claimMap = React.useMemo(
    () => new Map(analysis.claims.map((c) => [c.id, c])),
    [analysis.claims],
  );
  const docMap = React.useMemo(
    () => new Map(docs.map((d) => [d.id, d])),
    [docs],
  );

  const generate = async () => {
    if (!apiKey) return;
    setBusy(true);
    setErr(null);
    setStreamed("");
    try {
      let acc = "";
      const final = await generateMemo(apiKey, docs, analysis, (delta) => {
        acc += delta;
        setStreamed(acc);
      });
      setMemo({ markdown: final, generatedAt: Date.now() });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Memo generation failed");
    } finally {
      setBusy(false);
    }
  };

  const copy = () => navigator.clipboard.writeText(streamed);
  const download = () => {
    const blob = new Blob([streamed], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "investment-memo.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!streamed && !busy) {
    return (
      <Card>
        <CardBody className="py-12 text-center">
          <Sparkles size={28} className="mx-auto mb-3 text-[var(--accent)]" />
          <p className="text-sm font-medium">Generate an investment memo</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-[var(--muted)]">
            Drafts a structured memo with every factual claim linked back to a
            source quote, and contradictions flagged inline.
          </p>
          <Button onClick={generate} className="mt-5" disabled={!apiKey}>
            <Sparkles size={14} />
            Generate memo
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={copy} disabled={!streamed}>
          <Copy size={14} /> Copy
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={download}
          disabled={!streamed}
        >
          <Download size={14} /> Download .md
        </Button>
        <Button size="sm" onClick={generate} disabled={busy}>
          <Sparkles size={14} />
          {busy ? "Drafting…" : "Regenerate"}
        </Button>
      </div>

      {err && (
        <Card>
          <CardBody className="text-sm text-[var(--danger)]">{err}</CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="prose-memo px-8 py-8">
          <MemoMarkdown
            text={streamed}
            renderCitation={(claimId) => {
              const claim = claimMap.get(claimId);
              if (!claim)
                return <span className="text-[var(--muted)]">[?]</span>;
              const doc = docMap.get(claim.sourceDocId);
              return (
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="mx-0.5 inline-flex h-5 items-center justify-center rounded-full bg-[var(--accent-soft)] px-1.5 text-[11px] font-semibold text-[var(--accent)] hover:bg-indigo-100">
                      {claim.topic[0].toUpperCase()}
                      <span className="ml-0.5 font-mono">
                        {claim.id.slice(-3)}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <SourcePill
                      title={doc?.title ?? "—"}
                      location={claim.quoteLocation}
                    />
                    <p className="mt-2 text-sm font-medium leading-snug">
                      {claim.statement}
                    </p>
                    <QuoteBlock quote={claim.quote} className="mt-2" />
                  </PopoverContent>
                </Popover>
              );
            }}
          />
          {busy && (
            <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-[var(--accent)]/50 align-baseline" />
          )}
        </CardBody>
      </Card>
    </div>
  );
}

const CITE_TOKEN = "⁣CITE⁣";

function MemoMarkdown({
  text,
  renderCitation,
}: {
  text: string;
  renderCitation: (claimId: string) => React.ReactNode;
}) {
  const ids: string[] = [];
  const stitched = text.replace(/\[claim:([a-zA-Z0-9_-]+)\]/g, (_, id) => {
    ids.push(id);
    return CITE_TOKEN;
  });

  let citeIdx = 0;

  const transform = (node: React.ReactNode): React.ReactNode => {
    if (typeof node === "string") {
      if (!node.includes(CITE_TOKEN)) return node;
      const parts = node.split(CITE_TOKEN);
      const out: React.ReactNode[] = [];
      parts.forEach((seg, i) => {
        if (seg) out.push(seg);
        if (i < parts.length - 1) {
          const id = ids[citeIdx++];
          out.push(
            <React.Fragment key={`cite-${citeIdx}`}>
              {renderCitation(id)}
            </React.Fragment>,
          );
        }
      });
      return out;
    }
    if (Array.isArray(node)) return node.map(transform);
    if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
      const children = node.props.children;
      if (children == null) return node;
      return React.cloneElement(node, undefined, transform(children));
    }
    return node;
  };

  const wrap = (Tag: React.ElementType) => {
    const Wrapped = ({
      children,
      ...rest
    }: React.HTMLAttributes<HTMLElement>) => (
      <Tag {...rest}>{transform(children)}</Tag>
    );
    Wrapped.displayName = `MemoMd(${String(Tag)})`;
    return Wrapped;
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: wrap("p"),
        li: wrap("li"),
        h1: wrap("h1"),
        h2: wrap("h2"),
        h3: wrap("h3"),
        blockquote: wrap("blockquote"),
      }}
    >
      {stitched}
    </ReactMarkdown>
  );
}
