import type { MusicBlock } from "@/domain/types";
import { OGCard, SERVICE_LABELS } from "./OGCard";

const GRADIENTS: Record<string, string> = {
  a: "linear-gradient(135deg, #3a3328 0%, #5c4a35 60%, #b8634a 100%)",
  b: "linear-gradient(135deg, #4a6378 0%, #2f4456 70%, #d8b88a 100%)",
  c: "linear-gradient(135deg, #7d7647 0%, #a99270 80%, #f4ead4 100%)",
  d: "linear-gradient(135deg, #5a4a3a 0%, #8a6b4a 70%, #c8a878 100%)",
};

type Props = { block: MusicBlock; rot?: number };

export function CardMusic({ block, rot }: Props) {
  const s = SERVICE_LABELS[block.service];
  const gradient = GRADIENTS[block.tone ?? "a"];
  return (
    <OGCard host={s.label} hostDot={s.dot} rot={rot}>
      <div style={{ padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
        <div
          style={{
            width: 60,
            height: 60,
            flexShrink: 0,
            background: gradient,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "50% 50% auto auto",
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "var(--paper-light)",
              transform: "translate(50%, -50%)",
              border: "4px double rgba(60,40,20,.18)",
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="t-serif"
            style={{
              fontSize: 14,
              fontWeight: 500,
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {block.title}
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: "var(--ink-mute)",
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {[block.artist, block.album].filter(Boolean).join(" · ")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "var(--ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="8" height="8" viewBox="0 0 12 12">
                <path d="M3.5 2L10 6 3.5 10z" fill="var(--paper-light)" />
              </svg>
            </div>
            <a
              href={block.url}
              target="_blank"
              rel="noopener noreferrer"
              className="t-mono"
              style={{
                fontSize: 10,
                color: "var(--ink-mute)",
                textDecoration: "none",
              }}
            >
              {block.dur ? `${block.dur} · ` : ""}open in {s.label.toLowerCase()}
            </a>
          </div>
        </div>
      </div>
    </OGCard>
  );
}
