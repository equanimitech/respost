---
migrated_from: equanimi.tech/project/respost/dev/20260519T182041Z-tlup5l.md
---
# Idea — legend-state for local-first storage (pre-PDS)

## What

Use [legend-state](https://legendapp.com/open-source/state/) as the composer + draft persistence layer **in front of** the AT Protocol PDS. Local-first by default; the PDS becomes the durable sync target rather than the primary store.

## Why

- Today's `draftStore.ts` is naive: serialize JSON to `localStorage` on every keystroke. No conflict handling, no offline queue, no multi-tab sync.
- Legend-state gives:
  - Reactive observable state with built-in `localStorage` / `IndexedDB` / `Async­Storage` persistence
  - Optimistic UI + `persistObservable` with a `sync` plugin that batches outbound writes (perfect for the PDS publish path)
  - Conflict resolution hooks (LWW, custom merge) — needed if the same sender drafts from two devices
  - Cheap fine-grained subscriptions — `observer()` wrappers re-render only the components reading the changed paths, so the composer's textarea + block list don't fight each other on every keystroke
- Matches the **Local-First Ownership** equanimitech principle: data is on the device first, the PDS becomes the synchronisation surface, not the source of truth.

## What would change

- Replace `presenters/components/postcard-design/compose-flow/draftStore.ts` with a legend-state-backed `draft$` observable.
- Move the composer's `useState(blocks)` etc into observables; replace `setBlocks` calls with `draft$.blocks.set(...)`.
- Build a `sync` plugin that pushes a completed postcard to the PDS via the existing `publishPostcard` server action.
- Optionally: persist published postcards locally too (IndexedDB) so `/map` works offline and reads don't hit the PDS every time.

## Why "before the PDS"

Currently `publishPostcard` is the only path to durability — that's an outbound network call on a button press, which is fine for v1 but bad on flaky mobile. With legend-state, the publish becomes "the local truth has been marked clean and is now in the outbound queue"; the network call happens whenever connectivity allows. The recipient still gets a respost.fyi link, but the sender's draft is durable from the first character typed.

## Tradeoffs

- New dep (~5 KB gzipped, fine).
- Mental model shift — observables instead of `useState`. Most of the composer doesn't care, but it's worth threading through `ComposerFlow` cleanly.
- Doesn't itself solve the AT-Protocol write conflict (two devices publishing same draft to the same PDS); we'd need a CRDT or LWW choice on top — legend-state has hooks for that.

## Defer until

- v1 lands with real users and at least one "I lost my draft" complaint, OR
- We need offline-first composer for `/map` browsing without re-fetching the PDS each time.

## See also

- The Tailwind migration idea in this channel (parallel improvement, independent).
