# Postcard title / brief / summary — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the three editorial postcard fields (title, brief, summary) end-to-end — lexicon, domain validation, URL params, MCP tool, composer UI, publish, and read path — so they can be authored, prefilled, persisted, and rendered.

**Architecture:** Single vertical slice. `brief` is added to the lexicon (the other two already exist); each layer is extended in the same shape as the existing `title` / `summary` plumbing. UI exposes `title` as a privileged inline input above the block stack and tucks `brief` + `summary` into a native `<details>` panel below.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript strict, Zod, nuqs, mcp-handler, @legendapp/state (IndexedDB drafts), Tailwind 4, AT Protocol.

**Spec:** `docs/superpowers/specs/2026-05-20-postcard-title-brief-summary-design.md`

**Project verification model:** No test runner is configured. Each task's verification step uses `pnpm exec tsc --noEmit` (strict type-check) and `pnpm lint`. Task 11 is the manual end-to-end smoke.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `lexicons/postcard.json` | modify | Add `brief` field. |
| `domain/value-objects/postcard.ts` | modify | `validateBrief` + integration into `validatePostcard`. |
| `infrastructure/atproto/client.ts` | modify | `PostcardRecord.brief?: string`. |
| `application/queries/getPostcards.ts` | modify | Map `record.brief` → `Postcard.brief` in `toDomain`. |
| `application/actions/publishPostcard.ts` | modify | `PublishInput.brief`, command + record write. |
| `application/composer/composeUrl.ts` | modify | Add `title`/`brief`/`summary` to schema + `buildComposeUrl`. |
| `app/api/[transport]/route.ts` | modify | Add `title`/`brief`/`summary` to MCP `compose_url` input shape. |
| `infrastructure/local/draftStore.ts` | modify | Persist `title`/`brief`/`summary` on `Draft`, `DraftSeed`, `DraftPatch`, `createDraft`, `saveDraft`. |
| `presenters/components/postcard-design/compose-flow/ComposerFlow.tsx` | modify | nuqs parsers, propose decoding, draft hydration, publish payload. |
| `presenters/components/postcard-design/composer/ComposerWorkspace.tsx` | modify | Title input above editor, `<details>` panel for brief + summary, prop plumbing. |

Read sites that already consume the fields and need **no change**:

- `app/p/[rkey]/page.tsx` — already uses `postcard.title` / `postcard.summary` for OG metadata.
- `presenters/components/Map/PostcardMap.tsx` — already renders `marker.title` and `marker.brief` in the popup.
- `application/queries/getPostcards.ts::getPostcardMarkers` — already projects `p.brief` into `PostcardMarker`. (Only the `toDomain` mapping needs the new field; the marker query already reads it.)

---

## Task 1: Add `brief` to the lexicon

**Files:**
- Modify: `lexicons/postcard.json`

- [ ] **Step 1: Add the `brief` field**

Open `lexicons/postcard.json`. After the `summary` field block (ends on the line with `"May be human-written or AI-generated."`) and before the `cover` field, insert:

```json
          "brief": {
            "type": "string",
            "maxLength": 160,
            "maxGraphemes": 80,
            "description": "One-line teaser. Used on map markers and small link cards."
          },
```

Make sure the preceding `summary` block closes with `},` (it does) and that `cover` still parses. Field order in JSON does not affect AT Protocol, but the file reads better if `brief` sits between `summary` and `cover`.

- [ ] **Step 2: Validate the JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('lexicons/postcard.json','utf8')); console.log('ok')"`
Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add lexicons/postcard.json
git commit -m "lexicon: add postcard.brief (80 graphemes) for map markers and previews"
```

---

## Task 2: Add `validateBrief` in the domain

**Files:**
- Modify: `domain/value-objects/postcard.ts`

- [ ] **Step 1: Add the `MAX_BRIEF_GRAPHEMES` constant**

In `domain/value-objects/postcard.ts`, find the block of length constants near the top:

```ts
const MAX_TITLE_GRAPHEMES = 100;
const MAX_SUMMARY_GRAPHEMES = 300;
```

Insert `MAX_BRIEF_GRAPHEMES` between them so the file reads:

```ts
const MAX_TITLE_GRAPHEMES = 100;
const MAX_BRIEF_GRAPHEMES = 80;
const MAX_SUMMARY_GRAPHEMES = 300;
```

- [ ] **Step 2: Add `validateBrief`**

After the `validateTitle` function (ends with the closing `}` of `validateTitle`), insert:

```ts
export function validateBrief(brief: string | undefined): ValidationResult {
  if (brief === undefined || brief.trim().length === 0) return { valid: true };
  if (graphemes(brief) > MAX_BRIEF_GRAPHEMES) {
    return {
      valid: false,
      error: `Brief must be ${MAX_BRIEF_GRAPHEMES} characters or less`,
    };
  }
  return { valid: true };
}
```

- [ ] **Step 3: Call `validateBrief` from `validatePostcard`**

In `validatePostcard` find the title/summary sequence:

```ts
  const title = validateTitle(command.title);
  if (title.valid === false) return title;

  const summary = validateSummary(command.summary);
  if (summary.valid === false) return summary;
