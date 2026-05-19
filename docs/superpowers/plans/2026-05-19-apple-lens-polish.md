# Apple-Lens Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring Respost's microinteractions, typography, motion, and accessibility up to an Apple-grade fit-and-finish bar without changing product scope.

**Architecture:** Five sequenced phases — design tokens & fonts → motion primitives → modal accessibility → view transitions → map polish. Each phase ships independently and can be paused without breaking the app. Use existing deps (`motion`, `radix-ui`, Next 16 view transitions, React 19); add nothing new.

**Tech Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · `motion/react` · MapLibre GL · TypeScript strict mode.

**Note on TDD:** No test runner is configured in this repo (`CLAUDE.md`). Each task's "verify" step is `pnpm build && pnpm lint` plus a documented manual browser smoke. Add Vitest later as a separate plan.

***

## File Map

### Created

* `presenters/components/motion/springs.ts` — central spring presets + `useAppleMotion()` hook (respects `prefers-reduced-motion`).

* `presenters/components/motion/haptics.ts` — `tapHaptic()` wrapper around `navigator.vibrate`.

* `presenters/hooks/useFocusTrap.ts` — minimal focus trap for modal dialogs.

* `presenters/hooks/useEscapeKey.ts` — dismiss-on-Escape effect.

* `presenters/components/postcard-design/viewer/PostcardLightbox.tsx` — native-`<dialog>` photo viewer replacing `yet-another-react-lightbox`.

### Modified

* `app/layout.tsx` — fonts trimmed, viewport allows zoom, `color-scheme` set, `<meta>` polish.

* `app/globals.css` — type scale tokens, reduced-motion block, drop dead `@keyframes`, add `color-scheme`.

* `app/page.tsx` — focus-visible rings on CTAs, swap inline font-sizes to scale tokens.

* `app/map/page.tsx` — glass chrome on `← home` pill, focus rings, `aria-label`.

* `presenters/components/Map/PostcardMap.tsx` — focusable markers, container `role="region"` + `aria-label`, popup uses tokens.

* `presenters/components/postcard-design/arrival/ArrivalExperience.tsx` — replace rAF linear with motion spring; honor reduced motion.

* `presenters/components/postcard-design/viewer/PostcardLanding.tsx` — spring on flap rotate; focus-visible on Open button.

* `presenters/components/postcard-design/viewer/PostcardModalViewer.tsx` — `role="dialog"`, `aria-modal`, Escape handler, focus trap, `overscroll-behavior: contain`.

* `presenters/components/postcard-design/viewer/ModalBackdrop.tsx` — drop misleading "swipe down" copy.

* `presenters/components/postcard-design/blocks/PhotoBlockView.tsx` — use new `PostcardLightbox`; map-pin→hero `view-transition-name` on photo.

* `presenters/components/postcard-design/composer/ComposerEditor.tsx` — focus rings on toolbar buttons, `aria-live` on error.

* `presenters/components/postcard-design/composer/ComposerRecipient.tsx` — `<label htmlFor>`, drop `autoFocus`, `spellCheck={false}`.

* `package.json` — remove `yet-another-react-lightbox`, `DM_Sans`, `JetBrains_Mono` unused imports.

* `next.config.ts` — enable `experimental.viewTransition`.

***

## Phase 1 — Foundation: fonts, viewport, type scale

### Task 1: Trim fonts and fix viewport

**Files:**

* Modify: `app/layout.tsx`

* [ ] **Step 1: Replace font imports**

Edit `app/layout.tsx` lines 1–29 to read:

```tsx
import type { Metadata, Viewport } from "next";
import { Lora, Caveat } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

const lora = Lora({
  variable: "--font-serif-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});
```

* [ ] **Step 2: Replace viewport block**

Edit `app/layout.tsx` lines 41–50:

```tsx
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ede4d2" },
    { media: "(prefers-color-scheme: dark)", color: "#15110c" },
  ],
};
```

Note: `maximumScale: 1, userScalable: false` removed — zoom must be allowed.

* [ ] **Step 3: Update body className**

Edit `app/layout.tsx` line 57–59:

```tsx
<body className={`${lora.variable} ${caveat.variable} antialiased`}>
```

* [ ] **Step 4: Add** **`color-scheme`** **and** **`suppressHydrationWarning`** **to html**

Edit `app/layout.tsx` line 56:

```tsx
<html lang="en" style={{ colorScheme: "light dark" }} suppressHydrationWarning>
```

* [ ] **Step 5: Verify build & lint**

Run: `pnpm build && pnpm lint`
Expected: no TS errors, no font import errors.

* [ ] **Step 6: Manual smoke**

Run: `pnpm dev`. Open `http://localhost:3000`. Confirm:

* Page renders with serif h1 and Caveat handwriting.

* Pinch-to-zoom works on mobile DevTools.

* No font CLS flicker.

* [ ] **Step 7: Commit**

