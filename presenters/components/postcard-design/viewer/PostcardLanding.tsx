"use client";

import { Icon } from "../primitives/Icon";
import { SealedEnvelope } from "../primitives/SealedEnvelope";

type Props = {
  addressee: string;
  sender: string;
  place?: string;
  shareUrlLabel?: string;
  openAmount?: number;
  onOpen?: () => void;
  insidePhotoSrc?: string;
};

export function PostcardLanding({
  addressee,
  sender,
  place,
  shareUrlLabel,
  openAmount = 0,
  onOpen,
  insidePhotoSrc,
}: Props) {
  return (
    <div
      className="app paper-grain"
      style={{
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 0,
      }}
    >
      {/* mini browser chrome */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 14px",
          height: 36,
          width: "100%",
          boxSizing: "border-box",
          flexShrink: 0,
          borderBottom: "1px solid var(--paper-edge)",
        }}
      >
        <div style={{ width: 16, height: 16 }}>
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="var(--ink-mute)"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M3 8l5-5v3h5v4H8v3z" />
          </svg>
        </div>
        <div
          className="t-mono"
          style={{
            fontSize: 10,
            color: "var(--ink-mute)",
            letterSpacing: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--olive)",
            }}
          />
          {shareUrlLabel ?? "respost.equanimi.tech"}
        </div>
        <div style={{ width: 16 }} />
      </div>

      {/* header */}
      <div
        style={{
          padding: "24px 22px 0",
          textAlign: "center",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          className="t-hand"
          style={{ fontSize: 26, color: "var(--ink-soft)", lineHeight: 1 }}
        >
          for {addressee},
        </div>
        <div
          className="t-mono"
          style={{
            fontSize: 10,
            letterSpacing: 2,
            color: "var(--ink-mute)",
            textTransform: "uppercase",
            marginTop: 10,
          }}
        >
          a postcard from
        </div>
        <div
          className="t-serif"
          style={{
            fontSize: 28,
            fontWeight: 500,
            lineHeight: 1.1,
            marginTop: 4,
          }}
        >
          {sender}
        </div>
        {place && (
          <div
            className="t-mono"
            style={{
              fontSize: 10,
              letterSpacing: 1.5,
              color: "var(--ink-mute)",
              textTransform: "uppercase",
              marginTop: 8,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="pin" size={11} color="currentColor" strokeWidth={1.8} />
            Sent from {place}
          </div>
        )}
      </div>

      {/* envelope — centered */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          position: "relative",
          perspective: 900,
        }}
      >
        <SealedEnvelope
          w={250}
          h={158}
          addressee={addressee}
          openAmount={openAmount}
          insidePhotoSrc={insidePhotoSrc}
        />
      </div>

      <div
        style={{
          padding: "0 22px 36px",
          width: "100%",
          boxSizing: "border-box",
          textAlign: "center",
        }}
      >
        <button
          type="button"
          onClick={onOpen}
          disabled={openAmount > 0.05}
          style={{
            padding: "14px 32px",
            borderRadius: 999,
            background: "var(--ink)",
            color: "var(--paper-light)",
            border: "none",
            cursor: openAmount > 0.05 ? "default" : "pointer",
            fontFamily: "inherit",
            fontSize: 15,
            fontWeight: 500,
            boxShadow: "0 6px 18px rgba(40,30,20,.18)",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {openAmount > 0.05 ? "Opening…" : "Open the envelope"}
        </button>
        <div
          className="t-mono"
          style={{
            fontSize: 9.5,
            letterSpacing: 1.2,
            color: "var(--ink-faint)",
            textTransform: "uppercase",
            marginTop: 14,
            lineHeight: 1.6,
          }}
        >
          no account · no app · just this page
        </div>
      </div>
    </div>
  );
}
