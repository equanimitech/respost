# Postcard title / brief / summary — design

**Date:** 2026-05-20
**Status:** approved, ready for implementation plan
**Slice:** end-to-end vertical (lexicon → validation → URL → MCP → UI → publish → read → map)

## Problem

Postcards already declare three optional editorial fields conceptually:

- **title** — postcard headline (`og:title`).
- **summary** — short paragraph (`og:description`).
- **brief** — one-line teaser (map markers, link previews).

State today:

| Field   | Lexicon | Domain | Validate | URL | MCP | UI |
|---------|---------|--------|----------|-----|-----|----|
| title   | ✓       | ✓      | ✓        | ✗   | ✗   | ✗  |
| summary | ✓       | ✓      | ✓        | ✗   | ✗   | ✗  |
| brief   | ✗       | ✓      | ✗        | ✗   | ✗   | ✗  |

`title` and `summary` are wired through the lexicon, domain types, and `publishPostcard` write path, but cannot be authored (no composer UI) and cannot be prefilled (no URL or MCP params). `brief` is only a TypeScript field on `Postcard` and `PostcardMarker` — it is not in the lexicon, not validated, not written, not read.

## Goal

Make all three fields first-class across the full vertical:

1. Author via composer UI.
2. Prefill via `/compose` URL params.
3. Prefill via MCP `compose_url` tool.
4. Persist via AT Protocol record.
5. Read back into domain on hydration.
6. Render: title + summary as OG tags; brief on map markers + link cards.

All three remain **optional** — no migration of existing records, no new required fields.

## Non-goals (YAGNI)

- AI auto-fill of summary from blocks.
- Per-field locale.
- Editing published postcards.
- Cover-image override UI (lexicon already supports it; not part of this slice).
- Renaming or repurposing existing fields.

## Decisions captured during brainstorming

| Decision           | Choice                                                                 |
|--------------------|------------------------------------------------------------------------|
| Field count        | Three distinct — title, brief, summary.                                |
| Required vs optional | All three optional. Matches current lexicon, no migration.           |
| Brief authoring    | User-typed, privileged field (not auto-derived).                       |
| UI placement       | Title above blocks (Notion-style); brief + summary inside a collapsed `Details` panel. |
| Brief max length   | 80 graphemes (`maxLength: 160`).                                       |
| Disclosure primitive | Native `<details>` — no new dependency, accessible by default.       |
| Title rendering    | Plain `<input>` above the Tiptap editor. `postcard.title` stays distinct from H1-in-markdown-block. |

## Field caps

| Field   | `maxLength` (UTF-16) | `maxGraphemes` |
|---------|----------------------|----------------|
| title   | 200                  | 100 (existing) |
| brief   | 160                  | 80 (new)       |
| summary | 600                  | 300 (existing) |

## Slice 1 — Lexicon

`lexicons/postcard.json`: add `brief` between `summary` and `cover`.

```json
"brief": {
  "type": "string",
  "maxLength": 160,
  "maxGraphemes": 80,
  "description": "One-line teaser. Used on map markers and small link cards."
}
```

Backward-compatible: optional, no required-list change. Existing records read fine; `brief` resolves to `undefined`.

## Slice 2 — Domain validation

`domain/value-objects/postcard.ts`:

- Add `const MAX_BRIEF_GRAPHEMES = 80;`.
- Add `validateBrief(brief?: string): ValidationResult` mirroring `validateSummary`.
- In `validatePostcard`, call `validateBrief(command.brief)` between the title check and the summary check.

`domain/types/index.ts`: `Postcard.brief?` and `CreatePostcardCommand.brief?` already exist — no change.

## Slice 3 — URL contract

`application/composer/composeUrl.ts`:

Extend `composeUrlInputSchema`:

```ts
title:   z.string().max(200).optional(),
brief:   z.string().max(160).optional(),
summary: z.string().max(600).optional(),
```

`buildComposeUrl` sets each param when present (mirror the existing `to`/`from`/`place` branches). `encodeProposePayload` / `decodeProposePayload` are opaque-JSON — automatically picks up the new fields via the schema.

`/compose` page (the `nuqs` consumer of these params — file to be located during implementation): register three string parsers `title`, `brief`, `summary`. On mount, hydrate the composer state from them (same path as `to`/`from`/`place`).

## Slice 4 — MCP

`app/api/[transport]/route.ts`: extend `composeInputShape`.

