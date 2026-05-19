import type { CSSProperties, ReactNode } from "react";

type StampProps = {
  children?: ReactNode;
  w?: number;
  h?: number;
  rot?: number;
  style?: CSSProperties;
};

export function Stamp({ children, w = 64, h = 80, rot = 3, style }: StampProps) {
  return (
    <div
      style={{
        width: w,
        height: h,
        position: "relative",
        transform: `rotate(${rot}deg)`,
        filter: "drop-shadow(0 1px 2px rgba(60,40,20,.15))",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "var(--paper-light)",
          WebkitMask:
            "radial-gradient(circle 3.5px at 3.5px 3.5px, transparent 99%, #000) -3.5px -3.5px / 7px 7px",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 5,
          background: "var(--stamp-red)",
          color: "var(--paper-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-serif-display), serif",
          fontStyle: "italic",
          fontSize: 11,
          textAlign: "center",
          lineHeight: 1.1,
          padding: 4,
        }}
      >
        {children}
      </div>
    </div>
  );
}
