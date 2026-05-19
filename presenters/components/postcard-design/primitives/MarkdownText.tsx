import type { CSSProperties } from "react";
import { parseInline, splitParagraphs } from "@/domain/value-objects/markdown";

type MarkdownTextProps = {
  md: string;
  size?: number;
  style?: CSSProperties;
};

export function MarkdownText({ md, size = 17, style }: MarkdownTextProps) {
  const paragraphs = splitParagraphs(md);
  return (
    <div style={{ padding: "12px 28px", ...style }}>
      {paragraphs.map((para, i) => {
        const segments = parseInline(para);
        return (
          <p
            key={i}
            className="t-serif"
            style={{
              margin: i === 0 ? "0 0 12px" : "12px 0",
              fontSize: size,
              lineHeight: 1.55,
              color: "var(--ink)",
              textWrap: "pretty",
            }}
          >
            {segments.map((seg, j) => {
              if (seg.kind === "bold") return <strong key={j}>{seg.text}</strong>;
              if (seg.kind === "italic") return <em key={j}>{seg.text}</em>;
              return <span key={j}>{seg.text}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
}
