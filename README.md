# Respost

*A postcard for someone you love. No accounts, no feed — just a link in WhatsApp.*

---

## What changed

Respost began as a map-first social network for geolocated postcards. We pivoted to a **link-first** model that uses the recipient's existing inbox (WhatsApp, Telegram, Messages, email) instead of asking them to install yet another app. The map is still here — but as a private side route for the sender's own archive, not the primary interface.

Each postcard is now a small **block-structured document**: paragraphs of markdown, photos, a song, a place, a YouTube clip, an article. The sender writes it, hits Share, and hands a URL to a friend through whatever channel they already use. The recipient opens the link, sees a sealed envelope, taps once, and the postcard rises out of it.

---

## How it works

### As a sender

1. Open `/compose`.
2. Step 1 — write a name on the envelope ("mãe", "you in 10 years", "future me").
3. Step 2 — write. Photos, paragraphs, links in any order. Type `/` in the editor (or tap a toolbar button) to drop a **song** (Spotify / SoundCloud), **video** (YouTube), **place** (Google Maps) or generic **link** — paste the URL, Respost fetches the metadata. Take a photo of a handwritten note and it lands on paper-toned card.
4. Step 3 — preview exactly what the recipient will see.
5. Tap **Share the link**. The link is yours; hand it off via the native share sheet (WhatsApp is the first chip).

### As a recipient

1. The link arrives in WhatsApp.
2. Tap it. A quiet page opens — paper texture, a sealed kraft envelope addressed to you.
3. Tap **Open the envelope**. The flap lifts, the postcard rises (~700 ms), the bottom-sheet viewer takes over.
4. Read at your own pace. The card ends with `fim — take your time`. No autoplay, no next-postcard, no notifications you have to clear.
5. If you want to write one back, the link is right there.

No account on either side of the wire. The reader needs nothing but the URL.

---

## Architecture

```
domain/         pure types + validators, no dependencies
application/    use cases (server actions + queries)
infrastructure/ AT Protocol client (PDS reads/writes)
presenters/     React UI components
```

Strict DDD layering. Discriminated-union results. Branded ids. `for…of` not `forEach`.

### Block model

A postcard is `{ to, from, place?, blocks, createdAt }`, where `blocks` is an ordered union of:

| Block      | Content |
|------------|---------|
| `md`       | Paragraphs of `**bold**` / `*italic*` prose |
| `photo`    | Uploaded image (or "handwriting" — same blob, paper-toned wrapper) |
| `music`    | Spotify / YouTube Music / Apple Music / SoundCloud / Bandcamp |
| `video`    | YouTube |
| `place`    | Google Maps URL + mini-map |
| `article`  | Any URL with OG metadata |

Each block has a frozen id and (for photos) a frozen rotation, so the layout is identical on every render.

### Routes

| Route               | Purpose |
|---------------------|---------|
| `/`                 | Landing — "write a postcard" |
| `/compose`          | 3-step composer (recipient → editor → preview) |
| `/sent/[rkey]`      | Confirmation + WhatsApp share button |
| `/p/[rkey]`         | Sealed envelope landing → animation → modal viewer |
| `/map`              | Sender-only archive on a MapLibre map |

### Persistence

Postcards are stored as `network.respost.postcard` records on the sender's PDS via the AT Protocol. The recipient never authenticates — the URL alone resolves the record. See `lexicons/postcard.json` for the schema.

### Tech stack

- Next.js 16 + React 19 (server components, server actions)
- Tailwind CSS 4 with paper-toned tokens
- next/font: DM Sans (UI), Lora (postcard voice), Caveat (handwriting), JetBrains Mono (postmarks)
- MapLibre GL (only on `/map`)
- AT Protocol (`@atproto/api`)
- TypeScript strict mode

---

## Equanimitech alignment

The redesign sharpens the original ambition. Each principle now has a structural anchor:

| Layer | Principle | How it lands |
|---|---|---|
| Sovereignty | Local-First Ownership | The link **is** the postcard. PDS records survive a Respost shutdown. |
| Sovereignty | Holistic Control | Recipient owns whether/when to open. No read receipts, no tracking. |
| Sovereignty | Modification Rights | "Save to my phone" exports a static page (planned). |
| Awareness | Peripheral Presence | Arrives through WhatsApp — no second inbox to manage. |
| Awareness | Attentional Granularity | Envelope (glance) → flap (intent) → photo (commit) → message (depth). Stop at any layer with something complete. |
| Awareness | Bounded Experiences | `fim · take your time` ends the card. No autoplay, no next. |
| Equanimity | Strategic Friction | Composer is patient (markdown, paper texture). No autosave anxiety. Compulsive checking has nowhere to land — there's no feed. |
| Equanimity | Fade-by-Design | Two postcards a month is a success. No streaks. |
| Equanimity | Downstream Allocation | Sender fills the slots; no algorithm decides what fills the screen. |

---

## Getting started

```bash
cp .env.example .env.local
# Fill in your ATProto credentials (Bluesky account + app password)
# Optional: RESPOST_SENDER_NAME, RESPOST_SENDER_PLACE
pnpm install
pnpm dev
```

Required env:

```
ATPROTO_SERVICE=https://bsky.social
ATPROTO_IDENTIFIER=…
ATPROTO_PASSWORD=…
RESPOST_SENDER_NAME=Rafa          # default sender display name
RESPOST_SENDER_PLACE=Barcelona     # default sender place line (optional)
NEXT_PUBLIC_SITE_ORIGIN=https://respost.equanimi.tech   # for share URLs
```

---

## What success looks like

Someone receives a WhatsApp message. There's a link from a friend. She taps it on her phone.

A page opens — paper, a kraft envelope addressed to her in handwriting, a stamp, a faded postmark from Barcelona. She taps **Open**. The flap lifts. A photo of a Sunday morning in Gracia rises out.

She reads three paragraphs. There's a song tucked in — Marisa Monte. She presses play, it opens in Spotify. There's a place — Bar del Pla — with a caption that says *second table by the window — they know me*. She scrolls to the end. *Fim · take your time*.

She doesn't like it. She doesn't reply yet. She closes the tab.

That's it. That's the product.

---

*Built with [AT Protocol](https://atproto.com). The link is the postcard.*