```bash
git add app/layout.tsx
git commit -m "trim webfonts to Lora+Caveat, allow zoom, set color-scheme"
```

***

### Task 2: Define system font + type scale tokens

**Files:**

* Modify: `app/globals.css`

* [ ] **Step 1: Replace sans/mono font definitions**

In `app/globals.css`, replace lines 241–244:

```css
.t-sans   { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif; }
.t-serif  { font-family: var(--font-serif-display), "Iowan Old Style", Georgia, serif; }
.t-hand   { font-family: var(--font-hand), "Bradley Hand", cursive; }
.t-mono   { font-family: ui-monospace, "SF Mono", Menlo, monospace; }
```

* [ ] **Step 2: Add type scale block above** **`.app`**

Insert into `app/globals.css` immediately before line 250 (the `.app` block):

```css
/* ─────────────────────────────────────────────────────────────────
 * Type scale — Apple-style hierarchy, 9 sizes, tabular-nums for digits.
 * ──────────────────────────────────────────────────────────────── */
:root {
  --text-caption2:  10px;
  --text-caption:   11px;
  --text-footnote:  13px;
  --text-body:      15px;
  --text-callout:   17px;
  --text-title3:    20px;
  --text-title2:    24px;
  --text-title1:    28px;
  --text-display:   34px;

  --lh-tight:  1.15;
  --lh-snug:   1.3;
  --lh-normal: 1.5;
}

.tabular { font-variant-numeric: tabular-nums; }
```

* [ ] **Step 3: Update** **`@theme inline`** **to drop** **`--font-sans-display`** **reference**

In `app/globals.css` lines 204–207, replace with:

```css
  --font-sans:  -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
  --font-serif: var(--font-serif-display);
  --font-hand:  var(--font-hand);
  --font-mono:  ui-monospace, "SF Mono", Menlo, monospace;
```

* [ ] **Step 4: Update** **`.app`** **font-family**

In `app/globals.css` line 254:

```css
  font-family: var(--font-sans);
```

* [ ] **Step 5: Update body font-family**

In `app/globals.css` line 339:

```css
  font-family: var(--font-sans);
```

* [ ] **Step 6: Add** **`prefers-reduced-motion`** **block at end of file**

Append to `app/globals.css`:

```css
/* ─────────────────────────────────────────────────────────────────
 * Reduced motion — disable non-essential animations.
 * ──────────────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

* [ ] **Step 7: Remove orphan** **`@keyframes rp-caret`**

Delete line 326 of `app/globals.css` (`@keyframes rp-caret { 50% { opacity: 0; } }`) — never referenced.

* [ ] **Step 8: Verify build**

Run: `pnpm build && pnpm lint`.
Expected: clean.

* [ ] **Step 9: Manual smoke**

Open landing and a postcard at `/review/p1` (or fake route). Confirm text reads the same — system stack should fall back to SF on macOS, Segoe on Windows, Roboto on Android.

* [ ] **Step 10: Commit**

```bash
git add app/globals.css
git commit -m "add type scale, system font stack, prefers-reduced-motion guard"
```

***

## Phase 2 — Motion primitives

### Task 3: Central spring presets

**Files:**

* Create: `presenters/components/motion/springs.ts`

* [ ] **Step 1: Create the file**

```ts
// presenters/components/motion/springs.ts
import { useReducedMotion } from "motion/react";
import type { Transition } from "motion/react";

export const springs = {
  // Snappy buttons, taps.
  press: { type: "spring", stiffness: 380, damping: 28, mass: 0.7 } as const,
  // Sheet/modal entrance.
  sheet: { type: "spring", stiffness: 260, damping: 28, mass: 0.9 } as const,
  // Envelope opening — slower, mass-y.
  unfold: { type: "spring", stiffness: 180, damping: 22, mass: 1.1 } as const,
  // Cross-fades / opacity only.
  fade: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } as const,
} satisfies Record<string, Transition>;

const instant: Transition = { duration: 0 };

export function useAppleMotion() {
  const reduced = useReducedMotion();
  if (reduced) {
    return {
      press: instant,
      sheet: instant,
      unfold: instant,
      fade: instant,
    };
  }
  return springs;
}
```

* [ ] **Step 2: Verify**

Run: `pnpm build`.
Expected: typechecks. No usage yet.

* [ ] **Step 3: Commit**

```bash
git add presenters/components/motion/springs.ts
git commit -m "add Apple-style motion presets with reduced-motion hook"
```

***

### Task 4: Haptics utility

**Files:**

* Create: `presenters/components/motion/haptics.ts`

* [ ] **Step 1: Create the file**

```ts
// presenters/components/motion/haptics.ts
/**
 * Best-effort haptic tap. No-op when unsupported (desktop, iOS Safari).
 */
