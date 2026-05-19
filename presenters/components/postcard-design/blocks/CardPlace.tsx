import type { PlaceBlock } from "@/domain/types";
import { MiniMap } from "../primitives/MiniMap";
import { RealMiniMap } from "../primitives/RealMiniMap";
import { OGCard, SERVICE_LABELS } from "./OGCard";

type Props = { block: PlaceBlock; rot?: number };

export function CardPlace({ block, rot = -0.6 }: Props) {
  const hasCoords =
    typeof block.latitude === "number" && typeof block.longitude === "number";
  return (
    <OGCard host={SERVICE_LABELS.maps.label} hostDot={SERVICE_LABELS.maps.dot} rot={rot}>
      <a
        href={block.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "block", color: "inherit", textDecoration: "none" }}
      >
        {hasCoords ? (
          <RealMiniMap
            lat={block.latitude as number}
            lon={block.longitude as number}
            w={340}
            h={140}
          />
        ) : (
          <MiniMap w={340} h={140} pin={{ x: 0.55, y: 0.45 }} />
        )}
        <div style={{ padding: "12px 14px 14px" }}>
          <div className="t-serif" style={{ fontSize: 15, fontWeight: 500 }}>
            {block.name}
          </div>
          {block.addr && (
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-mute)",
                marginTop: 2,
              }}
            >
              {block.addr}
            </div>
          )}
          {block.caption && (
            <div
              className="t-hand"
              style={{
                fontSize: 17,
                color: "var(--terra-deep)",
                marginTop: 8,
                lineHeight: 1.2,
              }}
            >
              {block.caption}
            </div>
          )}
        </div>
      </a>
    </OGCard>
  );
}
