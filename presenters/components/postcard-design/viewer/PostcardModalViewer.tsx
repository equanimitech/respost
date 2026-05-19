"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("viewer");
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
          aria-label={t("closeAria")}
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
