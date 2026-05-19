# Typography tokens — semantic size classes for postcard surfaces

**Date:** 2026-05-19
**Status:** spec, not started
**Motivation:** every postcard component picks its own `fontSize` in px (9, 9.5, 10, 11, 11.5, 13, 14, 15, 17, 18, 21, 26, 28, 34...). "Make fonts bigger" is a 13-file edit. Grandparent-friendly mode should be one knob.

## Approach

The postcard subsystem deliberately doesn't use Tailwind — it's hand-crafted CSS with `var(--…)` tokens and a small set of semantic classes for font *family*: `t-hand`, `t-serif`, `t-mono`. We extend that same pattern with semantic classes for font *size*, so the two concerns compose: `<div className="t-mono t-label">`.

## Out of scope

- Other type properties (`letterSpacing`, `lineHeight`, `fontWeight`) — leave inline; only `fontSize` proliferates.
- Font family classes (`t-hand`, `t-serif`, `t-mono`) — already token-like, leave alone.
- Composer chrome / system UI outside `presenters/components/postcard-design/`.
- Map UI, app shell.
- `OGCard.tsx` — static OG image renders, keep px.
- Adopting Tailwind utilities inside the postcard subsystem (rejected — clashes with existing culture).

## Current state — audit

Run before starting: `rg "fontSize:" presenters/components/postcard-design/` — expect ~60 occurrences across viewer/, composer/, blocks/, primitives/, arrival/.

Notable clusters:
- **9–10px mono meta** (timestamps, "no account · no app", "sent from X") — most numerous, most under-sized.
- **11–13px UI/body** (buttons, secondary serif lines, error text).
- **14–18px primary body / caption** (PhotoBlockView body+caption, WhatsAppBubble, ComposerEditor body).
- **21–34px display** (sender names, "for X", landing headlines).
- **clamp(...)** in PostcardHero — keep responsive, just retoken endpoints.

Excluded from migration (intentionally dynamic, not part of scale):
- `SealedEnvelope.tsx` — `fontSize: w * 0.034` / `w * 0.085` (sized to envelope width).
- `Postmark.tsx` — `fontSize: size * 0.11` / `size * 0.13` (sized to postmark prop).
- `MarkdownText.tsx` — `fontSize: size` (size is already a prop).
- `OGCard.tsx` — static OG renders, fixed px ok.

## Proposed scale

Six roles. Names describe *use*, not *size* — so future redesign can retune without renaming.

| Class           | Default px | Use                                                    | Replaces (current px) |
| --------------- | ---------- | ------------------------------------------------------ | --------------------- |
| `t-micro`       | 11         | mono meta, timestamps, footnotes, button hint labels   | 9, 9.5, 10, 10.5      |
| `t-label`       | 13         | mono uppercase labels, small UI                        | 11, 11.5, 12          |
| `t-ui`          | 15         | button text, secondary serif, error text, avatar init  | 13, 13.5, 14, 14.2    |
| `t-body`        | 18         | primary serif body, place card title                   | 15, 17, 18            |
| `t-body-hand`   | 25         | handwriting body on photo cards, landing addressee     | 19, 21, 26            |
| `t-display`     | 34         | postcard hero title, sender display, recipient display | 26, 28, 34, 38        |

Hero title clamp stays as the one responsive exception → `.t-display-fluid` with `clamp(32px, 5vw, 52px)`.

Naming note: existing classes are `t-hand` / `t-serif` / `t-mono` for family. New size classes use `t-*` too but read as distinct roles. `t-body-hand` is the one mildly awkward name (size *and* implied family) — accept it; renaming to `t-hand-body` reads worse.

Mapping is **approximate** — auditing pass may justify keeping a one-off (e.g. WhatsAppBubble's 14.2 is tuned to mimic iOS). Document those exceptions inline with a one-line `// why` rather than fighting the scale.

## Implementation

### 1. Define tokens + classes in `app/globals.css`

Add to the existing `:root` block:

```css
:root {
  /* …existing tokens… */

  --text-micro:   11px;
  --text-label:   13px;
  --text-ui:      15px;
  --text-body:    18px;
  --text-hand:    25px;
  --text-display: 34px;
}
```

Then, alongside the existing `.t-hand` / `.t-serif` / `.t-mono` declarations:

```css
.t-micro       { font-size: var(--text-micro); }
.t-label       { font-size: var(--text-label); }
.t-ui          { font-size: var(--text-ui); }
.t-body        { font-size: var(--text-body); }
.t-body-hand   { font-size: var(--text-hand); }
.t-display     { font-size: var(--text-display); }
.t-display-fluid { font-size: clamp(32px, 5vw, 52px); }
```

### 2. Sweep components

One PR per directory keeps review small:

1. `viewer/` (4 files) — biggest reader impact, do first.
2. `blocks/` (PhotoBlockView, CardPlace, CardArticle, CardMusic, CardVideo).
3. `composer/` (ComposerEditor, ComposerPreview, ComposerRecipient, ComposerSent, ComposerChrome).
4. `primitives/` (WhatsAppBubble, Stamp — leave Postmark/SealedEnvelope/Photo/MarkdownText).
5. `arrival/` (ArrivalExperience and friends).

Per file:
- For each `fontSize: N` in a style object, pick the nearest role from the table.
- Remove `fontSize` from the style object.
- Add the role class to `className`, composing with the existing family class:
  ```tsx
  <div className="t-mono" style={{ fontSize: 10, letterSpacing: 2 }}>
  // becomes
  <div className="t-mono t-label" style={{ letterSpacing: 2 }}>
  ```
- If the size doesn't fit any role within ±2px, leave it inline and add a one-line `// why` comment.

### 3. Grandparent-mode knob (deferred — separate session)

Once tokens land, a single `[data-density="comfortable"]` selector on `<html>` can retune the whole scale:

```css
[data-density="comfortable"] {
  --text-micro:   13px;
  --text-label:   15px;
  --text-ui:      17px;
  --text-body:    21px;
  --text-hand:    28px;
  --text-display: 38px;
}
```

Don't ship the toggle in this migration. Just make sure tokens are the only place sizes live.

## Verification

- `rg "fontSize:" presenters/components/postcard-design/` — should drop from ~60 to ≤10 (documented exceptions + dynamic primitives).
- Visual diff each surface: map landing, postcard view, compose flow, sent receipt. Tokens may not land *exactly* on prior pixel values — record any place the new size feels wrong and adjust the token default rather than re-introducing a one-off.
- No regressions in OG image rendering (`OGCard.tsx` untouched).

## Risks

- **Visual drift.** Map-to-token rounding will shift sizes a few px in dozens of places. Plan a polish pass after the sweep, not during.
- **Class-name collisions.** `t-ui`, `t-label` etc. don't collide with anything in `globals.css` today. Grep before adding to be sure.
- **Composition with family classes.** Confirm CSS specificity behaves: `t-hand` sets only `font-family`, `t-body` sets only `font-size` — they should compose freely, but verify with one combined element before mass migration.

## Done when

- Six size classes + fluid variant defined in `globals.css`.
- All `fontSize` in `presenters/components/postcard-design/` migrated except documented dynamic/exception cases.
- Grandparent-mode CSS block exists but is not wired to a toggle (placeholder for next session).