```

Insert a brief check between them:

```ts
  const title = validateTitle(command.title);
  if (title.valid === false) return title;

  const brief = validateBrief(command.brief);
  if (brief.valid === false) return brief;

  const summary = validateSummary(command.summary);
  if (summary.valid === false) return summary;
```

- [ ] **Step 4: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add domain/value-objects/postcard.ts
git commit -m "domain: validate postcard.brief (80 graphemes, optional)"
```

---

## Task 3: Add `brief` to `PostcardRecord`

**Files:**
- Modify: `infrastructure/atproto/client.ts`

- [ ] **Step 1: Add the field**

In `infrastructure/atproto/client.ts` find:

```ts
export type PostcardRecord = {
  $type: typeof POSTCARD_COLLECTION;
  to: string;
  from: string;
  place?: string;
  senderLocation?: LocationField;
  title?: string;
  summary?: string;
  cover?: CoverBlob;
  blocks: ReadonlyArray<BlockRecord>;
  createdAt: string;
};
```

Insert `brief?: string;` between `title?` and `summary?`:

```ts
export type PostcardRecord = {
  $type: typeof POSTCARD_COLLECTION;
  to: string;
  from: string;
  place?: string;
  senderLocation?: LocationField;
  title?: string;
  brief?: string;
  summary?: string;
  cover?: CoverBlob;
  blocks: ReadonlyArray<BlockRecord>;
  createdAt: string;
};
```

No other change in this file — `createPostcardRecord` already serialises whatever keys are present on its argument.

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add infrastructure/atproto/client.ts
git commit -m "infra(atproto): add PostcardRecord.brief"
```

---

## Task 4: Map `record.brief` → `Postcard.brief`

**Files:**
- Modify: `application/queries/getPostcards.ts`

- [ ] **Step 1: Add `brief` to the `toDomain` mapping**

Open `application/queries/getPostcards.ts`. Find the object literal in `toDomain` that builds the `Postcard`. Around line 149 it reads:

```ts
    title: record.title,
    summary: record.summary,
```

Insert the `brief` line between them:

```ts
    title: record.title,
    brief: record.brief,
    summary: record.summary,
```

(`getPostcardMarkers` already projects `p.brief` into the returned `PostcardMarker` — no change there.)

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add application/queries/getPostcards.ts
git commit -m "query: hydrate postcard.brief from record"
```

---

## Task 5: Wire `brief` through `publishPostcard`

**Files:**
- Modify: `application/actions/publishPostcard.ts`

- [ ] **Step 1: Add `brief` to `PublishInput`**

Find:

```ts
export type PublishInput = {
  to: string;
  from: string;
  place?: string;
  senderLocation?: SenderLocationInput;
  title?: string;
  summary?: string;
  cover?: DraftBlobRef;
  blocks: ReadonlyArray<DraftBlock>;
};
```

Insert `brief?: string;` between `title?` and `summary?`:

```ts
export type PublishInput = {
  to: string;
  from: string;
  place?: string;
  senderLocation?: SenderLocationInput;
  title?: string;
  brief?: string;
  summary?: string;
  cover?: DraftBlobRef;
  blocks: ReadonlyArray<DraftBlock>;
};
```

- [ ] **Step 2: Normalise `brief` into the command**

Inside `publishPostcard`, find the command literal around line 226:

```ts
    const command: CreatePostcardCommand = {
      to: input.to.trim(),
      from: input.from.trim(),
      place: input.place?.trim(),
      senderLocation,
      title: input.title?.trim() || undefined,
      summary: input.summary?.trim() || undefined,
```

Insert the `brief` line between `title` and `summary`:

```ts
    const command: CreatePostcardCommand = {
      to: input.to.trim(),
      from: input.from.trim(),
      place: input.place?.trim(),
      senderLocation,
      title: input.title?.trim() || undefined,
      brief: input.brief?.trim() || undefined,
      summary: input.summary?.trim() || undefined,
```

- [ ] **Step 3: Write `brief` into the persisted record**

Find the `createPostcardRecord({...})` call. It includes:

