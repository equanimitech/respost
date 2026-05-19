import type { CSSProperties, ReactNode } from "react";
import type { PhotoKind } from "@/domain/types";

type PhotoProps = {
  kind?: PhotoKind;
  src?: string;
  alt?: string;
  children?: ReactNode;
  style?: CSSProperties;
  label?: string;
  fit?: "cover" | "contain";
};

const PLACEHOLDER_KINDS = new Set<PhotoKind>([
  "uploaded",
  "cafe",
  "beach",
  "street",
  "river",
  "window",
]);

/**
 * Render a photo using either a real `src` (uploaded blob URL) or one of the
 * design's gradient placeholders identified by `kind`.
 */
export function Photo({
  kind = "uploaded",
  src,
  alt = "",
  children,
  style,
  label,
  fit = "cover",
}: PhotoProps) {
  const placeholderClass = PLACEHOLDER_KINDS.has(kind) && !src
    ? `photo-placeholder ${kind}`
    : src
      ? ""
      : `photo-placeholder ${kind}`;

  return (
    <div
      className={placeholderClass}
      style={{
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          style={{
            width: "100%",
            height: fit === "contain" ? "auto" : "100%",
            maxHeight: "100%",
            objectFit: fit,
            display: "block",
            background: fit === "contain" ? "var(--paper-light)" : undefined,
          }}
        />
      ) : null}
      {label ? (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: 10,
            fontFamily: "var(--font-mono), monospace",
            fontSize: 9,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "rgba(255,255,255,.7)",
          }}
        >
          {label}
        </div>
      ) : null}
      {children}
    </div>
  );
}
