"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, KeyRound, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApiKeyModal } from "@/components/settings/api-key-modal";
import { useStore } from "@/lib/store";
import { parseFile } from "@/lib/parse";

export function UploadZone() {
  const router = useRouter();
  const docs = useStore((s) => s.docs);
  const apiKey = useStore((s) => s.apiKey);
  const addDoc = useStore((s) => s.addDoc);
  const removeDoc = useStore((s) => s.removeDoc);

  const [pasteTitle, setPasteTitle] = React.useState("");
  const [pasteText, setPasteText] = React.useState("");
  // The Hydrated wrapper guarantees apiKey is the rehydrated value on first render.
  const [keyOpen, setKeyOpen] = React.useState(() => !apiKey);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    setBusy(true);
    setErr(null);
    try {
      for (const file of Array.from(files)) {
        const parsed = await parseFile(file);
        if (!parsed.text.trim()) {
          throw new Error(`No text extracted from ${file.name}`);
        }
        addDoc(parsed);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to parse file");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onAddPasted = () => {
    if (!pasteText.trim()) return;
    addDoc({ title: pasteTitle, text: pasteText });
    setPasteTitle("");
    setPasteText("");
  };

  const canContinue = docs.length >= 2 && !!apiKey;

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Deal corpus</h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
            Add the documents your deal team is working with — pitch decks,
            reference call transcripts, diligence reports. Add at least two
            sources so we can cross-reference them.
          </p>
        </div>
        <Button
          variant={apiKey ? "secondary" : "primary"}
          size="sm"
          onClick={() => setKeyOpen(true)}
        >
          <KeyRound size={14} />
          {apiKey ? "API key set" : "Set API key"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="h-fit">
          <CardBody>
            <h2 className="mt-3 mb-3 text-sm font-semibold tracking-tight">
              Upload files
            </h2>
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onFiles(e.dataTransfer.files);
              }}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--muted-bg)] px-4 py-10 text-center transition hover:bg-stone-100"
            >
              <Upload className="text-[var(--muted)]" size={20} />
              <div className="text-sm font-medium">
                Drop .txt, .md, or .pdf files
              </div>
              <div className="text-xs text-[var(--muted)]">
                or click to browse
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".txt,.md,.markdown,.pdf,text/plain,application/pdf"
                multiple
                hidden
                onChange={(e) => onFiles(e.target.files)}
              />
            </label>
            {busy && (
              <p className="mt-3 text-xs text-[var(--muted)]">Parsing…</p>
            )}
            {err && <p className="mt-3 text-xs text-[var(--danger)]">{err}</p>}
          </CardBody>
        </Card>

        <Card className="h-fit">
          <CardBody>
            <h2 className="mt-3 mb-3 text-sm font-semibold tracking-tight">
              Paste text
            </h2>
            <div className="space-y-2">
              <Input
                placeholder="Document title (e.g. Reference call - Harrington)"
                value={pasteTitle}
                onChange={(e) => setPasteTitle(e.target.value)}
              />
              <Textarea
                rows={6}
                placeholder="Paste the document text here…"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onAddPasted}
                  disabled={!pasteText.trim()}
                >
                  Add document
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {docs.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-sm font-semibold tracking-tight">
            Corpus ({docs.length})
          </h2>
          <div className="space-y-2">
            {docs.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-[var(--muted)]" />
                  <div>
                    <div className="text-sm font-medium">{d.title}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {d.charCount.toLocaleString()} characters
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeDoc(d.id)}
                  className="rounded-md p-1.5 text-[var(--muted)] hover:bg-[var(--muted-bg)] hover:text-[var(--danger)]"
                  aria-label="Remove document"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 flex flex-col items-end gap-2">
        {!apiKey && <Badge tone="warn">Add an API key to continue</Badge>}
        {docs.length < 2 && (
          <Badge tone="muted">Add at least 2 documents to continue</Badge>
        )}
        <Button
          size="lg"
          disabled={!canContinue}
          onClick={() => router.push("/dashboard")}
        >
          Open dashboard →
        </Button>
      </div>

      <ApiKeyModal open={keyOpen} onOpenChange={setKeyOpen} />
    </div>
  );
}