```ts
title: z
  .string()
  .max(200)
  .optional()
  .describe("Postcard headline. Used as og:title."),
brief: z
  .string()
  .max(160)
  .optional()
  .describe("One-line teaser. Used on map markers and small link previews."),
summary: z
  .string()
  .max(600)
  .optional()
  .describe("Short summary. Used as og:description. May be AI-generated."),
```

No tool-level branching — the validation cascade already runs through `composeUrlInputSchema.safeParse(args)` and then `buildProposeUrl`.

## Slice 5 — Composer state + UI

`presenters/components/postcard-design/compose-flow/ComposerFlow.tsx`:

State additions:
- `title: string`, `brief: string`, `summary: string`.
- Hydrate from nuqs on mount.
- Persist alongside existing draft fields (same IndexedDB path the composer already uses — to be confirmed during implementation).

Layout (visual order, top → bottom):

1. To / From envelope (existing).
2. **Title input** — large bold `<input>`, no border by default, underline on focus. Placeholder `Title`. Maps to `postcard.title`. Grapheme counter (right-aligned, subtle, red past 100).
3. Block stack (existing Tiptap composer).
4. **`<details>` panel** labelled `Details`, collapsed by default. Contents:
   - `<textarea>` `Brief` — 1 line, placeholder `One-line teaser. Shows on the map.`. Counter 80.
   - `<textarea>` `Summary` — 3 lines, placeholder `Short paragraph for previews.`. Counter 300.

All three fields optional; empty strings normalize to `undefined` before publish (`.trim() || undefined`).

Grandparent-friendly: native disclosure triangle, plain labels, big hit areas, generous padding.

## Slice 6 — Publish

`application/actions/publishPostcard.ts`:

- Input type: add `brief?: string`.
- Command build: add `brief: input.brief?.trim() || undefined,` next to existing title/summary normalisation.
- Record build: pass `brief: command.brief` next to title/summary.

`infrastructure/atproto/client.ts`:

- `PostcardRecord` type: add `brief?: string;` next to `title?` and `summary?`.
- Write site already serialises optional string fields; add `brief` in the same conditional shape used by `title`/`summary`.

## Slice 7 — Read path

Record → domain mapping (location to confirm during implementation — likely the postcard query in `application/queries/`):

- Map `record.brief` → `Postcard.brief`.
- Confirm `record.title` and `record.summary` are already mapped; if not, add them as part of this slice.

Render sites:

- **Postcard view (`/p/[rkey]`)** — `<head>`:
  - `og:title` ← `postcard.title ?? postcard.to-based-fallback` (existing fallback preserved).
  - `og:description` ← `postcard.summary` when present.
- **Map markers** — popup/label text:
  - `marker.brief ?? marker.title ?? marker.place ?? ""` (in that order).
  - Populate `marker.brief` in the marker query alongside the existing `marker.title`.

## Slice 8 — Verification

No test runner is configured. Manual + type check.

- `pnpm lint` and `pnpm exec tsc --noEmit` clean.
- `/compose?title=Hello&brief=teaser&summary=longer%20paragraph` → fields prefill correctly.
- Publish a postcard with all three set → view `/p/[rkey]` → view-source confirms `og:title` and `og:description`.
- Open `/` map → marker popup shows brief.
- MCP smoke: `POST /api/mcp` with a `compose_url` payload that includes title/brief/summary → returned URL round-trips through the composer.
- Backward-compatibility: an existing postcard published before this change still renders without errors; missing fields fall back as specified.

## Risks

- **Draft persistence schema drift.** Composer IndexedDB drafts predate the new fields — old drafts must continue to load. Mitigation: read new keys with `?? ""` defaults; never assume presence.
- **Grapheme counting cost.** `Intl.Segmenter` runs per keystroke on three fields. Mitigation: debounce or memoise if the composer feels sluggish; cap recompute to value length > previous + small slack.
- **MCP token weight.** Three new optional input fields with descriptions add bytes to the MCP tool schema. Acceptable — descriptions stay one line each.

## Dependency graph (for the implementation plan)

```
Lexicon ──► Domain validation ──► URL contract ──► MCP
   │                                    │
   │                                    └──► Composer state + UI ──► Publish
   │
   └──► Read path (record → domain → OG + map)
```

Lexicon is the root. Validation, read-path, and URL contract can proceed in parallel after lexicon lands. UI depends on URL contract (for nuqs parsers) and state shape. MCP and Publish depend on URL contract + record shape. Map marker rendering depends on read-path.