```ts
      title: command.title,
      summary: command.summary,
```

Insert `brief` between them:

```ts
      title: command.title,
      brief: command.brief,
      summary: command.summary,
```

- [ ] **Step 4: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add application/actions/publishPostcard.ts
git commit -m "action: publish postcard.brief alongside title and summary"
```

---

## Task 6: Add title/brief/summary to the compose URL contract

**Files:**
- Modify: `application/composer/composeUrl.ts`

- [ ] **Step 1: Extend `composeUrlInputSchema`**

Find the schema:

```ts
const composeUrlInputSchema = z.object({
  to: z.string().max(80).optional(),
  from: z.string().max(80).optional(),
  place: z.string().max(160).optional(),
  blocks: draftBlocksSchema.optional(),
});
```

Replace it with:

```ts
const composeUrlInputSchema = z.object({
  to: z.string().max(80).optional(),
  from: z.string().max(80).optional(),
  place: z.string().max(160).optional(),
  title: z.string().max(200).optional(),
  brief: z.string().max(160).optional(),
  summary: z.string().max(600).optional(),
  blocks: draftBlocksSchema.optional(),
});
```

- [ ] **Step 2: Set the new params in `buildComposeUrl`**

Find:

```ts
export function buildComposeUrl(input: ComposeUrlInput): string {
  const params = new URLSearchParams();
  if (input.to) params.set("to", input.to);
  if (input.from) params.set("from", input.from);
  if (input.place) params.set("place", input.place);
  if (input.blocks && input.blocks.length > 0) {
    params.set("blocks", JSON.stringify(input.blocks));
  }
  const qs = params.toString();
  return qs ? `${siteOrigin()}/compose?${qs}` : `${siteOrigin()}/compose`;
}
```

Insert the three new params after `place` and before the `blocks` branch:

```ts
export function buildComposeUrl(input: ComposeUrlInput): string {
  const params = new URLSearchParams();
  if (input.to) params.set("to", input.to);
  if (input.from) params.set("from", input.from);
  if (input.place) params.set("place", input.place);
  if (input.title) params.set("title", input.title);
  if (input.brief) params.set("brief", input.brief);
  if (input.summary) params.set("summary", input.summary);
  if (input.blocks && input.blocks.length > 0) {
    params.set("blocks", JSON.stringify(input.blocks));
  }
  const qs = params.toString();
  return qs ? `${siteOrigin()}/compose?${qs}` : `${siteOrigin()}/compose`;
}
```

The propose codec (`encodeProposePayload` / `decodeProposePayload`) needs no change — it is an opaque JSON dump of the same schema.

- [ ] **Step 3: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add application/composer/composeUrl.ts
git commit -m "composer: carry title/brief/summary in compose URL contract"
```

---

## Task 7: Expose title/brief/summary on the MCP `compose_url` tool

**Files:**
- Modify: `app/api/[transport]/route.ts`

- [ ] **Step 1: Add the three fields to `composeInputShape`**

Find the existing shape and insert `title`, `brief`, `summary` between `place` and `blocks`:

```ts
const composeInputShape = {
  to: z
    .string()
    .max(80)
    .optional()
    .describe("Recipient name as written on the envelope."),
  from: z
    .string()
    .max(80)
    .optional()
    .describe("Sender display name."),
  place: z
    .string()
    .max(160)
    .optional()
    .describe("Sender's place line (e.g. 'Barcelona', 'from the train')."),
  title: z
    .string()
    .max(200)
    .optional()
    .describe("Postcard headline. Used as og:title."),
  brief: z
    .string()
    .max(160)
    .optional()
    .describe(
      "One-line teaser. Used on map markers and small link previews."
    ),
  summary: z
    .string()
    .max(600)
    .optional()
    .describe(
      "Short summary. Used as og:description. May be AI-generated."
    ),
  blocks: z
    .array(draftBlockSchema)
    .max(40)
    .optional()
    .describe(
      [
        "Ordered body blocks. Use md/music/video/place/article.",
        "Photo blocks are rejected — photos must be uploaded in the composer.",
        "`md` content is markdown rendered through tiptap-markdown with",
        "StarterKit (heading/codeBlock off, html off, tightLists, breaks).",
        "Supported: paragraphs, bold, italic, links, bullet/ordered lists,",
        "blockquote, horizontal rule, inline code. Not supported:",
        "`#` headings, fenced code blocks, tables, image syntax, raw HTML.",
        "Interleave md and media blocks (md / media / md / media).",
        "Do not embed links inside md — use article/music/video/place blocks.",
      ].join(" ")
    ),
};
```

No handler-body change — `composeUrlInputSchema.safeParse(args)` already gates the data and `buildProposeUrl` already serialises every key on the schema.

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/[transport]/route.ts
git commit -m "mcp: accept title/brief/summary on compose_url"
```

