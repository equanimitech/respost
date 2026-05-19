import Link from "next/link";
import { fakePostcards } from "@/application/fixtures/fakeData";

export const metadata = {
  title: "Review · Respost",
};

function firstSnippet(blocks: ReadonlyArray<{ type: string }>): string {
  for (const b of blocks) {
    const x = b as { type: string; md?: string };
    if (x.type === "md" && x.md) {
      return x.md.replace(/[*_#`>\-]/g, "").slice(0, 110);
    }
  }
  return "";
}

export default function ReviewIndexPage() {
  return (
    <main className="phone-shell">
      <div
        className="phone-frame paper-grain"
        style={{
          minHeight: "100dvh",
          padding: "40px 20px calc(40px + env(safe-area-inset-bottom))",
          color: "var(--ink)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            className="t-mono"
            style={{
              fontSize: 9,
              letterSpacing: 1.8,
              textTransform: "uppercase",
              color: "var(--ink-faint)",
              marginBottom: 6,
            }}
          >
            local · review
          </div>
          <h1
            className="t-serif"
            style={{ fontSize: 24, fontWeight: 500, margin: 0 }}
          >
            Fake postcards
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "var(--ink-mute)",
              marginTop: 6,
            }}
          >
            {fakePostcards.length} cards · not published, not on ATProto
          </p>
        </div>

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {fakePostcards.map((p) => (
            <li key={p.id}>
              <Link
                href={`/review/${p.id}`}
                style={{
                  display: "block",
                  padding: "14px 16px",
                  borderRadius: 10,
                  background: "var(--paper-light)",
                  border: "1px solid var(--paper-edge)",
                  textDecoration: "none",
                  color: "inherit",
                  boxShadow: "0 1px 3px rgba(40,30,20,.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 4,
                  }}
                >
                  <div className="t-serif" style={{ fontSize: 15, fontWeight: 500 }}>
                    to {p.to}
                  </div>
                  <div
                    className="t-mono"
                    style={{
                      fontSize: 9,
                      letterSpacing: 1.2,
                      color: "var(--ink-faint)",
                      textTransform: "uppercase",
                    }}
                  >
                    {p.from} · {p.place ?? "—"}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ink-mute)",
                    lineHeight: 1.5,
                  }}
                >
                  {firstSnippet(p.blocks)}…
                </div>
                <div
                  className="t-mono"
                  style={{
                    fontSize: 9,
                    letterSpacing: 1.2,
                    color: "var(--ink-faint)",
                    marginTop: 6,
                    textTransform: "uppercase",
                  }}
                >
                  {p.blocks.length} blocks · {p.id}
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: 28, textAlign: "center" }}>
          <Link
            href="/"
            style={{
              fontSize: 12,
              color: "var(--ink-mute)",
              textDecoration: "underline",
              textUnderlineOffset: 4,
            }}
          >
            ← home
          </Link>
        </div>
      </div>
    </main>
  );
}
