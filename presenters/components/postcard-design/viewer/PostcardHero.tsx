import type { Postcard } from "@/domain/types";
import { Photo } from "../primitives/Photo";

type Props = {
  postcard: Postcard;
  resolveImageUrl?: (ref: string) => string;
};

export function PostcardHero({ postcard, resolveImageUrl }: Props) {
  const { cover, title, summary } = postcard;
  const coverSrc = cover && resolveImageUrl ? resolveImageUrl(cover.ref) : undefined;
  const hasHero = Boolean(coverSrc || title || summary);

  if (!hasHero) return null;

  return (
    <header
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--paper)",
      }}
    >
      {coverSrc && (
        <Photo
          src={coverSrc}
          alt={cover?.alt ?? title ?? ""}
          fit="cover"
          style={{ width: "100%", height: "45vh", minHeight: 240 }}
        />
      )}

      {(title || summary) && (
        <div
          style={{
            padding: coverSrc ? "32px 24px 12px" : "56px 24px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {title && (
            <h1
              className="t-serif"
              style={{
                fontFamily: "var(--font-serif-display), serif",
                fontSize: "clamp(32px, 5vw, 52px)",
                lineHeight: 1.05,
                fontWeight: 500,
                color: "var(--ink)",
                margin: 0,
                maxWidth: "22ch",
              }}
            >
              {title}
            </h1>
          )}
          {summary && (
            <p
              className="t-serif"
              style={{
                fontStyle: "italic",
                fontSize: "clamp(17px, 1.85vw, 21px)",
                lineHeight: 1.45,
                color: "var(--ink-mute)",
                margin: 0,
                maxWidth: "56ch",
              }}
            >
              {summary}
            </p>
          )}
        </div>
      )}

      <div
        aria-hidden
        style={{
          height: 1,
          margin: "16px 24px 0",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(60,40,20,.18) 50%, transparent 100%)",
        }}
      />
    </header>
  );
}
