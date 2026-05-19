"use client";

import { useState } from "react";
import type { PhotoBlock } from "@/domain/types";
import { Photo } from "../primitives/Photo";
import { PostcardLightbox } from "../viewer/PostcardLightbox";

type Props = {
  block: PhotoBlock;
  imageUrl?: string; // resolved from blob ref by parent (server)
};

export function PhotoBlockView({ block, imageUrl }: Props) {
  const [open, setOpen] = useState(false);
  const rot = block.rot ?? -1.5;

  if (block.kind === "handwriting") {
    // The handwriting kind frames a real photo as paper-toned.
    // If no image, fall back to a stylised paper-handwritten card.
    if (!imageUrl) {
      return (
        <div
          style={{
            margin: "14px 22px",
            transform: `rotate(${rot}deg)`,
            boxShadow: "var(--sh-paper)",
            background: "var(--paper-light)",
            padding: 8,
          }}
        >
          <div className="paper-handwritten" style={{ padding: "18px 18px 16px" }}>
            <div
              className="t-hand"
              style={{ fontSize: 25, lineHeight: 1.35, color: "#3b3424" }}
            >
              {block.caption ?? "—"}
            </div>
          </div>
        </div>
      );
    }
  }

  // Handwriting scans (Supernote pages etc.) are tall portraits — let them
  // keep their natural aspect ratio, just cap the box. Regular photos stay
  // on the 4:5 postcard crop.
  const isHandwriting = block.kind === "handwriting";
  const photoStyle = isHandwriting
    ? { width: "100%", maxHeight: "min(520px, 70vh)" as const }
    : { width: "100%", aspectRatio: "4/5" };

  const inner = (
    <div
      style={{
        background: "var(--paper-light)",
        padding: "8px 8px 28px",
        boxShadow: "var(--sh-card)",
        position: "relative",
      }}
    >
      <div style={{ viewTransitionName: open ? undefined : `photo-${block.id}` }}>
        <Photo
          kind={block.kind}
          src={imageUrl}
          alt={block.caption ?? ""}
          fit={isHandwriting ? "contain" : "cover"}
          style={photoStyle}
        />
      </div>
      {block.caption && (
        <div
          className="t-hand"
          style={{
            position: "absolute",
            bottom: 6,
            left: 16,
            fontSize: 21,
            color: "var(--ink-soft)",
            lineHeight: 1,
          }}
        >
          {block.caption}
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{
        margin: "14px 22px",
        position: "relative",
        transform: `rotate(${rot}deg)`,
      }}
    >
      {imageUrl ? (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open photo at full size"
            style={{
              display: "block",
              cursor: "zoom-in",
              background: "transparent",
              border: 0,
              padding: 0,
              width: "100%",
              textAlign: "left",
            }}
          >
            {inner}
          </button>
          <PostcardLightbox
            src={imageUrl}
            alt={block.caption}
            open={open}
            onClose={() => setOpen(false)}
            transitionName={`photo-${block.id}`}
          />
        </>
      ) : (
        inner
      )}
    </div>
  );
}
