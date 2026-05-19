"use client";

import { useEffect, useRef } from "react";
import type { Postcard } from "@/domain/types";
import { Postmark } from "../primitives/Postmark";
import { PostcardBlockView } from "../blocks/PostcardBlockView";
import { ModalBackdrop } from "./ModalBackdrop";
import { PostcardHeader } from "./PostcardHeader";
import { PostcardEnd } from "./PostcardEnd";

type Props = {
  postcard: Postcard;
  initialScroll?: number;
  sheetHeight?: string;
  resolveImageUrl?: (ref: string) => string;
  onDismiss?: () => void;
};

function postmarkPlace(place: string | undefined): string {
  if (!place) return "MAIL";
  const upper = place.toUpperCase();
  return upper.length <= 5 ? upper : upper.slice(0, 3);
}

function formatDate(d: Date): string {
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear() % 100;
  const romanMonth = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][month - 1];
  return `${day}·${romanMonth}·${year}`;
}

export function PostcardModalViewer({
  postcard,
  initialScroll = 0,
  sheetHeight = "84%",
  resolveImageUrl,
  onDismiss,
}: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = initialScroll;
  }, [initialScroll]);

  return (
    <div
      className="app"
      style={{ position: "relative", overflow: "hidden", background: "#100c08" }}
    >
      <ModalBackdrop />
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 10,
            background: "rgba(246,241,231,.1)",
            border: "1px solid rgba(246,241,231,.2)",
            borderRadius: 999,
            color: "rgba(246,241,231,.85)",
            padding: "6px 12px",
            fontSize: 11,
            fontFamily: "var(--font-mono), monospace",
            letterSpacing: 1,
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          close
        </button>
      )}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: sheetHeight,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* envelope mouth */}
        <div
          style={{
            height: 22,
            background:
              "linear-gradient(180deg, #c8b48a 0%, #b8a078 55%, #a89070 100%)",
            position: "relative",
            flexShrink: 0,
            boxShadow:
              "0 -3px 8px rgba(40,30,20,.35), inset 0 -1px 0 rgba(60,40,20,.18)",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 22,
              top: 5,
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "rgba(60,40,20,.55)",
            }}
          >
            <div
              className="t-mono"
              style={{
                fontSize: 8,
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              to
            </div>
            <div
              className="t-hand"
              style={{
                fontSize: 14,
                color: "rgba(60,40,20,.85)",
                lineHeight: 1,
              }}
            >
              {postcard.to}
            </div>
          </div>
          <div style={{ position: "absolute", top: -10, right: 22, opacity: 0.85 }}>
            <Postmark
              place={postmarkPlace(postcard.place)}
              date={formatDate(postcard.createdAt)}
              size={32}
              rot={-8}
              tone="#5c4a35"
            />
          </div>
        </div>

        <div
          style={{
            flex: 1,
            background: "var(--paper)",
            marginTop: -3,
            borderRadius: "8px 8px 0 0",
            boxShadow:
              "0 -1px 0 rgba(40,30,20,.16), inset 0 1px 0 rgba(255,255,255,.45), 0 -16px 24px rgba(20,16,12,.18)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            ref={scrollRef}
            className="no-scrollbar"
            style={{ flex: 1, overflow: "auto" }}
          >
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
        </div>
      </div>
    </div>
  );
}
