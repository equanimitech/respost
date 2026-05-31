---
migrated_from: equanimi.tech/project/respost/dev/20260519T183226Z-s7frsz.md
---

# Idea — Tiptap simple-editor for the composer

## What

Replace the plain `<textarea>` in `ComposerEditor.tsx` with Tiptap's [simple-editor template](https://tiptap.dev/docs/ui-components/templates/simple-editor). Keep `MarkdownBlock.md: string` as the on-the-wire format; add a markdown ↔ ProseMirror serializer in between.

## Why

* Users stop typing literal `**` / `*` and use a real bold/italic toolbar.

* The "**bold** and *italic* work" hint copy becomes redundant — the formatting affordance is now visible in the UI.

* Floating menu / bubble menu on selection — feels native on iOS Safari.

* Paste handling: pasting a URL in the middle of a paragraph can either auto-link it OR (better, matches our model) trigger the `unfurlUrl` action and offer to convert the URL into its own block.

* Slash-commands open a future path: `/photo`, `/song`, `/place` inside the text feel a lot more natural than the bottom-toolbar buttons for power users (keep the toolbar for first-time discoverability).

## Implementation outline

1. Install: `pnpm add @tiptap/react @tiptap/pm @tiptap/starter-kit tiptap-markdown` (or the simple-editor preset bundle).
2. Wrap a `<TiptapEditor>` component that:

   * Initialises with `tiptap-markdown` extension so `editor.storage.markdown.getMarkdown()` round-trips.

   * Exposes a controlled `value` (markdown string) ↔ `onChange(md)` contract identical to the current `textarea`.

   * Renders a slim toolbar (B / I / link / inline code) — match the design's paper aesthetic.
3. Drop into `ComposerEditor.tsx` in place of the textarea. The rest of the composer (block list, file pickers, preview, publish) is unchanged.
4. Keep `parseInline` in `domain/value-objects/markdown.ts` for read-side rendering — Tiptap is composer-only.

## Tradeoffs

* \~120 KB gzip for the editor bundle. Composer-only, code-split. Acceptable.

* Mobile soft-keyboard interactions with floating toolbars are finicky on iOS — Tiptap is the best in class but still requires testing.

* ProseMirror is opinionated about content structure. Our markdown is just bold + italic + paragraphs — well within what the markdown extension handles, but we have to disable headings, lists, blockquotes, code blocks etc. to keep the postcard voice constrained.

## Scope guardrails

* Don't store ProseMirror JSON in the lexicon. Stay on `md: string`. Tiptap is presentation.

* Don't extend the markdown grammar beyond what `parseInline` already supports — keep parity.

## Defer until

* After **legend-state** local-first lands (the in-flight subagent). The new editor sits cleanly on top of the new draft store. Doing both at once mixes concerns.

* Composer flow has been used end-to-end by at least one real person and we know the textarea pain is real.