---

## Task 8: Persist title/brief/summary on local drafts

**Files:**
- Modify: `infrastructure/local/draftStore.ts`

- [ ] **Step 1: Extend the `Draft` type**

Find:

```ts
export type Draft = {
  readonly id: DraftId;
  readonly to: string;
  readonly from: string;
  readonly place: string;
  readonly blocks: ReadonlyArray<DraftBlock>;
  readonly createdAt: number;
  readonly updatedAt: number;
};
```

Add three optional-but-stored-as-empty-string fields between `place` and `blocks`:

```ts
export type Draft = {
  readonly id: DraftId;
  readonly to: string;
  readonly from: string;
  readonly place: string;
  readonly title: string;
  readonly brief: string;
  readonly summary: string;
  readonly blocks: ReadonlyArray<DraftBlock>;
  readonly createdAt: number;
  readonly updatedAt: number;
};
```

Empty strings (rather than `undefined`) match the existing pattern for `to`/`from`/`place` and keep the IndexedDB row shape simple.

- [ ] **Step 2: Extend `DraftSeed`**

Find:

```ts
export type DraftSeed = {
  readonly to?: string;
  readonly from?: string;
  readonly place?: string;
  readonly blocks?: ReadonlyArray<DraftBlock>;
};
```

Add the three fields:

```ts
export type DraftSeed = {
  readonly to?: string;
  readonly from?: string;
  readonly place?: string;
  readonly title?: string;
  readonly brief?: string;
  readonly summary?: string;
  readonly blocks?: ReadonlyArray<DraftBlock>;
};
```

- [ ] **Step 3: Default them inside `createDraft`**

Replace the existing literal:

```ts
  const draft: Draft = {
    id: newDraftId(),
    to: seed.to ?? "",
    from: seed.from ?? "",
    place: seed.place ?? "",
    blocks: seed.blocks ?? [],
    createdAt: now,
    updatedAt: now,
  };
```

with:

```ts
  const draft: Draft = {
    id: newDraftId(),
    to: seed.to ?? "",
    from: seed.from ?? "",
    place: seed.place ?? "",
    title: seed.title ?? "",
    brief: seed.brief ?? "",
    summary: seed.summary ?? "",
    blocks: seed.blocks ?? [],
    createdAt: now,
    updatedAt: now,
  };
```

- [ ] **Step 4: Extend `DraftPatch` and `saveDraft`**

Replace `DraftPatch`:

```ts
export type DraftPatch = {
  readonly to?: string;
  readonly from?: string;
  readonly place?: string;
  readonly title?: string;
  readonly brief?: string;
  readonly summary?: string;
  readonly blocks?: ReadonlyArray<DraftBlock>;
};
```

Inside `saveDraft`, replace the `next` literal:

```ts
  const next: Draft = {
    ...existing,
    to: patch.to ?? existing.to,
    from: patch.from ?? existing.from,
    place: patch.place ?? existing.place,
    title: patch.title ?? existing.title ?? "",
    brief: patch.brief ?? existing.brief ?? "",
    summary: patch.summary ?? existing.summary ?? "",
    blocks: patch.blocks ?? existing.blocks,
    updatedAt: Date.now(),
  };
```

The `?? ""` chain on the three new fields guards drafts written before this change (whose IndexedDB rows have no `title` / `brief` / `summary` key).

