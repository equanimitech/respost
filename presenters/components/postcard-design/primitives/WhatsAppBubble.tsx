import type { CSSProperties, ReactNode } from "react";

type WhatsAppBubbleProps = {
  children: ReactNode;
  fromMe?: boolean;
  time?: string;
  tail?: boolean;
  style?: CSSProperties;
};

export function WhatsAppBubble({
  children,
  fromMe = false,
  time = "14:32",
  tail = true,
  style,
}: WhatsAppBubbleProps) {
  const tailSide: CSSProperties = fromMe ? { right: -8 } : { left: -8 };
  const tailInner: CSSProperties = fromMe ? { right: 0 } : { left: 0 };
  return (
    <div
      style={{
        display: "flex",
        justifyContent: fromMe ? "flex-end" : "flex-start",
        padding: "2px 8px",
        ...style,
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          background: fromMe ? "#d9fdd3" : "#ffffff",
          color: "#111b21",
          padding: "6px 8px 4px",
          borderRadius: 8,
          position: "relative",
          boxShadow: "0 1px 0.5px rgba(11,20,26,.13)",
          fontSize: 14.2,
          lineHeight: 1.4,
          fontFamily: '-apple-system, system-ui, "Helvetica Neue", sans-serif',
        }}
      >
        {tail && (
          <div
            style={{
              position: "absolute",
              top: 0,
              width: 8,
              height: 13,
              overflow: "hidden",
              ...tailSide,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                width: 16,
                height: 16,
                background: fromMe ? "#d9fdd3" : "#ffffff",
                transform: fromMe
                  ? "rotate(45deg) translate(50%, -50%)"
                  : "rotate(-45deg) translate(-50%, -50%)",
                ...tailInner,
              }}
            />
          </div>
        )}
        {children}
        <div
          style={{
            fontSize: 10.5,
            color: "rgba(17,27,33,.45)",
            textAlign: "right",
            marginTop: 2,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 3,
          }}
        >
          {time}
          {fromMe && (
            <svg width="15" height="11" viewBox="0 0 15 11" fill="none" style={{ flexShrink: 0 }}>
              <path
                d="M11.071.653a.457.457 0 00-.05.063L4.842 8.974 2.305 6.396a.479.479 0 00-.679.677l2.992 3.04a.479.479 0 00.737-.062L11.83 1.328A.479.479 0 0011.07.653zm3.182 0a.457.457 0 00-.05.063l-6.18 8.258-.59-.598a.479.479 0 00-.679.677l1.054 1.07a.479.479 0 00.737-.061l6.466-8.722a.479.479 0 00-.758-.687z"
                fill="#53bdeb"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
