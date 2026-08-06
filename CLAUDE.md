# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Respost sends a **virtual postcard as a link**. The sender writes a block-structured document at `/compose`, publishes it to their AT Protocol PDS, and hands the URL to someone via WhatsApp/Telegram/email. The recipient opens a sealed-envelope page — no account, no feed, no app. The map (`/map`) is a sender-only archive, not the main interface.

See `README.md` for the product narrative and `docs/CONCEPT_BRIEF.md` / `docs/MVP.md` for design rationale.

## Commands

```bash
pnpm dev              # Next.js dev server
pnpm build            # production build
pnpm start            # serve production build
pnpm lint             # eslint (flat config, eslint-config-next)
pnpm seed             # tsx scripts/seedPostcards.ts — publishes fixture postcards to the PDS
```

No test runner is configured.

## Architecture

Strict DDD layering, dependencies flow one way: `domain → application → infrastructure → presenters → app`.

- **`domain/`** — pure types + validators, zero deps. Branded ids (`PostcardId`, `BlockId`, `Did`, `RecipientName`…), `readonly` everywhere, factory/validator functions in `value-objects/`.
- **`application/`** — `actions/` are `"use server"` server actions (publish, upload blob, resolve link, set locale); `queries/` read from the PDS and map records → domain; `composer/` owns the compose-URL contract and draft block union.
- **`infrastructure/atproto/client.ts`** — singleton `BskyAgent`, logged in from env. Owns the wire `BlockRecord` / `PostcardRecord` shapes and `blobImageUrl`.
- **`infrastructure/local/draftStore.ts`** — on-device drafts in IndexedDB via Legend-State observables. No server state, no cross-device sync.
- **`presenters/components/postcard-design/`** — the product UI, split `composer/` (Tiptap editing) · `compose-flow/` (the 2-step flow + schemas) · `viewer/` + `arrival/` (recipient experience) · `blocks/` (one renderer per block type) · `primitives/` (envelope, stamp, postmark, photo).
- **`lexicons/`** — AT Protocol schemas. `tech.equanimi.respost.postcard` is the record type; edit the lexicon, the `BlockRecord` union, the domain type, and the query mapper together.

Path alias is `@/*` → repo root (e.g. `@/domain/types`).

## The block model

A postcard is `{ to, from, place?, title?, brief?, summary?, cover?, blocks[] }`. `blocks` is an ordered discriminated union: `md | photo | music | video | place | article`. Every block carries a frozen `id`; photos carry a frozen `rot` so layout is stable across renders. Blocks are immutable — mutation means replacement.

`PHOTO_KINDS` includes demo-only gradient placeholders; only `uploaded` and `handwriting` (`REAL_PHOTO_KINDS`) carry a real blob and are accepted on the wire.

## Composer state lives in the URL

`/compose` uses **nuqs** (`useQueryStates` in `ComposerFlow`) as its state container: `to`, `from`, `place`, `title`, `brief`, `summary`, `step`, `preview`, `blocks` (JSON), plus two entry params:

- `?propose=<base64url JSON>` — one-shot intent. Decoded, persisted as a new local draft, then replaced with `?draft=<id>`.
- `?draft=<id>` — load an existing IndexedDB draft. `/drafts` lists them.

`application/composer/composeUrl.ts` is the single source of truth for that contract — keep it in sync with `ComposerFlow`'s parsers and `draftSchema.ts`.

## MCP server

`app/api/[transport]/route.ts` exposes one stateless tool, `compose_url` (via `mcp-handler`): it takes postcard fields and returns a prefilled `/compose?propose=…` URL. It reuses `composeUrlInputSchema` and `draftBlocksSchema` — do not redefine shapes there. **Photo blocks are rejected** by design; photos are uploaded inside the composer. `.claude/skills/compose-respost/SKILL.md` is the client-side counterpart.

## Markdown subset (load-bearing)

`md` blocks round-trip through `tiptap-markdown` with StarterKit configured `heading: false`, `codeBlock: false`, html off, `tightLists`, `breaks`. Safe: paragraphs, bold, italic, links, bullet/ordered lists, blockquote, `---`, inline code. Silently dropped or mangled: `#` headings, fenced code, tables, `![]()` images, raw HTML. Use typed media blocks instead of markdown links for songs/videos/places/articles.

## i18n

`next-intl` with locales `en | pt | es | fr` (`i18n/locales.ts`), resolved from the `NEXT_LOCALE` cookie then `Accept-Language`, no locale path prefix. All user-facing copy belongs in `i18n/messages/*.json` — add a key to all four files.

## Conventions

- Functional style: pure functions, no classes, immutable `readonly` data
- Server actions and queries return discriminated results (`{ success: true, … } | { success: false, error }`), not thrown exceptions for control flow
- `for...of`, never `forEach`
- pnpm only
- shadcn/ui (new-york, neutral) with aliases rooted at `@/presenters` — see `components.json`
- Fonts are wired in `app/layout.tsx` as CSS vars (`--font-serif-display`, `--font-hand`); paper-toned tokens live in `app/globals.css`
- `tsconfig.json` has `strict: false` despite the README claiming strict mode — don't rely on strict null checks

## Environment

`.env.local` (see `.env.example`): `ATPROTO_SERVICE`, `ATPROTO_IDENTIFIER`, `ATPROTO_PASSWORD`, `RESPOST_SENDER_NAME`, `RESPOST_SENDER_PLACE`, `NEXT_PUBLIC_SITE_ORIGIN`. All postcards publish to the single configured account's PDS — there is no per-user auth.