- [ ] **Step 5: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add infrastructure/local/draftStore.ts
git commit -m "draftStore: persist title/brief/summary on local drafts"
```

---

## Task 9: Wire the three fields through `ComposerFlow`

**Files:**
- Modify: `presenters/components/postcard-design/compose-flow/ComposerFlow.tsx`

- [ ] **Step 1: Add nuqs parsers**

Find:

```ts
const composerParsers = {
  to: parseAsString.withDefault(""),
  from: parseAsString.withDefault(""),
  place: parseAsString.withDefault(""),
  step: parseAsStringEnum<Step>([...STEPS]).withDefault("recipient"),
  preview: parseAsBoolean.withDefault(false),
  blocks: blocksParser,
  draft: parseAsString.withDefault(""),
  propose: parseAsString.withDefault(""),
};
```

Insert `title`/`brief`/`summary` between `place` and `step`:

```ts
const composerParsers = {
  to: parseAsString.withDefault(""),
  from: parseAsString.withDefault(""),
  place: parseAsString.withDefault(""),
  title: parseAsString.withDefault(""),
  brief: parseAsString.withDefault(""),
  summary: parseAsString.withDefault(""),
  step: parseAsStringEnum<Step>([...STEPS]).withDefault("recipient"),
  preview: parseAsBoolean.withDefault(false),
  blocks: blocksParser,
  draft: parseAsString.withDefault(""),
  propose: parseAsString.withDefault(""),
};
```

- [ ] **Step 2: Hydrate from `?propose=` payload**

In the mount effect, find the `if (state.propose)` branch. It currently sets `patch.to`, `patch.from`, `patch.place`, `patch.blocks`. Extend the `createDraft` call and the `patch` writes:

```ts
        if (decoded) {
          const created = createDraft({
            to: decoded.to,
            from: decoded.from ?? defaultSender,
            place: decoded.place ?? defaultPlace,
            title: decoded.title,
            brief: decoded.brief,
            summary: decoded.summary,
            blocks: decoded.blocks ?? [],
          });
          draftIdRef.current = created.id;
          patch.to = created.to;
          patch.from = created.from;
          patch.place = created.place;
          patch.title = created.title;
          patch.brief = created.brief;
          patch.summary = created.summary;
          patch.blocks = created.blocks;
          patch.draft = created.id;
          if (created.to) patch.step = "editor";
        }
```

- [ ] **Step 3: Hydrate from `?draft=`**

In the `else if (state.draft)` branch find the load block:

```ts
        const loaded = getDraft(state.draft as DraftId);
        if (loaded) {
          draftIdRef.current = loaded.id;
          patch.to = loaded.to;
          patch.from = loaded.from;
          patch.place = loaded.place;
          patch.blocks = loaded.blocks;
          if (loaded.to && state.step === "recipient") patch.step = "editor";
        }
```

Insert the three loaded fields:

```ts
        const loaded = getDraft(state.draft as DraftId);
        if (loaded) {
          draftIdRef.current = loaded.id;
          patch.to = loaded.to;
          patch.from = loaded.from;
          patch.place = loaded.place;
          patch.title = loaded.title ?? "";
          patch.brief = loaded.brief ?? "";
          patch.summary = loaded.summary ?? "";
          patch.blocks = loaded.blocks;
          if (loaded.to && state.step === "recipient") patch.step = "editor";
        }
```

The `?? ""` guards drafts persisted before Task 8.

- [ ] **Step 4: Mirror the new fields into IndexedDB**

Find the persist effect (the second `useEffect`). Extend the `createDraft` call inside:

```ts
    if (!draftIdRef.current) {
      const created = createDraft({
        to: state.to,
        from: state.from,
        place: state.place,
        title: state.title,
        brief: state.brief,
        summary: state.summary,
        blocks: state.blocks,
      });
      draftIdRef.current = created.id;
      setState({ draft: created.id });
    } else {
      saveDraft(draftIdRef.current, {
        to: state.to,
        from: state.from,
        place: state.place,
        title: state.title,
        brief: state.brief,
        summary: state.summary,
        blocks: state.blocks,
      });
    }
```

Then update the dependency array to include the new fields:

```ts
  }, [
    hydrated,
    state.to,
    state.from,
    state.place,
    state.title,
    state.brief,
    state.summary,
    state.blocks,
    setState,
  ]);
```

Leave the existing `meaningful` predicate unchanged:

```ts
    const meaningful = state.to.length > 0 || state.blocks.length > 0;
```

Title/brief/summary alone do **not** mint a draft. A draft is still created only once there is a recipient or a block. This matches the existing low-friction default and keeps the IndexedDB store from filling with abandoned title-only stubs.

- [ ] **Step 5: Clear the three fields in `clearDraft`**

Find `clearDraft`:

```ts
  const clearDraft = () =>
    setState({
      to: "",
      from: "",
      place: "",
      step: "recipient",
      preview: false,
      blocks: [],
      draft: "",
    });
```

Add the three new fields:

```ts
  const clearDraft = () =>
    setState({
      to: "",
      from: "",
      place: "",
      title: "",
      brief: "",
      summary: "",
      step: "recipient",
      preview: false,
      blocks: [],
      draft: "",
    });
```

- [ ] **Step 6: Send the three fields to `publishPostcard`**

Find the `onPublish` handler and extend the payload:

```ts
      const result = await publishPostcard({
        to,
        from: state.from,
        place: state.place || undefined,
        title: state.title || undefined,
        brief: state.brief || undefined,
        summary: state.summary || undefined,
        blocks,
      });
