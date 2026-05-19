import type { ArticleBlock } from "@/domain/types";
import { Photo } from "../primitives/Photo";
import { OGCard } from "./OGCard";

type Props = { block: ArticleBlock; rot?: number };

export function CardArticle({ block, rot = -0.4 }: Props) {
  return (
    <OGCard host={block.host} hostDot="var(--ink-mute)" rot={rot}>
      <a
        href={block.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "flex", color: "inherit", textDecoration: "none" }}
      >
        <Photo
          kind={block.imageKind ?? "window"}
          src={block.imageUrl}
          style={{ width: 96, height: 96, flexShrink: 0 }}
        />
        <div style={{ padding: "10px 12px", flex: 1, minWidth: 0 }}>
          <div
            className="t-serif"
            style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.25 }}
          >
            {block.title}
          </div>
          {block.excerpt && (
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-mute)",
                marginTop: 4,
                lineHeight: 1.4,
              }}
            >
              {block.excerpt}
            </div>
          )}
        </div>
      </a>
    </OGCard>
  );
}
