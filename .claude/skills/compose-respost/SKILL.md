---
name: compose-respost
description: Use when the user asks to "compose a respost", "turn this into a postcard", "make a respost from this conversation", or otherwise wants to send a Respost virtual postcard out of the current conversation. Drives a short intake, calls the remote `compose_url` MCP tool, and hands the user a prefilled compose URL to open in the browser.
---

# compose-respost

Turn the current conversation into a Respost postcard. No drafts, no intermediate state — a short intake, then one MCP call that mints a URL the human opens.

## Architecture (so you know what you're touching)

- **Composer page** (`/compose`) consumes URL state via `nuqs`. It supports two MCP-relevant params:
  - `?propose=<base64url JSON>` — one-shot intent. The page decodes the payload, persists a new draft to the on-device IndexedDB store via Legend-State, and replaces the URL with `?draft=<id>`. The propose blob is discarded after the redirect.
  - `?draft=<id>` — load an existing on-device draft.
- **Drafts** live on the device that opened the URL (IndexedDB). Multiple drafts coexist. No cross-device sync. The user reaches them at `/drafts` (list with open + delete).
- **MCP tool** `compose_url` lives at `app/api/[transport]/route.ts`. Stateless. Takes `{ to, from, place, blocks }`, returns a `/compose?propose=...` URL.
- **Schemas**: `composeUrlInputSchema` (sender fields) and `draftBlocksSchema` (block union) — both in the repo, both reused by the route. The user adds photos *inside* the composer; the tool refuses photo blocks.

## Step 1 — Ask the language (always, first)

Before anything else, ask via `AskUserQuestion` which language the postcard should be written in. Default options: English, Spanish, French, Portuguese, Other. Do not infer from the conversation language — they're often different.

All human-facing fields (`to`, `from`, `place`, markdown bodies, captions) must be written in that language. Leave proper nouns and URLs alone.

## Step 2 — Socratic intake

Walk the user through a tight intake. Pull what you can from the conversation; ask only for the gaps. Keep the questions short.

Required:

- **To** — recipient name. One person. ≤40 graphemes.
- **From** — sender display name. If the user is known to you, propose and confirm. ≤40 graphemes.
- **Place** — sender's place line ("Barcelona", "from the train"). ≤80 graphemes.
- **Message** — the heart of the postcard. Will become one `md` block. Warm, plain, grandparent-friendly per repo memory.

Then sweep for media one by one. Single-question rounds, in this order:

1. "Got any pictures?" — if yes, do **not** put them in the URL. Tell the user they'll add photos inside the composer after opening the URL.
2. "Got any links you want to share?" — articles. Capture URL + title + host + optional excerpt.
3. "Got any songs?" — music links (Spotify / YouTube Music / Apple / Soundcloud / Bandcamp). Capture URL + service + title + optional artist/album.
4. "Got any videos?" — YouTube. Capture URL + title + optional channel.
5. "Got any places?" — map links. Capture URL + name + optional address/caption/lat/lng.

If the user says no, skip. If the user volunteered something earlier in the conversation that fits a slot, propose it and confirm rather than ask blind.

## Step 3 — Call the MCP

Invoke the `compose_url` tool on the Respost MCP with the assembled payload:

```jsonc
{
  "to": "...",
  "from": "...",
  "place": "...",
  "blocks": [
    { "type": "md", "md": "..." },
    { "type": "article", "url": "...", "host": "...", "title": "..." },
    // ...
  ]
}
```

**Do not** send `photo` blocks. The tool will refuse.

The tool returns a single text content — the URL. That's the only output the user needs.

## Step 4 — Hand off

Always render the postcard body in the reply so the user can read it without leaving the chat. The URL is a destination, not a substitute for the content. Reply with, in this order:

1. A one-line confirmation of recipient + place ("Postcard to Lola, from Barcelona — ready.").
2. **The full rendered body** of the postcard, in markdown: each `md` block as prose, each typed media block as a line that names what it links to ("🎵 Bésame mucho — Consuelo Velázquez", "📍 Barceloneta", etc.). Photos get a placeholder line ("📷 add inside the composer").
3. The URL on its own line so it's clickable.
4. A one-line nudge if photos were mentioned ("Add your photos in the composer once it opens.").

Do not call `publishPostcard`.

## Iteration

If the user wants changes ("make it shorter", "swap the song"), call `compose_url` again with the new payload and hand them a fresh URL. **Each call creates a new on-device draft** — there is no "update this draft" path through the MCP. If the user has already started editing a previous draft in the composer, tell them to either keep editing it directly, or open the new URL (which will live as a separate draft they can manage from `/drafts`).

## Block reference (caps come from the lexicon)

| Block | Required fields | Notes |
|-------|-----------------|-------|
| `md` | `type`, `md` | ≤2000 graphemes. The main body. See markdown subset below. |
| `music` | `type`, `url`, `service`, `title` | `service` ∈ spotify/youtube/apple/soundcloud/bandcamp. |
| `video` | `type`, `url`, `service`, `title` | `service` is `youtube`. |
| `place` | `type`, `url`, `name` | Optional `addr`, `caption`, `latitude`, `longitude`. |
| `article` | `type`, `url`, `host`, `title` | Optional `excerpt` (≤400 graphemes), `imageUrl`. |
| `photo` | — | **Do not mint via URL.** Composer-only. |

Field caps (`to` 40g, `from` 40g, `place` 80g, etc.) are enforced server-side by the MCP tool. Don't pre-truncate — the user's voice matters more than fitting; let them edit in the composer if a cap bites.

## Markdown subset (`md` blocks)

The composer renders `md` through `tiptap-markdown` over StarterKit configured with `heading: false`, `codeBlock: false`, html off, `tightLists`, `breaks`. Generate only the round-trip-safe subset:

- ✅ paragraphs, bold (`**x**`), italic (`*x*`), links (`[txt](url)`)
- ✅ bullet lists (`- `), ordered lists (`1. `), blockquote (`> `), horizontal rule (`---`)
- ✅ inline code (`` `x` ``)
- ❌ headings (`#`, `##`) — silently flattened
- ❌ fenced code blocks (`` ``` ``) — not supported
- ❌ tables, raw HTML, image syntax (`![]()`)

**Never embed links inside `md`.** Use the typed media blocks (article/music/video/place). Build the body as an interleaved sequence: `md / media / md / media`, matching how the composer flushes draft text between media insertions. One long md block is the wrong shape if any media is involved.

## Common mistakes

- **Writing in the conversation language** instead of the language chosen in Step 1.
- **Inventing a recipient** because the conversation didn't name one. Ask.
- **Putting URLs inside `md`** when a typed block (music/video/place/article) fits.
- **Sending photo blocks** to the MCP. Always refused; surfaces as an error to the user.
- **Building the URL yourself.** Always go through the MCP `compose_url` tool — it carries the schema and any future validation.
