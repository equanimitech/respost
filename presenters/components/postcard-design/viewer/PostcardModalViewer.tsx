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

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = initialScroll;
  }, [initialScroll]);

  return (
    <motion.div
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
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <ModalBackdrop />

      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label={t("closeAria")}
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6 L18 18 M18 6 L6 18" />
          </svg>
        </button>
      )}

      <motion.div
        initial={{ scaleY: 0, opacity: 0.6 }}
        animate={{ scaleY: 1, opacity: 1 }}
        exit={{ scaleY: 0, opacity: 0.6 }}
        transition={{
          scaleY: { type: "spring", damping: 22, stiffness: 160, mass: 1.1 },
          opacity: { duration: 0.25 },
        }}
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "top center",
          background: "var(--paper)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 0 60px rgba(40,28,16,.55)",
        }}
      >
        <div
          ref={scrollRef}
          className="no-scrollbar"
          style={{ flex: 1, overflow: "auto" }}
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
