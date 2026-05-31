---
migrated_from: equanimi.tech/project/respost/dev/20260519T181837Z-njrhzz.md
---
# Idea — replace inline styles with Tailwind

## What

Migrate the postcard-design tree from heavy inline `style={…}` to Tailwind v4 utilities. Every component in `presenters/components/postcard-design/{primitives,blocks,viewer,arrival,composer,compose-flow}` currently carries inline styles ported verbatim from the design's plain-JSX source.

## Why

- Catalogues design tokens once (`@theme inline`) rather than scattering `var(--paper)` across dozens of files.
- Easier to reason about responsive variants, hover/focus states, dark-mode if we ever want it.
- Cuts component file size ~40 % on average; reads more like the rest of a Next.js codebase.
- Removes the per-file `fontFamily: "var(--font-serif-display), serif"` boilerplate — class names + a single `t-serif`-equivalent are enough.

## Tradeoffs to consider before starting

- The design's *exact* paper/postmark/envelope geometry depends on numeric inline values (rotations, perspectives, exact px). Some of those (transform composition, `transformStyle: preserve-3d`, dynamic `cardRise = openAmount * 70`, color-mixed gradients) are awkward in Tailwind without arbitrary values everywhere — could become more verbose, not less.
- `SealedEnvelope` and the rAF-driven flap animation rely on inline `transform: rotateX(${flapRot}deg)` etc — these *have* to stay as inline style or as a CSS-var-driven class. Tailwind won't help here.
- The `photo-placeholder.<kind>` gradients in `globals.css` are already external — they don't need migration.
- Want to keep `t-sans / t-serif / t-hand / t-mono` shorthand classes; they're better than `font-[var(--font-serif-display)]`.

## Recommended approach

1. Tokens stay in `globals.css` (`@theme inline` already extended with `--color-paper`, `--color-ink`, etc — Tailwind v4 picks them up as `bg-paper`, `text-ink` etc).
2. Migrate **static** style blocks first (chrome, toolbars, buttons, layout boxes). Keep dynamic / animated transforms (envelope flap, drag-target rotation) as inline styles.
3. Convert custom classes that match Tailwind primitives: `flex flex-col items-center justify-between` instead of inline `display:flex; flex-direction:column; …`.
4. Replace ad-hoc paddings/margins with utility classes; arbitrary values (`px-[14px]`) are fine where the design specifies exact pixels.
5. Replace the `t-mono / t-serif / t-sans / t-hand` helper classes with Tailwind shortcuts: keep them as-is (already wired to next/font CSS vars) — they're cleaner than utility chains.
6. Spec one component end-to-end first (suggest `ComposerChrome` or `Postmark`) as the template before touching the others.

## Scope

- Roughly 25–30 component files in `postcard-design/`.
- Should NOT touch `globals.css` token block or the animation-driven inline styles in `SealedEnvelope`, `ArrivalExperience`, `PostcardModalViewer`'s sheet height.
- Probably half a day if done carefully; could regress visual details if rushed.

## Verification after

- `pnpm build` clean.
- Manual visual diff at `/`, `/compose`, `/p/<real-rkey>` — paper grain, kraft envelope, stamp, postmark, modal-sheet emerge unchanged.

## Defer until

The current visual is settled with a real user (Lena or equivalent) — otherwise we'd be polishing a UI that's about to change.
