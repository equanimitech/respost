import type { PhotoBlock } from "@/domain/types";
import { Photo } from "../primitives/Photo";

type Props = {
  block: PhotoBlock;
  imageUrl?: string; // resolved from blob ref by parent (server)
};

export function PhotoBlockView({ block, imageUrl }: Props) {
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
              style={{ fontSize: 21, lineHeight: 1.35, color: "#3b3424" }}
            >
              {block.caption ?? "—"}
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div
      style={{
        margin: "14px 22px",
        position: "relative",
        transform: `rotate(${rot}deg)`,
      }}
    >
      <div
        style={{
          background: "var(--paper-light)",
          padding: "8px 8px 28px",
          boxShadow: "var(--sh-card)",
          position: "relative",
        }}
      >
        <Photo
          kind={block.kind}
          src={imageUrl}
          alt={block.caption ?? ""}
          style={{ width: "100%", aspectRatio: "4/5" }}
        />
        {block.caption && (
          <div
            className="t-hand"
            style={{
              position: "absolute",
              bottom: 6,
              left: 16,
              fontSize: 18,
              color: "var(--ink-soft)",
              lineHeight: 1,
            }}
          >
            {block.caption}
          </div>
        )}
      </div>
    </div>
  );
}
