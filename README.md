# finance-deal-assist

A frontend-only prototype that helps a private equity analyst make sense of a corpus of deal documents — pitch decks, reference call transcripts, due-diligence reports — by surfacing **what the sources claim, where they conflict, and what the evidence-linked memo looks like**.

Built as a personal exploration of how an LLM-native deal-intelligence workspace could feel different from "another diligence document store + ChatGPT chat box".

---

## What it does

Three composable views over a single claim-extraction backbone:

1. **Contradictions** — cross-source pairs of claims that materially disagree, each side quoted verbatim with a source pill, severity-tagged. The killer feature: a deal team's biggest blind spot is the contradiction nobody noticed.
2. **Claims Explorer** — every atomic claim extracted from the corpus, filterable by topic and confidence (corroborated / single source / contested). Click any row to see all supporting and contradicting evidence from other sources.
3. **Investment Memo** — one-click draft memo where every factual assertion is a clickable citation pill that opens the source quote. Generated lazily, streamed as it's drafted.

All evidence is linked back to verbatim quotes, so an analyst can verify any assertion in two clicks.

## Approach & key design decisions

**The atom is a "claim", not a chat message.** Each claim is a normalized, declarative statement plus a verbatim quote, source document, and locator. Once that primitive is solid, contradictions, confidence scoring, and the memo are all *derivations* over the same data — not separate features.

**Two LLM passes, with a third on demand.**
- **Extract** — for each document, a Claude Sonnet 4.6 call with a strict tool-use schema returns 8–25 atomic claims. The system prompt enforces "every claim must be grounded in a verbatim quote — no paraphrasing".
- **Reconcile** — a single follow-up call takes all claims across all documents and returns (a) a list of cross-source contradictions and (b) a confidence label per claim. Same tool-use pattern.
- **Memo** — generated on demand (don't burn tokens until the analyst asks). Streamed. The model is instructed to embed citations as `[claim:CLAIM_ID]` tokens; the UI rewrites those into popover-equipped pills.

**Prompt caching** is applied to the system prompts so re-runs and multi-doc passes don't re-pay for instructions.

**Strict structured output** via Anthropic's tool-use forces every contradiction and confidence judgement through a schema that the UI can trust without defensive parsing. Reconcile output is post-validated to reject any claim IDs the model may have invented or duplicated, and to backfill missing claims as `single`.

**No backend.** State lives in `zustand` with localStorage persistence — corpus, analysis, memo, and API key all survive a refresh. The Anthropic SDK is called directly from the browser using `dangerouslyAllowBrowser: true`. This is a deliberate choice for a local-run prototype: it makes the project trivially cloneable, removes auth/server complexity from a short build, and keeps the demo's surface area small.

**UI is intentionally restrained.** Light theme, single accent colour, generous whitespace. The product has to look like something a deal partner would respect.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind v4 + a small Radix-primitives-based component layer
- Zustand for state, with `persist` middleware
- `@anthropic-ai/sdk` for Claude calls (Sonnet 4.6)
- `pdfjs-dist` for client-side PDF text extraction
- `react-markdown` + a custom citation-token rewriter for the memo view

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. You'll be prompted for an Anthropic API key on first load — get one at [console.anthropic.com](https://console.anthropic.com/settings/keys). The key is stored locally in your browser; it never leaves your machine except to call `api.anthropic.com`.

## What I'd build next

- **Server-side proxy for the Anthropic API.** Browser-side keys are fine for a local demo, not fine for any deployed version. A thin Next.js route handler would also unlock streaming-server-sent-events end-to-end without the SDK's browser shim.
- **Persistent multi-deal workspaces** backed by a real database, so a fund could keep deal rooms side by side and revisit prior diligence.
- **Open Questions engine** — a fourth view auto-generating the list of "things the analyst still needs to verify before IC". Falls out cheaply from the same claim graph; deferred only for time.
- **Quote-precise highlighting in the original PDF** using `pdf.js`'s text-layer, so a citation pill jumps you to the highlighted span in the source doc.
- **Risk categorization & severity scoring** as an additional lens — commercial / technical / security / founder / GTM, ranked by materiality.
- **Eval harness** with a frozen set of golden contradictions for the sample corpus. Right now any change to the extraction or reconciliation prompt is unverified; with goldens, a CI check could flag regressions on prompt edits.
- **Streaming progress for extraction.** Today the per-doc extraction call is non-streaming; switching to streaming with token-level updates would make the dashboard feel even more alive on long corpora.

## Known limitations

- Browser-side API key (called out above).
- No automated tests / no eval harness — all verification is manual.
- Single deal in flight at a time (single zustand store, no routing-by-deal-id).
- PDF parsing pulls the worker from a CDN matching the installed `pdfjs-dist` version. Offline use would need the worker bundled.
- Quote-verbatim discipline is enforced by prompt only; the UI doesn't yet verify that an extracted quote literally appears in the source text.
