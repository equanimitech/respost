import type { PlaceBlock } from "@/domain/types";
import { cn } from "@/presenters/lib/utils";
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
        className={cn("block text-inherit no-underline")}
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
        <div className={cn("px-3.5 pt-3 pb-3.5 @md:px-5 @md:pt-4 @md:pb-5")}>
          <div
            className={cn(
              "t-sans text-body font-semibold leading-tight tracking-tight text-ink",
              "@md:text-callout",
            )}
          >
            {block.name}
          </div>
          {block.addr && (
            <div
              className={cn(
                "t-sans mt-1 text-footnote leading-snug text-ink-mute",
                "@md:text-body",
              )}
            >
              {block.addr}
            </div>
          )}
          {block.caption && (
            <div
              className={cn(
                "t-hand mt-2.5 text-callout leading-tight text-terra-deep",
                "@md:text-title3",
              )}
            >
              {block.caption}
            </div>
          )}
        </div>
      </a>
    </OGCard>
  );
}
