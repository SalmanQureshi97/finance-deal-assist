"use client";

import * as React from "react";
import { KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";

export function ApiKeyModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const apiKey = useStore((s) => s.apiKey);
  const setApiKey = useStore((s) => s.setApiKey);
  const [draft, setDraft] = React.useState(apiKey ?? "");
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setDraft(apiKey ?? "");
  }

  const valid = draft.trim().startsWith("sk-ant-");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            <KeyRound size={18} />
          </div>
          <div>
            <DialogTitle>Anthropic API Key</DialogTitle>
            <DialogDescription>
              Stored locally in your browser. Never sent anywhere except
              api.anthropic.com.
            </DialogDescription>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <Input
            type="password"
            placeholder="sk-ant-..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <p className="text-xs text-[var(--muted)]">
            Get one at{" "}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-[var(--accent)]"
            >
              console.anthropic.com
            </a>
            .
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          {apiKey && (
            <Button
              variant="ghost"
              onClick={() => {
                setApiKey(null);
                setDraft("");
                onOpenChange(false);
              }}
            >
              Clear
            </Button>
          )}
          <Button
            disabled={!valid}
            onClick={() => {
              setApiKey(draft.trim());
              onOpenChange(false);
            }}
          >
            Save key
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
