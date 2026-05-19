import type { CSSProperties, ReactNode } from "react";

type OGCardProps = {
  host: string;
  hostDot?: string;
  rot?: number;
  style?: CSSProperties;
  children: ReactNode;
};

export function OGCard({ host, hostDot, rot = 0.5, style, children }: OGCardProps) {
  return (
    <div
      style={{
        margin: "14px 22px",
        background: "var(--paper-light)",
        boxShadow: "var(--sh-card)",
        transform: `rotate(${rot}deg)`,
        position: "relative",
        ...style,
      }}
    >
      <div
        className="t-mono"
        style={{
          position: "absolute",
          top: -10,
          left: 14,
          fontSize: 9,
          color: "var(--ink-mute)",
          letterSpacing: 1.5,
          textTransform: "uppercase",
          background: "var(--paper)",
          padding: "2px 6px",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        {hostDot && (
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: hostDot,
            }}
          />
        )}
        {host}
      </div>
      {children}
    </div>
  );
}

export const SERVICE_LABELS = {
  spotify: { label: "Spotify", dot: "#1db954" },
  youtube: { label: "YouTube", dot: "#ff0033" },
  apple: { label: "Apple Music", dot: "#fa57c1" },
  soundcloud: { label: "SoundCloud", dot: "#ff7700" },
  bandcamp: { label: "Bandcamp", dot: "#629aa9" },
  maps: { label: "Google Maps", dot: "#4285f4" },
} as const;
