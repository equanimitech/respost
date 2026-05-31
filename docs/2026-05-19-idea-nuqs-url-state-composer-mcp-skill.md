---
migrated_from: equanimi.tech/project/respost/dev/20260519T182247Z-g5vpem.md
---

# Idea — nuqs URL-state composer + MCP skill

## What

Use [nuqs](https://nuqs.47ng.com/) to push the entire composer draft into the URL as type-safe query params, then expose an MCP tool that builds those URLs from markdown. The result: Claude (or any agent) can compose a postcard end-to-end by emitting a URL.

## Why

* **Shareable drafts**: the composer URL becomes the draft. Refresh / new tab / send a link to your other device → same draft, no localStorage dependency.

* **Agent-composable**: an MCP tool `respost.compose(markdown, photos[], links[])` builds a fully populated `/compose?…` URL. The agent's writing skill can draft the postcard in markdown and hand you a URL to open and confirm. Closes the loop between "write me a postcard for Lena about Sunday in Gracia" and a real `respost.fyi/compose?…` page ready to share.

* **Linear path to a markdown DSL**: blocks already serialize cleanly (md, photo\[url], music\[url], video\[url], place\[url], article\[url]). The agent just emits this structure as URL params; we decode it client-side into the draft.

## Sketch

```
/compose?to=Lena
        &from=Rafa
        &place=Barcelona
        &b.0=md:Acordei%20cedo…
        &b.1=photo:https%3A%2F%2Fphotos.../cafe.jpg
        &b.2=music:https%3A%2F%2Fopen.spotify.com%2Ftrack%2F…
        &b.3=md:…
```

Or, more compactly, base64url-encode a single `draft=` param holding the JSON tree (skip the `nuqs` array-keying entirely, but lose readability).

## How

1. Define a nuqs `parseAsJson<DraftBlock[]>()` parser for `blocks` and string parsers for `to/from/place`.
2. `ComposerFlow` reads from nuqs instead of (or alongside) `draftStore.ts`.
3. On change, nuqs writes back to the URL (`shallow: true`, no navigation).
4. MCP tool `respost.compose(...)` lives in a separate channel (Themia or a respost-specific MCP) — it accepts a markdown body + a list of attachments, runs the existing `unfurlUrl` pattern matcher on each link, and returns the assembled URL.

## Tradeoffs

* **URL length cap**: ~2 KB is safe on most clients, ~8 KB is hard cap on some. A photo block can't carry an image — only a *reference* to one already uploaded. So the agent path requires either (a) pre-uploaded images (URL only), or (b) photo blocks are added after the URL opens, not from the URL. (b) is simpler and matches reality — the human uploads photos from their phone; the agent only fills in the words and the link picks.

* **Privacy**: a composer URL contains the recipient name + draft body. Don't share. Doesn't actually leave the device until published — but copying the URL is a sharing action that previously wasn't.

* **Conflicts with legend-state idea** (in same channel) — pick one source of truth. Compatible if nuqs is the "share with agent" surface and legend-state is the durable local-first store; they round-trip through each other.

## Reach

If the MCP skill works, the chain becomes:

> "Claude, write me a postcard for Lena about Sunday morning in Gracia. Tuck in 'O Mar Enrola na Areia' on Spotify and Bar del Pla on Maps."

→ Claude calls `respost.compose(...)` → returns `respost.fyi/compose?…` → I open it on my phone, add the cafe photo I took, hit Share → WhatsApp.

That's the AI-native pre-PDS surface for this product.

## Defer until

* Composer flow stabilises (current text-only path works end-to-end).

* Photo blocks are not blocking (i.e. drafts can be opened, photos added by hand, then published).

* A clear use case appears — likely Rafa drafting + Claude polishing, or grandma's letter assistant.

