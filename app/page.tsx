import Link from "next/link";
import { Postmark } from "@/presenters/components/postcard-design/primitives/Postmark";

export default function Home() {
  return (
    <main className="phone-shell">
      <div className="phone-frame paper-grain">
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px calc(48px + env(safe-area-inset-bottom))",
            color: "var(--ink)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
            <Postmark place="RESPOST" date="" size={120} rot={-6} tone="var(--terra-deep)" />
          </div>

          <h1
            className="t-serif"
            style={{
              fontSize: 36,
              fontWeight: 500,
              lineHeight: 1.1,
              margin: 0,
              textAlign: "center",
              maxWidth: 340,
            }}
          >
            A postcard for someone you love.
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--ink-mute)",
              marginTop: 14,
              lineHeight: 1.6,
              textAlign: "center",
              maxWidth: 320,
            }}
          >
            Write something quiet. Tuck in a photo, a song, a place. Send the link.
            Their inbox is already on WhatsApp.
          </p>

          <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 10 }}>
            <Link
              href="/compose"
              style={{
                padding: "14px 28px",
                borderRadius: 999,
                background: "var(--ink)",
                color: "var(--paper-light)",
                textDecoration: "none",
                fontSize: 15,
                fontWeight: 500,
                textAlign: "center",
                boxShadow: "0 6px 18px rgba(40,30,20,.18)",
              }}
            >
              Write a postcard
            </Link>
            <Link
              href="/map"
              style={{
                padding: "10px 18px",
                color: "var(--ink-mute)",
                textDecoration: "underline",
                textUnderlineOffset: 4,
                fontSize: 13,
                textAlign: "center",
              }}
            >
              Open my map
            </Link>
          </div>

          <div
            className="t-mono"
            style={{
              marginTop: 40,
              fontSize: 9,
              letterSpacing: 1.8,
              color: "var(--ink-faint)",
              textTransform: "uppercase",
              textAlign: "center",
              lineHeight: 1.7,
            }}
          >
            no feed · no notifications
            <br />
            no read receipts
          </div>
        </div>
      </div>
    </main>
  );
}
