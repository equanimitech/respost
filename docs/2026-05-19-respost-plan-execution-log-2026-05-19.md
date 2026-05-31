---
migrated_from: equanimi.tech/project/respost/dev/20260519T181748Z-fp5gcx.md
---

# Respost — plan + execution log (2026-05-19)

Pivot from map-first geolocated feed → link-first envelope postcard sent via WhatsApp.\
No recipient account. Postcard is now an ordered list of typed blocks (md / photo / music / video / place / article).

## Architecture decisions

* **ATProto kept** for persistence. Sender authenticates via env-var creds; recipient never authenticates — the URL alone resolves the record on the sender's PDS.

* **Map kept** but moved from `/` to `/map` (sender-only archive).

* **DDD layering preserved**: domain → application → infrastructure → presenters.

* **Fonts**: DM Sans (UI), Lora (postcard voice), Caveat (handwriting), JetBrains Mono (postmarks). Replaced Geist.

* **Lexicon rewritten** (`network.respost.postcard`): `to`, `from`, `place?`, `senderLocation?`, `blocks[]`, `createdAt`. Block union: blockMarkdown / blockPhoto / blockMusic / blockVideo / blockPlace / blockArticle.

* **Photo rotation frozen at publish** (deterministic from BlockId hash) so SSR matches client.

* **Drafts persist to localStorage** (`respost.draft.v1`).

* **OG unfurl is URL-pattern-based** for v1 (no outbound HTTP fetch yet).

## Routes shipped

| Route          | Purpose                                                 |
| -------------- | ------------------------------------------------------- |
| `/`            | Paper landing, "Write a postcard" CTA                   |
| `/compose`     | 3-step composer (recipient → editor → preview)          |
| `/sent/[rkey]` | Share confirmation with WhatsApp button                 |
| `/p/[rkey]`    | Sealed envelope → \~700ms opening → bottom-sheet viewer |
| `/map`         | MapLibre archive of own postcards (senderLocation only) |

## Files

New / rewritten:

* `domain/types/blocks.ts`, `domain/types/index.ts`

* `domain/value-objects/postcard.ts`, `blocks.ts`, `markdown.ts`

* `lexicons/postcard.json`

* `infrastructure/atproto/client.ts` (PostcardRecord + BlockRecord union + `blobImageUrl`)

* `application/actions/publishPostcard.ts`, `unfurlUrl.ts`

* `application/queries/getPostcards.ts`

* `app/globals.css`, `app/layout.tsx`, `app/page.tsx`

* `app/compose/page.tsx`, `app/sent/[rkey]/page.tsx`, `app/p/[rkey]/page.tsx`, `app/map/page.tsx`

* `presenters/components/postcard-design/{primitives, blocks, viewer, arrival, composer, compose-flow}/*`

Deleted:

* `presenters/components/CreatePostcard/*` (7 files)

* `presenters/components/Postcard/*`

* `Map/MapOverlay.tsx`, `Map/CreatePostcardFAB.tsx`

* `application/actions/createPostcard.ts`

* `react-modal-sheet` dependency

## Verification

* `pnpm build` clean (Turbopack, all routes render).

* Dev server smoke pass: `/`, `/compose`, `/sent/abc`, `/map`, `/p/nonexistent` (404) all respond correctly.

* ESLint config absent (pre-existing issue, unrelated).

* End-to-end PDS round-trip with real photo blocks NOT YET exercised against a live PDS — needs valid `ATPROTO_*` env to test the publish path.

## Deferred

* Real OG metadata fetcher (currently URL-pattern only — Spotify track titles, YouTube thumbnails, etc are not pulled).

* "Save to my phone" static export of a postcard.

* Composer drag-to-reorder blocks.

* Photo block inline caption editing in the composer (captions accepted in the data model, no UI yet).

* Place block drop-pin flow (link to `/map` picker).

* Action-sheet iOS modal (replaced by direct toolbar buttons for v1).

## Open questions surfaced

1. Real OG fetcher — when and where (Vercel edge function? Background job? Client at paste time?).
2. Should the modal viewer's swipe-down re-tuck into the envelope (current behaviour: closes back to sealed-envelope landing).
3. Theme color for PWA: shipped `#f6f1e7` (paper). Confirm vs the old `#1c1917`.
4. Photo blob `image/webp` size cap is currently 1.5 MB in the lexicon and 1 MB in the upload action — align these.

## Plan file

Full plan at `/Users/rafa/.claude/plans/quirky-sniffing-wilkinson.md`.
