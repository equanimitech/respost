import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/presenters/lib/utils";

type OGCardProps = {
  host: string;
  hostDot?: string;
  rot?: number;
  style?: CSSProperties;
  children: ReactNode;
};

// OGCard — paper-on-paper embed surface used by music / video / place /
// article cards. Outer wrapper keeps the floating "host" pill visible
// outside the rounded edge; an inner wrapper clips child media to the
// card's radius without hiding the pill.
export function OGCard({ host, hostDot, rot = 0.5, style, children }: OGCardProps) {
  return (
    <div
      className={cn("relative mx-6 my-4")}
      style={{ transform: `rotate(${rot}deg)`, ...style }}
    >
      <div
        className={cn(
          "t-mono absolute -top-2.5 left-3 z-10 flex items-center gap-1.5",
          "rounded-pill border border-paper-edge bg-paper px-2 py-0.5",
          "text-caption2 uppercase leading-none tracking-widest text-ink-mute",
        )}
      >
        {hostDot && (
          <span
            className={cn("size-1.5 rounded-pill")}
            style={{ background: hostDot }}
          />
        )}
        {host}
      </div>
      <div
        className={cn(
          "@container overflow-hidden rounded-md border border-paper-edge",
          "bg-paper-light shadow-card",
        )}
      >
        {children}
      </div>
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