```

- [ ] **Step 7: Forward the new fields to `ComposerWorkspace`**

Find the JSX that returns `<ComposerWorkspace ... />` and extend its props. The full prop list becomes:

```tsx
    <ComposerWorkspace
      to={to}
      title={state.title}
      brief={state.brief}
      summary={state.summary}
      blocks={blocks}
      preview={preview}
      onChange={onChangeBlocks}
      onChangeTitle={(next) => setState({ title: next })}
      onChangeBrief={(next) => setState({ brief: next })}
      onChangeSummary={(next) => setState({ summary: next })}
      onChangeMode={(next) => setState({ preview: next })}
      onChangeRecipient={() => setState({ step: "recipient" })}
      onClose={close}
      onPublish={onPublish}
      publishing={publishing}
      error={error}
      resolveImageUrl={resolveImageUrl}
      onRegisterPreviewUrl={registerPreviewUrl}
    />
```

(Task 10 wires the matching props on the workspace side; type-check after both tasks.)

- [ ] **Step 8: Type-check (deferred to after Task 10)**

The `ComposerWorkspace` prop additions in this task will not type-check until Task 10 lands. That's intentional — they are two halves of the same UI plumbing and must be committed atomically.

**Do not commit this task on its own.** Skip the commit step and move straight to Task 10.

---

## Task 10: Title input + Details panel in `ComposerWorkspace`

**Files:**
- Modify: `presenters/components/postcard-design/composer/ComposerWorkspace.tsx`

- [ ] **Step 1: Extend the props type**

Near the top of the file, the props type (around line 32) currently exposes `to`, `blocks`, callbacks, etc. Add the new fields and callbacks. The full props type becomes:

```ts
type Props = {
  to: string;
  title: string;
  brief: string;
  summary: string;
  blocks: ReadonlyArray<DraftBlock>;
  preview: boolean;
  onChange: (next: ReadonlyArray<DraftBlock>) => void;
  onChangeTitle: (next: string) => void;
  onChangeBrief: (next: string) => void;
  onChangeSummary: (next: string) => void;
  onChangeMode: (next: boolean) => void;
  onChangeRecipient: () => void;
  onClose: () => void;
  onPublish: () => void;
  publishing: boolean;
  error: string | null;
  resolveImageUrl: (ref: string) => string | undefined;
  onRegisterPreviewUrl: (ref: string, url: string) => void;
};
```

(If the existing props type has a different exact shape, preserve any field this list does not name — only add the new fields and callbacks above.)

- [ ] **Step 2: Destructure the new props**

In the function signature destructuring at the top of `ComposerWorkspace`, add the new fields:

```ts
export function ComposerWorkspace({
  to,
  title,
  brief,
  summary,
  blocks,
  preview,
  onChange,
  onChangeTitle,
  onChangeBrief,
  onChangeSummary,
  onChangeMode,
  onChangeRecipient,
  onClose,
  onPublish,
  publishing,
  error,
  resolveImageUrl,
  onRegisterPreviewUrl,
}: Props) {
```

Preserve any other destructured fields the original signature uses.

- [ ] **Step 3: Add a `graphemeCount` helper at module scope**

Above the `ComposerWorkspace` function (after the existing imports / helpers), add:

```ts
function graphemeCount(s: string): number {
  try {
    const Seg = (Intl as unknown as {
      Segmenter?: new (...a: unknown[]) => { segment(s: string): Iterable<unknown> };
    }).Segmenter;
    if (Seg) {
      const seg = new Seg("en", { granularity: "grapheme" });
      let n = 0;
      for (const _ of seg.segment(s)) n++;
      return n;
    }
  } catch {
    /* fall through */
  }
  return s.length;
}

const TITLE_MAX = 100;
const BRIEF_MAX = 80;
const SUMMARY_MAX = 300;
```

- [ ] **Step 4: Insert the title input above the editor**

Inside the canvas card (the `<div>` whose `background: "var(--paper-light)"` styles begin around line 308), the current render is:

```tsx
          {preview ? (
            blocks.map(...)
          ) : (
            <>
              {empty && (
                <button ...>Tap to add photo</button>
              )}

              <div style={{ position: "relative", padding: "14px 22px 20px", flex: 1 }}>
                {empty && (<div className="t-mono" ...>{t("writeHere")}</div>)}
                <TiptapPostcardEditor ... />
              </div>
            </>
          )}
```

Insert a title input **above** the `{empty && (<button ...>)}` block, inside the `<>` fragment, so it always shows in author mode and at the very top of the canvas:

```tsx
              <div style={{ padding: "14px 22px 0", display: "flex", flexDirection: "column", gap: 2 }}>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => onChangeTitle(e.target.value)}
                  placeholder={t("titlePlaceholder")}
                  aria-label={t("titleAria")}
                  maxLength={200}
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: "var(--ink)",
                    fontFamily: "inherit",
                    fontSize: 22,
                    fontWeight: 600,
                    lineHeight: 1.2,
                    padding: "4px 0",
                    borderBottom: "1px solid transparent",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "var(--paper-edge)")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "transparent")}
                />
                {title.length > 0 && (
                  <div
                    style={{
                      alignSelf: "flex-end",
                      fontSize: 10,
                      color:
                        graphemeCount(title) > TITLE_MAX
                          ? "var(--stamp-red)"
                          : "var(--ink-faint)",
                    }}
                  >
                    {graphemeCount(title)}/{TITLE_MAX}
                  </div>
                )}
              </div>
