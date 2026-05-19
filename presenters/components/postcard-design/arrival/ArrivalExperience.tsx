"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import type { Postcard } from "@/domain/types";
import { PostcardLanding } from "../viewer/PostcardLanding";
import { PostcardModalViewer } from "../viewer/PostcardModalViewer";

type Props = {
  postcard: Postcard;
  imageMap?: Record<string, string>;
  shareUrlLabel?: string;
};

type Phase = "sealed" | "opening" | "open";

const OPENING_MS = 700;

export function ArrivalExperience({
  postcard,
  imageMap = {},
  shareUrlLabel,
}: Props) {
  const [phase, setPhase] = useState<Phase>("sealed");
  const [openAmount, setOpenAmount] = useState(0);
  const rafRef = useRef<number | null>(null);

  const resolveImageUrl = useCallback(
    (ref: string) => imageMap[ref] ?? "",
    [imageMap]
  );

  const stopAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const animateOpen = useCallback(() => {
    stopAnimation();
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / OPENING_MS);
      setOpenAmount(t);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        setPhase("open");
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [stopAnimation]);

  const handleOpen = useCallback(() => {
    if (phase !== "sealed") return;
    setPhase("opening");
    animateOpen();
  }, [animateOpen, phase]);

  const handleDismiss = useCallback(() => {
    stopAnimation();
    setOpenAmount(0);
    setPhase("sealed");
  }, [stopAnimation]);

  useEffect(() => () => stopAnimation(), [stopAnimation]);

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
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: phase === "open" ? 0 : 1,
          transition: "opacity 200ms ease",
          pointerEvents: phase === "open" ? "none" : "auto",
        }}
      >
        <PostcardLanding
          addressee={postcard.to}
          sender={postcard.from}
          place={postcard.place}
          shareUrlLabel={shareUrlLabel}
          openAmount={openAmount}
          onOpen={handleOpen}
          insidePhotoSrc={insidePhotoSrc}
        />
      </div>
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
