import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/presenters/components/LocaleSwitcher";

export default async function Home() {
  const t = await getTranslations("landing");
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
            <Image
              src="/respost-logo.png"
              alt="Respost"
              width={120}
              height={120}
              priority
              style={{ width: 120, height: 120 }}
            />
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
            {t("tagline")}
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
            {t("body")}
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
              {t("writeCta")}
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
              {t("mapCta")}
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
            {t("footnoteLineOne")}
            <br />
            {t("footnoteLineTwo")}
          </div>

          <div style={{ marginTop: 28 }}>
            <LocaleSwitcher />
          </div>
        </div>
      </div>
    </main>
  );
}
