import type { CSSProperties } from "react";

type PostmarkProps = {
  place?: string;
  date?: string;
  tone?: string;
  size?: number;
  rot?: number;
  style?: CSSProperties;
};

export function Postmark({
  place = "LISBOA",
  date = "19·V·26",
  tone = "var(--terra-deep)",
  size = 88,
  rot = -8,
  style,
}: PostmarkProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `1.5px solid ${tone}`,
        color: tone,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transform: `rotate(${rot}deg)`,
        fontFamily: "var(--font-sans-display), sans-serif",
        opacity: 0.78,
        position: "relative",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 4,
          borderRadius: "50%",
          border: `0.5px dashed ${tone}`,
          opacity: 0.6,
        }}
      />
      <div
        style={{
          fontSize: size * 0.11,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        {place}
      </div>
      <div
        style={{
          width: "60%",
          height: 1,
          background: tone,
          opacity: 0.5,
          margin: "3px 0",
        }}
      />
      <div
        style={{
          fontSize: size * 0.13,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: 1,
        }}
      >
        {date}
      </div>
    </div>
  );
}
