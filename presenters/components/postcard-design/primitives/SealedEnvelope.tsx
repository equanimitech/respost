"use client";

import type { CSSProperties } from "react";
import { Photo } from "./Photo";
import { Stamp } from "./Stamp";
import { Postmark } from "./Postmark";

type SealedEnvelopeProps = {
  w?: number;
  h?: number;
  addressee?: string;
  tone?: "kraft" | "paper";
  style?: CSSProperties;
  openAmount?: number;
  insidePhotoSrc?: string;
};

/**
 * A sealed kraft envelope. `openAmount` 0..1 drives the flap rotation
 * and the postcard rising from inside.
 */
export function SealedEnvelope({
  w = 280,
  h = 180,
  addressee = "a friend",
  tone = "kraft",
  style,
  openAmount = 0,
  insidePhotoSrc,
}: SealedEnvelopeProps) {
  const flapRot = -180 * openAmount;
  const cardRise = openAmount * 70;
  const cardOpacity = openAmount > 0.4 ? Math.min(1, (openAmount - 0.4) / 0.4) : 0;

  return (
    <div
      style={{
        position: "relative",
        width: w,
        height: h,
        transformStyle: "preserve-3d",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            tone === "kraft"
              ? "linear-gradient(180deg, #d8c8a8 0%, #c4b08a 100%)"
              : "linear-gradient(180deg, var(--paper-light) 0%, var(--paper-deep) 100%)",
          boxShadow:
            "0 16px 32px rgba(40,30,20,.22), inset 0 -8px 18px rgba(60,40,20,.08)",
        }}
      />
      <div style={{ position: "absolute", bottom: h * 0.15, left: w * 0.07 }}>
        <div
          className="t-mono"
          style={{
            fontSize: w * 0.034,
            letterSpacing: 1.5,
            color: "rgba(60,40,20,.45)",
            textTransform: "uppercase",
            marginBottom: 2,
          }}
        >
          to
        </div>
        <div
          className="t-hand"
          style={{ fontSize: w * 0.085, color: "#3b3424", lineHeight: 1 }}
        >
          {addressee}
        </div>
      </div>
      <div style={{ position: "absolute", top: w * 0.04, right: w * 0.05 }}>
        <Stamp w={w * 0.16} h={w * 0.20} rot={5}>
          r:p<br />0,75€
        </Stamp>
      </div>
      <div style={{ position: "absolute", top: w * 0.025, right: w * 0.21 }}>
        <Postmark place="BCN" date="19·V·26" size={w * 0.20} rot={-12} />
      </div>

      {openAmount > 0 && (
        <div
          style={{
            position: "absolute",
            left: w * 0.06,
            right: w * 0.06,
            top: -cardRise + "px",
            bottom: h * 0.08,
            background: "var(--paper-light)",
            padding: 6,
            boxShadow: "0 -6px 18px rgba(40,30,20,.18)",
            opacity: cardOpacity,
            transform: `rotate(${-1 + openAmount}deg)`,
            zIndex: 1,
          }}
        >
          <Photo
            kind="beach"
            src={insidePhotoSrc}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      )}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: h * 0.55,
          background:
            "linear-gradient(180deg, #c8b48a 0%, #b8a078 100%)",
          clipPath: "polygon(0 0, 100% 0, 50% 100%)",
          transformOrigin: "50% 0%",
          transform: `rotateX(${flapRot}deg) translateZ(${openAmount > 0 ? 4 : 2}px)`,
          boxShadow:
            openAmount > 0.1
              ? "0 4px 10px rgba(40,30,20,.18)"
              : "inset 0 -1px 1px rgba(40,30,20,.10)",
          transition: "none",
          zIndex: 2,
          backfaceVisibility: "visible",
        }}
      >
        {openAmount < 0.05 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              background:
                "linear-gradient(180deg, transparent 0, transparent calc(100% - 1px), rgba(40,30,20,.18) 100%)",
            }}
          />
        )}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: h * 0.55,
          background:
            tone === "kraft"
              ? "linear-gradient(180deg, #c4b08a 0%, #b69e7c 100%)"
              : "linear-gradient(180deg, var(--paper-deep) 0%, var(--paper-edge) 100%)",
          clipPath: "polygon(0 100%, 100% 100%, 50% 0)",
          transform: "translateY(50%)",
          boxShadow: "inset 0 1px 2px rgba(60,40,20,.18)",
          zIndex: 3,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