```

- [ ] **Step 5: Insert the `<details>` panel below the canvas**

After the canvas card's closing `</div>` (search for the closing of the `<div>` opened around line 307; it ends just before the `{photoError && !preview && (...)}` block), insert a sibling `<details>` element. The result reads:

```tsx
        {/* end canvas card */}
        </div>

        {!preview && (
          <details
            style={{
              margin: "10px 22px 0",
              fontSize: 13,
              color: "var(--ink)",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontFamily: "inherit",
                color: "var(--ink-mute)",
                padding: "6px 0",
                userSelect: "none",
              }}
            >
              {t("detailsLabel")}
            </summary>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "8px 0 4px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 11, color: "var(--ink-mute)" }}>{t("briefLabel")}</span>
                <textarea
                  value={brief}
                  onChange={(e) => onChangeBrief(e.target.value)}
                  placeholder={t("briefPlaceholder")}
                  rows={1}
                  maxLength={160}
                  style={{
                    width: "100%",
                    border: "1px solid var(--paper-edge)",
                    borderRadius: 6,
                    background: "var(--paper-light)",
                    color: "var(--ink)",
                    fontFamily: "inherit",
                    fontSize: 13,
                    lineHeight: 1.4,
                    padding: "6px 8px",
                    resize: "vertical",
                  }}
                />
                <span
                  style={{
                    alignSelf: "flex-end",
                    fontSize: 10,
                    color:
                      graphemeCount(brief) > BRIEF_MAX
                        ? "var(--stamp-red)"
                        : "var(--ink-faint)",
                  }}
                >
                  {graphemeCount(brief)}/{BRIEF_MAX}
                </span>
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 11, color: "var(--ink-mute)" }}>{t("summaryLabel")}</span>
                <textarea
                  value={summary}
                  onChange={(e) => onChangeSummary(e.target.value)}
                  placeholder={t("summaryPlaceholder")}
                  rows={3}
                  maxLength={600}
                  style={{
                    width: "100%",
                    border: "1px solid var(--paper-edge)",
                    borderRadius: 6,
                    background: "var(--paper-light)",
                    color: "var(--ink)",
                    fontFamily: "inherit",
                    fontSize: 13,
                    lineHeight: 1.45,
                    padding: "6px 8px",
                    resize: "vertical",
                  }}
                />
                <span
                  style={{
                    alignSelf: "flex-end",
                    fontSize: 10,
                    color:
                      graphemeCount(summary) > SUMMARY_MAX
                        ? "var(--stamp-red)"
                        : "var(--ink-faint)",
                  }}
                >
                  {graphemeCount(summary)}/{SUMMARY_MAX}
                </span>
              </label>
            </div>
          </details>
        )}
```

- [ ] **Step 6: Add the i18n strings**

This codebase uses `next-intl`. Find the message catalog used by the editor namespace — search for one of the existing keys that the workspace uses:

```bash
rg -l "tapToAddPhoto" /Users/rafa/Developer/equanimitech/respost/messages
```

Open the matching file(s) (one per supported locale; typically `messages/en.json` and similar) and add the following keys under the `editor` namespace. Provide an English version and a placeholder for each other locale (the strings can be polished later):

```json
"editor": {
  "...existing keys": "...",
  "titlePlaceholder": "Title",
  "titleAria": "Postcard title",
  "detailsLabel": "Details",
  "briefLabel": "Brief",
  "briefPlaceholder": "One-line teaser. Shows on the map.",
  "summaryLabel": "Summary",
  "summaryPlaceholder": "Short paragraph for previews."
}
```

For non-English locale files, copy the same English strings as a starting point; flag in the commit message that translations need a follow-up pass.

- [ ] **Step 7: Type-check and lint**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: no errors. This is the type-check that also validates the new `ComposerFlow` props from Task 9.

- [ ] **Step 8: Commit Tasks 9 and 10 together**

```bash
git add presenters/components/postcard-design/compose-flow/ComposerFlow.tsx \
        presenters/components/postcard-design/composer/ComposerWorkspace.tsx \
        messages/
