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
