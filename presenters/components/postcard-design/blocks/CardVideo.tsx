import type { VideoBlock } from "@/domain/types";
import { Photo } from "../primitives/Photo";
import { OGCard, SERVICE_LABELS } from "./OGCard";

type Props = { block: VideoBlock; rot?: number };

export function CardVideo({ block, rot = 0.8 }: Props) {
  const s = SERVICE_LABELS[block.service];
  return (
    <OGCard host={s.label} hostDot={s.dot} rot={rot}>
      <a
        href={block.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "block", color: "inherit", textDecoration: "none" }}
      >
        <div style={{ position: "relative" }}>
          <Photo
            kind={block.thumbKind ?? "street"}
            src={block.thumbUrl}
            style={{ width: "100%", aspectRatio: "16/9" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,.18)",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "rgba(255,255,255,.92)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 12 12">
                <path d="M3.5 2L10 6 3.5 10z" fill="var(--ink)" />
              </svg>
            </div>
          </div>
          {block.dur && (
            <div
              className="t-mono"
              style={{
                position: "absolute",
                bottom: 6,
                right: 8,
                background: "rgba(0,0,0,.7)",
                color: "white",
                fontSize: 10,
                padding: "2px 5px",
                borderRadius: 2,
              }}
            >
              {block.dur}
            </div>
          )}
        </div>
        <div style={{ padding: "10px 14px 12px" }}>
          <div
            className="t-serif"
            style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.3 }}
          >
            {block.title}
          </div>
          {block.channel && (
            <div
              style={{
                fontSize: 11.5,
                color: "var(--ink-mute)",
                marginTop: 3,
              }}
            >
              {block.channel}
            </div>
          )}
        </div>
      </a>
    </OGCard>
  );
}
