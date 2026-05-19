"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

type Props = {
  writeBackTo?: string;
};

export function PostcardEnd({ writeBackTo }: Props) {
  const t = useTranslations("viewer");
  const composeHref = writeBackTo
    ? `/compose?to=${encodeURIComponent(writeBackTo)}`
    : "/compose";
  return (
    <div style={{ padding: "36px 22px 28px", textAlign: "center" }}>
      <div
        style={{
          width: 40,
          height: 1,
          background: "var(--paper-edge)",
          margin: "0 auto 18px",
        }}
      />
      <div
        className="t-mono"
        style={{
          fontSize: 11.5,
          letterSpacing: 1.8,
          color: "var(--ink-mute)",
          textTransform: "uppercase",
          lineHeight: 1.6,
        }}
      >
        {t("endLabel")}
      </div>

      <div
        style={{
          marginTop: 22,
          display: "flex",
          gap: 8,
          justifyContent: "center",
        }}
      >
        <Link
          href={composeHref}
          style={{
            padding: "10px 16px",
            borderRadius: 999,
            background: "var(--ink)",
            color: "var(--paper-light)",
            textDecoration: "none",
            fontFamily: "inherit",
            fontSize: 15,
            fontWeight: 500,
          }}
        >
          {t("writeBack")}
        </Link>
      </div>

      <div
        className="t-mono"
        style={{
          marginTop: 22,
          fontSize: 11,
          color: "var(--ink-faint)",
          letterSpacing: 1,
          lineHeight: 1.6,
        }}
      >
        {t("endFootnoteLineOne")}
        <br />
        {t("endFootnoteLineTwo")}
      </div>
    </div>
  );
}