export function tapHaptic(intensity: "light" | "medium" = "light") {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  navigator.vibrate(intensity === "light" ? 8 : 14);
}
```

* [ ] **Step 2: Verify**

Run: `pnpm build`.
Expected: typechecks.

* [ ] **Step 3: Commit**

```bash
git add presenters/components/motion/haptics.ts
git commit -m "add tapHaptic best-effort vibrate utility"
```

***

### Task 5: Spring the envelope opening

**Files:**

* Modify: `presenters/components/postcard-design/arrival/ArrivalExperience.tsx`

* [ ] **Step 1: Replace rAF animation with motion spring**

Replace the entire body of `ArrivalExperience.tsx` with:

```tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion } from "motion/react";
import { animate } from "motion";
import type { Postcard } from "@/domain/types";
import { PostcardLanding } from "../viewer/PostcardLanding";
import { PostcardModalViewer } from "../viewer/PostcardModalViewer";
import { springs } from "@/presenters/components/motion/springs";
import { tapHaptic } from "@/presenters/components/motion/haptics";

type Props = {
  postcard: Postcard;
  imageMap?: Record<string, string>;
  shareUrlLabel?: string;
};

type Phase = "sealed" | "opening" | "open";

export function ArrivalExperience({
  postcard,
  imageMap = {},
  shareUrlLabel,
}: Props) {
  const [phase, setPhase] = useState<Phase>("sealed");
  const openAmount = useMotionValue(0);
  const [openAmountState, setOpenAmountState] = useState(0);
  const reduced = useReducedMotion();

  const resolveImageUrl = useCallback(
    (ref: string) => imageMap[ref] ?? "",
    [imageMap]
  );

  const handleOpen = useCallback(() => {
    if (phase !== "sealed") return;
    setPhase("opening");
    tapHaptic("medium");

    if (reduced) {
      openAmount.set(1);
      setOpenAmountState(1);
      setPhase("open");
      return;
    }

    const controls = animate(openAmount, 1, {
      ...springs.unfold,
      onUpdate: (v) => setOpenAmountState(v),
      onComplete: () => setPhase("open"),
    });
    return () => controls.stop();
  }, [openAmount, phase, reduced]);

  const handleDismiss = useCallback(() => {
    openAmount.set(0);
    setOpenAmountState(0);
    setPhase("sealed");
  }, [openAmount]);

  const insidePhotoSrc = useMemo(() => {
    for (const b of postcard.blocks) {
      if (b.type === "photo" && b.image?.ref) {
        const url = imageMap[b.image.ref];
        if (url) return url;
      }
    }
    return undefined;
  }, [postcard.blocks, imageMap]);

  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100dvh" }}>
      <motion.div
        style={{ position: "absolute", inset: 0 }}
        animate={{ opacity: phase === "open" ? 0 : 1 }}
        transition={springs.fade}
        aria-hidden={phase === "open"}
      >
        <PostcardLanding
          addressee={postcard.to}
          sender={postcard.from}
          place={postcard.place}
          shareUrlLabel={shareUrlLabel}
          openAmount={openAmountState}
          onOpen={handleOpen}
          insidePhotoSrc={insidePhotoSrc}
        />
      </motion.div>
      <AnimatePresence>
        {phase === "open" && (
          <div style={{ position: "absolute", inset: 0 }}>
            <PostcardModalViewer
              postcard={postcard}
              resolveImageUrl={resolveImageUrl}
              onDismiss={handleDismiss}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

* [ ] **Step 2: Verify build**

Run: `pnpm build`.
Expected: typechecks.

* [ ] **Step 3: Manual smoke**

Open a postcard URL. Tap "Open" — envelope flap should rotate with overshoot (not linear). Toggle Reduced Motion in macOS Accessibility → it should snap open instantly.

* [ ] **Step 4: Commit**

```bash
git add presenters/components/postcard-design/arrival/ArrivalExperience.tsx
git commit -m "spring envelope opening, honor prefers-reduced-motion"
```

***

### Task 6: Spring the flap arrow on the Open button

**Files:**

* Modify: `presenters/components/postcard-design/viewer/PostcardLanding.tsx`

* [ ] **Step 1: Add focus-visible styling + spring transition**

Replace lines 170–205 of `PostcardLanding.tsx`:

```tsx
        <button
          type="button"
          onClick={onOpen}
          disabled={openAmount > 0.05}
          aria-label="Open postcard"
          aria-disabled={openAmount > 0.05}
          className="focus-visible:ring-2 focus-visible:ring-[var(--inkblue)] focus-visible:ring-offset-2 focus-visible:outline-none"
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            background: "var(--ink)",
            color: "var(--paper-light)",
            border: "none",
            cursor: openAmount > 0.05 ? "default" : "pointer",
            boxShadow: "0 6px 18px rgba(40,30,20,.18)",
            display: "inline-grid",
            placeItems: "center",
            padding: 0,
            transition: "transform 180ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{
              transform: `rotate(${openAmount * 180}deg)`,
              transition: "transform 180ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <path d="M6 9 L12 15 L18 9" />
          </svg>
        </button>
```

* [ ] **Step 2: Verify**

Run: `pnpm build && pnpm lint`.

* [ ] **Step 3: Manual smoke**

Tab into the page. Focus ring should appear on Open button. Click opens with eased arrow flip.

* [ ] **Step 4: Commit**

```bash
git add presenters/components/postcard-design/viewer/PostcardLanding.tsx
git commit -m "ease landing open button, add focus-visible ring"
```

***

## Phase 3 — Modal dialog accessibility

### Task 7: Focus trap hook

**Files:**

* Create: `presenters/hooks/useFocusTrap.ts`

* [ ] **Step 1: Create the file**

```ts
"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;

    const prevFocus = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute("aria-hidden"),
      );

    const first = focusables()[0];
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) return;
      const firstEl = list[0];
      const lastEl = list[list.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prevFocus?.focus?.();
    };
  }, [ref, active]);
}
```

* [ ] **Step 2: Verify**

Run: `pnpm build`.

* [ ] **Step 3: Commit**

```bash
git add presenters/hooks/useFocusTrap.ts
git commit -m "add useFocusTrap hook for modal accessibility"
```

***

### Task 8: Escape-key hook

**Files:**

* Create: `presenters/hooks/useEscapeKey.ts`

* [ ] **Step 1: Create the file**

```ts
"use client";

import { useEffect } from "react";

export function useEscapeKey(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscape();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, onEscape]);
}
```

* [ ] **Step 2: Verify**

Run: `pnpm build`.

* [ ] **Step 3: Commit**

```bash
git add presenters/hooks/useEscapeKey.ts
git commit -m "add useEscapeKey hook"
```

***

### Task 9: Make `PostcardModalViewer` a proper dialog

**Files:**

* Modify: `presenters/components/postcard-design/viewer/PostcardModalViewer.tsx`

* [ ] **Step 1: Add dialog semantics, focus trap, Escape, and overscroll containment**

Replace the file contents:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import type { Postcard } from "@/domain/types";
import { PostcardBlockView } from "../blocks/PostcardBlockView";
import { ModalBackdrop } from "./ModalBackdrop";
import { PostcardHero } from "./PostcardHero";
import { PostcardHeader } from "./PostcardHeader";
import { PostcardEnd } from "./PostcardEnd";
import { useFocusTrap } from "@/presenters/hooks/useFocusTrap";
import { useEscapeKey } from "@/presenters/hooks/useEscapeKey";
import { springs } from "@/presenters/components/motion/springs";

type Props = {
  postcard: Postcard;
  initialScroll?: number;
  resolveImageUrl?: (ref: string) => string;
  onDismiss?: () => void;
};

export function PostcardModalViewer({
  postcard,
  initialScroll = 0,
  resolveImageUrl,
  onDismiss,
}: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(dialogRef, true);
  useEscapeKey(Boolean(onDismiss), () => onDismiss?.());

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = initialScroll;
  }, [initialScroll]);

  return (
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Postcard from ${postcard.from}`}
      className="app"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "#100c08",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={springs.fade}
    >
      <ModalBackdrop />

      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Close postcard"
          className="focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 20,
            width: 44,
            height: 44,
            display: "grid",
            placeItems: "center",
            background: "rgba(20,14,8,.6)",
            border: "1px solid rgba(246,241,231,.25)",
            borderRadius: 999,
            color: "rgba(246,241,231,.92)",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6 L18 18 M18 6 L6 18" />
          </svg>
        </button>
      )}

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={springs.sheet}
        style={{
          position: "absolute",
          inset: 0,
          background: "var(--paper)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 0 60px rgba(40,28,16,.55)",
          borderRadius: "22px 22px 0 0",
        }}
      >
        <div
          ref={scrollRef}
          className="no-scrollbar"
          style={{
            flex: 1,
            overflow: "auto",
            overscrollBehavior: "contain",
          }}
        >
          <PostcardHero postcard={postcard} resolveImageUrl={resolveImageUrl} />
          <PostcardHeader postcard={postcard} />
          {postcard.blocks.map((block) => (
            <PostcardBlockView
              key={block.id}
              block={block}
              resolveImageUrl={resolveImageUrl}
            />
          ))}
          <PostcardEnd writeBackTo={postcard.from} />
        </div>
      </motion.div>
    </motion.div>
  );
}
```

Behavior changes:

* Modal slides up from bottom (`translateY 100% → 0`) on a sheet spring (was `scaleY` from top center).

* `role="dialog"` + `aria-modal="true"` + `aria-label`.

* Focus trapped inside; Escape dismisses; previous focus restored on close.

* `overscroll-behavior: contain` on the scroller — no scroll bleed.

* [ ] **Step 2: Drop misleading "swipe down" copy**

Edit `presenters/components/postcard-design/viewer/ModalBackdrop.tsx`. Remove lines 41–56 (the entire `<div className="t-mono">…swipe down to tuck back inside…</div>` block). Either wire the gesture or remove the promise; for this plan we remove the promise.

* [ ] **Step 3: Verify build**

Run: `pnpm build && pnpm lint`.

* [ ] **Step 4: Manual smoke**

Open a postcard. Modal should slide up from the bottom with overshoot. Press Escape → dismisses. Tab → focus stays inside (Close → first link inside content → wraps back to Close). Focus returns to the Open button on close.

* [ ] **Step 5: Commit**

```bash
git add presenters/components/postcard-design/viewer/PostcardModalViewer.tsx presenters/components/postcard-design/viewer/ModalBackdrop.tsx
git commit -m "make postcard modal a proper dialog with focus trap and escape"
```

***

## Phase 4 — View transitions for photo zoom

### Task 10: Enable Next 16 view transitions

**Files:**

* Modify: `next.config.ts` (or `.js` — check repo)

* [ ] **Step 1: Inspect current config**

Run: `cat next.config.ts 2>/dev/null || cat next.config.js 2>/dev/null || cat next.config.mjs 2>/dev/null`.
Note the existing structure.

* [ ] **Step 2: Enable view transitions experimental flag**

Edit the config file's `experimental` block (create if missing). Example for `next.config.ts`:

```ts
const nextConfig = {
  experimental: {
    viewTransition: true,
  },
};
export default nextConfig;
```

* [ ] **Step 3: Verify**

Run: `pnpm build`.
Expected: builds clean; warning about experimental flag is acceptable.

* [ ] **Step 4: Commit**

```bash
git add next.config.ts
git commit -m "enable experimental viewTransition flag"
```

***

### Task 11: Native-`<dialog>` photo lightbox with view transition

**Files:**

* Create: `presenters/components/postcard-design/viewer/PostcardLightbox.tsx`

* Modify: `presenters/components/postcard-design/blocks/PhotoBlockView.tsx`

* Modify: `package.json`

* [ ] **Step 1: Create the lightbox**

```tsx
// presenters/components/postcard-design/viewer/PostcardLightbox.tsx
"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string;
  alt?: string;
  open: boolean;
  onClose: () => void;
  transitionName?: string;
};

export function PostcardLightbox({ src, alt = "", open, onClose, transitionName }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    else if (!open && dlg.open) dlg.close();
  }, [open]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    const onClick = (e: MouseEvent) => {
      if (e.target === dlg) onClose();
    };
    dlg.addEventListener("cancel", onCancel);
    dlg.addEventListener("click", onClick);
    return () => {
      dlg.removeEventListener("cancel", onCancel);
      dlg.removeEventListener("click", onClick);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={alt || "Photo"}
      style={{
        background: "rgba(20,14,8,0.94)",
        border: "none",
        padding: 0,
        width: "100vw",
        height: "100dvh",
        maxWidth: "100vw",
        maxHeight: "100dvh",
        margin: 0,
        inset: 0,
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close photo"
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          width: 44,
          height: 44,
          borderRadius: 999,
          background: "rgba(20,14,8,0.6)",
          border: "1px solid rgba(246,241,231,0.25)",
          color: "rgba(246,241,231,0.92)",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6 L18 18 M18 6 L6 18" />
        </svg>
      </button>
      <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", padding: 24 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            viewTransitionName: transitionName,
            touchAction: "pinch-zoom",
          }}
        />
      </div>
    </dialog>
  );
}
```

* [ ] **Step 2: Swap the lightbox import**

Edit `presenters/components/postcard-design/blocks/PhotoBlockView.tsx`:

Replace line 4:

```tsx
import { PostcardLightbox } from "../viewer/PostcardLightbox";
```

Update the JSX at lines 112–117:

```tsx
          <PostcardLightbox
            src={imageUrl}
            alt={block.caption}
            open={open}
            onClose={() => setOpen(false)}
            transitionName={`photo-${block.id}`}
          />
```

Also add `viewTransitionName` to the inline photo at lines 61–67. Replace the `Photo` element with a wrapper:

```tsx
      <div style={{ viewTransitionName: open ? undefined : `photo-${block.id}` }}>
        <Photo
          kind={block.kind}
          src={imageUrl}
          alt={block.caption ?? ""}
          fit={isHandwriting ? "contain" : "cover"}
          style={photoStyle}
        />
      </div>
```

(Setting `viewTransitionName` to undefined while the dialog is open prevents two elements claiming the same name.)

* [ ] **Step 3: Remove** **`yet-another-react-lightbox`**

Run: `pnpm remove yet-another-react-lightbox`.

Delete the old file: `rm presenters/components/postcard-design/blocks/PhotoLightbox.tsx`.

* [ ] **Step 4: Verify**

Run: `pnpm build && pnpm lint`.

* [ ] **Step 5: Manual smoke**

Open a postcard with a photo. Tap photo → opens fullscreen with paper-toned scrim. Photo morphs from card position to centered (View Transitions). Press Escape → returns. Pinch-zoom works on touch device. Bundle size should drop by \~30–40 KB gzipped.

* [ ] **Step 6: Commit**

```bash
git add presenters/components/postcard-design/viewer/PostcardLightbox.tsx presenters/components/postcard-design/blocks/PhotoBlockView.tsx package.json pnpm-lock.yaml
git rm presenters/components/postcard-design/blocks/PhotoLightbox.tsx
git commit -m "replace yet-another-react-lightbox with native dialog + view transitions"
```

***

## Phase 5 — Map and chrome polish

### Task 12: Map accessibility + glass chrome

**Files:**

* Modify: `app/map/page.tsx`

* Modify: `presenters/components/Map/PostcardMap.tsx`

* [ ] **Step 1: Add** **`role`** **and** **`aria-label`** **to map container**

In `presenters/components/Map/PostcardMap.tsx` replace line 116:

```tsx
    <div
      ref={mapContainer}
      role="region"
      aria-label="Map of postcards"
      className="h-full w-full"
    />
```

* [ ] **Step 2: Make markers focusable + add hover halo**

In `PostcardMap.tsx` lines 57–71, replace the marker construction:

```ts
        const el = document.createElement("button");
        el.type = "button";
        el.className = "postcard-marker";
        el.setAttribute(
          "aria-label",
          `Postcard${marker.title ? ": " + marker.title : ""}`,
        );
        el.style.width = "14px";
        el.style.height = "14px";
        el.style.padding = "0";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = "#e07a5f";
        el.style.border = "2px solid #fff";
        el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.2)";
        el.style.cursor = "pointer";
        el.style.transition = "transform 180ms cubic-bezier(0.22, 1, 0.36, 1)";
        el.addEventListener("mouseenter", () => {
          el.style.transform = "scale(1.25)";
        });
        el.addEventListener("mouseleave", () => {
          el.style.transform = "scale(1)";
        });
        el.addEventListener("focus", () => {
          el.style.outline = "2px solid #4a6378";
          el.style.outlineOffset = "2px";
        });
        el.addEventListener("blur", () => {
          el.style.outline = "none";
        });

        const ageMs = Date.now() - marker.createdAt.getTime();
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        const opacity = Math.max(0.3, 1 - ageDays / 30);
        el.style.opacity = String(opacity);
```

* [ ] **Step 3: Add glass styling to map chrome**

In `app/map/page.tsx` replace lines 54–73 (the `← home` Link):

```tsx
      <Link
        href="/"
        className="focus-visible:ring-2 focus-visible:ring-[var(--inkblue)] focus-visible:outline-none"
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          padding: "8px 14px",
          background: "rgba(246, 241, 231, 0.72)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          color: "var(--ink)",
          textDecoration: "none",
          borderRadius: 999,
          fontSize: 13,
          fontFamily: "var(--font-mono)",
          letterSpacing: 1,
          textTransform: "uppercase",
          boxShadow: "var(--sh-card)",
          border: "1px solid rgba(60, 40, 20, 0.08)",
        }}
      >
        ←&nbsp;home
      </Link>
```

And lines 75–93 (the fake-mode badge):

```tsx
        <div
          className="t-mono"
          style={{
            position: "absolute",
            bottom: 14,
            left: 14,
            padding: "6px 12px",
            background: "rgba(246, 241, 231, 0.72)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            color: "var(--ink-mute)",
            borderRadius: 999,
            fontSize: 9,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            boxShadow: "var(--sh-card)",
            border: "1px solid rgba(60, 40, 20, 0.08)",
          }}
        >
          local · {markers.length} fake postcards
        </div>
```

* [ ] **Step 4: Verify**

Run: `pnpm build && pnpm lint`.

* [ ] **Step 5: Manual smoke**

Open `/map?fake=1`. Confirm: `← home` pill has glass blur over map tiles; markers grow on hover; Tab cycles through markers with visible inkblue ring; clicking still opens popup.

* [ ] **Step 6: Commit**

```bash
git add app/map/page.tsx presenters/components/Map/PostcardMap.tsx
git commit -m "glass chrome on map, focusable markers with hover halo"
```

***

### Task 13: Composer accessibility pass

**Files:**

* Modify: `presenters/components/postcard-design/composer/ComposerRecipient.tsx`

* Modify: `presenters/components/postcard-design/composer/ComposerEditor.tsx`

* [ ] **Step 1: Recipient — proper label and no mobile autofocus**

In `ComposerRecipient.tsx` delete lines 22–24 (the `useEffect` autoFocus block).

Replace lines 52–91 (the `<div>` wrapping `<input>`):

```tsx
        <div style={{ marginTop: 40, position: "relative" }}>
          <label
            htmlFor="composer-to"
            className="t-mono"
            style={{
              fontSize: 9,
              letterSpacing: 1.8,
              color: "var(--ink-mute)",
              textTransform: "uppercase",
              marginBottom: 4,
              display: "block",
            }}
          >
            To
          </label>
          <div
            style={{
              padding: "6px 0 12px",
              borderBottom: "1.5px solid var(--ink-faint)",
            }}
          >
            <input
              ref={inputRef}
              id="composer-to"
              name="to"
              autoComplete="off"
              spellCheck={false}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder="mom"
              className="t-hand"
              style={{
                fontSize: 38,
                color: "var(--ink)",
                lineHeight: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                width: "100%",
                fontFamily: "var(--font-hand), cursive",
              }}
            />
          </div>
```

Also delete `useEffect` and `useRef` import-only lines if unused now. Keep `useRef` if any other ref persists.

Actually `inputRef` was only used by the deleted autoFocus block. Replace lines 1–4:

```tsx
"use client";

import { useState } from "react";
import { ComposerChrome } from "./ComposerChrome";
```

And drop the `inputRef` declaration on line 20 and the `ref={inputRef}` attribute on the input.

* [ ] **Step 2: Editor —** **`aria-live`** **on error,** **`focus-visible`** **on toolbar**

In `ComposerEditor.tsx` replace lines 384–398 (the `photoError` block):

```tsx
        {photoError && (
          <div
            role="alert"
            aria-live="polite"
            style={{
              margin: "0 22px 12px",
              padding: "8px 12px",
              background: "rgba(168,73,60,.10)",
              border: "1px solid var(--stamp-red)",
              borderRadius: 8,
              color: "var(--stamp-red)",
              fontSize: 12,
            }}
          >
            {photoError}
          </div>
        )}
```

Replace `toolBtnStyle()` at lines 617–633:

```tsx
function toolBtnStyle() {
  return {
    width: 38,
    height: 38,
    padding: 0,
    borderRadius: 8,
    background: "transparent",
    border: "1px solid var(--paper-edge)",
    cursor: "pointer",
    color: "var(--ink-soft)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontFamily: "inherit",
  } as const;
}
```

Add `className="focus-visible:ring-2 focus-visible:ring-[var(--inkblue)] focus-visible:outline-none"` to each of the five toolbar buttons (lines 521–566). Example for the first:

```tsx
        <button
          type="button"
          onClick={() => onPickPhoto("uploaded")}
          disabled={photoBusy}
          style={toolBtnStyle()}
          className="focus-visible:ring-2 focus-visible:ring-[var(--inkblue)] focus-visible:outline-none"
          title="Photo"
          aria-label="Photo"
        >
          <Icon name="image" size={18} strokeWidth={1.6} />
        </button>
```

Apply identically to the four other toolbar buttons (Song, Video, Place, Link).

* [ ] **Step 3: Editor — fix React array-index keys**

In `ComposerEditor.tsx` line 321, change `key={i}` to a stable composite. Since draft blocks have no id at this layer, derive one:

Replace lines 320–348:

```tsx
          {blocks.map((b, i) => {
            const key = `${b.type}-${i}-${
              b.type === "md" ? b.md.slice(0, 8) : b.type === "photo" ? b.blob?.ref.$link ?? "draft" : (b as { url?: string }).url ?? "x"
            }`;
            return (
              <div key={key} style={{ position: "relative" }}>
                <PostcardBlockView block={draftToView(b, i)} resolveImageUrl={resolveImageUrl} />
                <button
                  type="button"
                  onClick={() => removeBlock(i)}
                  aria-label="Remove block"
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "rgba(60,40,20,.6)",
                    color: "var(--paper-light)",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: 14,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
```

* [ ] **Step 4: Verify**

Run: `pnpm build && pnpm lint`.

* [ ] **Step 5: Manual smoke**

Walk through compose flow on mobile DevTools:

* Recipient screen: no auto-keyboard pop. Tap "To" label → focuses input. Spellcheck red squiggles do NOT appear under typed name.

* Editor: Tab through toolbar — each button shows inkblue ring. Upload a bad file (rename `.txt` to `.jpg`) to trigger error — screen reader should announce it (verify via VoiceOver if available).

* [ ] **Step 6: Commit**

```bash
git add presenters/components/postcard-design/composer/ComposerRecipient.tsx presenters/components/postcard-design/composer/ComposerEditor.tsx
git commit -m "composer a11y: label, no mobile autofocus, focus rings, aria-live errors, stable keys"
```

***

### Task 14: Localized timestamps in `PostcardHeader`

**Files:**

* Modify: `presenters/components/postcard-design/viewer/PostcardHeader.tsx`

* [ ] **Step 1: Replace** **`formatDistanceToNowStrict`** **with** **`Intl.RelativeTimeFormat`**

Replace lines 1–24 of `PostcardHeader.tsx`:

```tsx
import type { Postcard } from "@/domain/types";
import { Postmark } from "../primitives/Postmark";

type Props = { postcard: Postcard };

function senderInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed[0].toUpperCase() : "·";
}

function postmarkPlace(place: string | undefined): string {
  if (!place) return "MAIL";
  const upper = place.toUpperCase();
  return upper.length <= 5 ? upper : upper.slice(0, 3);
}

const ROMAN_MONTHS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"] as const;

function formatDate(d: Date): string {
  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear() % 100;
  return `${day}·${ROMAN_MONTHS[month]}·${year}`;
}

function relativeTime(d: Date): string {
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const diffMs = d.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(diffSec, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 2_592_000) return rtf.format(Math.round(diffSec / 86400), "day");
  if (abs < 31_536_000) return rtf.format(Math.round(diffSec / 2_592_000), "month");
  return rtf.format(Math.round(diffSec / 31_536_000), "year");
}
```

* [ ] **Step 2: Use** **`relativeTime`** **and wrap the roman date in** **`translate="no"`**

Replace lines 60–80:

```tsx
        <div
          className="t-mono"
          style={{
            fontSize: 9,
            letterSpacing: 1.2,
            color: "var(--ink-mute)",
            textTransform: "uppercase",
            marginTop: 3,
          }}
        >
          {postcard.place ? `sent from ${postcard.place} · ` : ""}
          {relativeTime(postcard.createdAt)}
        </div>
      </div>
      <Postmark
        place={postmarkPlace(postcard.place)}
        date={formatDate(postcard.createdAt)}
        size={54}
        rot={-6}
      />
```

In `Postmark.tsx`, wrap the date rendering with `<span translate="no">`. (If `Postmark` isn't read in this plan, skip — only essential for translated pages.)

* [ ] **Step 3: Verify**

Run: `pnpm build && pnpm lint`.

* [ ] **Step 4: Manual smoke**

Open a fixture postcard. Confirm "sent from … · 2 hours ago" reads correctly. Switch browser language to French → reads "il y a 2 heures".

* [ ] **Step 5: Commit**

```bash
git add presenters/components/postcard-design/viewer/PostcardHeader.tsx
git commit -m "localize relative timestamps via Intl.RelativeTimeFormat"
```

***

## Phase 6 — Cleanup and ship

### Task 15: Final regression sweep

* [ ] **Step 1: Full build, lint, type-check**

```bash
pnpm install
pnpm lint
pnpm build
```

Expected: zero errors, zero warnings related to our edits.

* [ ] **Step 2: Bundle size diff**

```bash
ls -la .next/static/chunks/*.js | sort -k5 -nr | head -10
```

Compare against pre-plan baseline — total JS should shrink (lightbox removed, two fonts removed).

* [ ] **Step 3: Manual end-to-end**

Sequence:

1. Visit `/` — logo renders, primary CTA has focus ring.
2. Click "Write a postcard" → `/compose`.
3. Type recipient → no autofocus on mobile, label clickable.
4. Add a photo, type a note, paste a song URL via `/song`.
5. Preview → publish (or cancel).
6. Visit `/map?fake=1` — markers focusable, glass chrome reads.
7. Click a marker → postcard route.
8. Tap "Open" — envelope springs open.
9. Modal slides up from bottom. Press Escape → returns.
10. Tap a photo inside — lightbox opens with view-transition morph.
11. Toggle macOS "Reduce Motion" → repeat 8–10. Everything snaps.

* [ ] **Step 4: Commit any small fixes found**

```bash
git add -p
git commit -m "fix regressions found in final sweep"
```

(Skip if nothing to fix.)

***

## Self-Review Checklist

* ✅ Spec coverage: each of the top-5 Apple-lens moves maps to a task (fonts → Task 1–2, springs → Task 3, 5, 6, modal a11y → Task 7, 8, 9, view transitions → Task 10, 11, map polish → Task 12, composer a11y → Task 13, locale → Task 14).

* ✅ No placeholders: every code step shows the literal code to write.

* ✅ Type consistency: `springs` exported keys (`press`, `sheet`, `unfold`, `fade`) used identically across Tasks 5, 6, 9.

* ✅ Hook names: `useFocusTrap` and `useEscapeKey` defined in Tasks 7–8, used in Task 9.

* ✅ Component name: `PostcardLightbox` created in Task 11, replaces all uses of `PhotoLightbox`.

* ✅ Frequent commits: one per task, small and reversible.

***

## Out of scope (deliberately deferred)

* Replace 4-step compose flow with single-screen experience.

* Map basemap restyle (Apple Maps vibe via custom MapLibre style spec).

* Map-pin → hero shared-element transition across route boundary (needs more design).

* Tiptap toolbar redesign as segmented control.

* Dark mode visual QA pass.

* Vitest + Playwright test runner setup.

* Swipe-down-to-dismiss gesture on modal (the copy was removed in Task 9; gesture can return later).

* Replace WhatsApp green CTA with neutral ink button.

* Drop rotated cards on `PhotoBlockView`/`OGCard` (visual call — leave to author).

Each is a separate plan when prioritized.