git commit -m "$(cat <<'EOF'
composer: author title (inline) and brief/summary (Details panel)

Title becomes a privileged input above the block editor. Brief and
summary live in a collapsed native <details> panel below the canvas.
All three flow through URL params, IndexedDB drafts, publish payload,
and the propose codec.

Translations for non-English locales are placeholders; follow-up.
EOF
)"
```

---

## Task 11: End-to-end manual smoke

**Files:** none.

- [ ] **Step 1: Start the dev server**

```bash
pnpm dev
```

Expected: server listening on http://localhost:3000.

- [ ] **Step 2: URL prefill round-trip**

Open `http://localhost:3000/compose?to=Grandma&from=Rafa&title=Hello%20from%20Lisbon&brief=Sunlight%20on%20the%20tiles&summary=A%20note%20about%20the%20river%20and%20a%20pastel%20de%20nata%20at%20midnight.`

Confirm:
- Title field shows `Hello from Lisbon`.
- Expanding **Details** shows brief = `Sunlight on the tiles` and summary = the long sentence.
- Character counters render.

- [ ] **Step 3: Publish and verify OG metadata**

Add at least one text block, then click **Publish**.

After redirect to `/sent/<rkey>`, copy the postcard URL and open `view-source:http://localhost:3000/p/<rkey>`. Confirm the `<head>` contains:

- `<title>Hello from Lisbon ...</title>`
- `<meta property="og:title" content="Hello from Lisbon" ...>`
- `<meta property="og:description" content="A note about the river ..." ...>`

- [ ] **Step 4: Map marker brief**

Open `http://localhost:3000/map`. Click the marker for the new postcard.
Expected popup shows the title on the first line and the brief on the second line.

- [ ] **Step 5: MCP round-trip**

In a second terminal, hit the MCP route directly:

```bash
curl -s -X POST http://localhost:3000/api/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json,text/event-stream' \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "compose_url",
      "arguments": {
        "to": "Grandma",
        "title": "Hello from Lisbon",
        "brief": "Sunlight on the tiles",
        "summary": "A note about the river.",
        "blocks": [{ "type": "md", "md": "It was a good day." }]
      }
    }
  }'
```

Expected: a JSON-RPC response whose `result.content[0].text` is a URL of the form `http://localhost:3000/compose?propose=...`. Open it in a browser and confirm the three fields prefill exactly as in Step 2 (the propose codec round-trips them through IndexedDB).

- [ ] **Step 6: Backward compatibility**

Open an older postcard published before this change (any record without the new fields) at `/p/<old-rkey>`. Expected:

- Page renders without errors.
- OG title falls back to `Postcard for ...` (existing `t("postcardFor")` fallback).
- OG description falls back to the `sentFromPlace` / `sentNoPlace` strings.
- Map marker for an old postcard shows only the title fallback (no brief line) and does not crash.

- [ ] **Step 7: Old-draft compatibility**

In DevTools → Application → IndexedDB → `respost` → `drafts`, locate a draft row created before this change (no `title` / `brief` / `summary` keys). Open `/compose?draft=<that-id>`. Expected: the composer opens cleanly with empty title/brief/summary; no crash, no warning.

- [ ] **Step 8: Final commit (no code, but record the smoke pass)**

If everything above passes, the work is shippable. No commit needed — the smoke is a verification gate, not a code change.

If anything fails, fix the smallest reproduction, re-run the relevant smoke step, and add a follow-up commit describing the fix.

---

## Self-review notes

- **Spec coverage:** Slices 1–8 of the spec map onto Tasks 1–11. Slice 1 → Task 1. Slice 2 → Task 2. Slice 3 → Task 6 + Task 9 (URL contract + nuqs parsers). Slice 4 → Task 7. Slice 5 → Tasks 8–10 (state + draft + UI). Slice 6 → Tasks 3 + 5. Slice 7 → Task 4 (the OG and map render sites already consume the fields once `Postcard.brief` is hydrated). Slice 8 → Task 11.
- **Risks from spec:** draft schema drift (Task 8 + Task 9 use `?? ""` guards; Task 11 step 7 verifies old drafts), grapheme counting cost (Task 10's `graphemeCount` runs on input change of three small fields — acceptable; debounce only if user-visible lag appears).
- **Atomic commit:** Tasks 9 and 10 are committed together because the `ComposerFlow` ↔ `ComposerWorkspace` prop change is one logical edit split across two files.
