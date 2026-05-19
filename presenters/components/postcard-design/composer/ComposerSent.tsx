"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Postmark } from "../primitives/Postmark";

type Props = {
  to: string;
  shareUrl: string;
};

export function ComposerSent({ to, shareUrl }: Props) {
  const t = useTranslations("sent");
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const sendViaWhatsApp = async () => {
    const text = t("shareText", { to, url: shareUrl });
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ url: shareUrl, text });
        return;
      } catch {
        /* fall through */
      }
    }
    window.location.href = `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="app paper-grain">
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px 8px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <Postmark place={t("postmark")} date="" size={110} rot={-8} tone="var(--terra-deep)" />
        </div>

        <div
          className="t-serif"
          style={{
            fontSize: 26,
            fontWeight: 500,
            lineHeight: 1.2,
            textAlign: "center",
          }}
        >
          {t("headline")}
        </div>
        <div
          style={{
            fontSize: 14,
            color: "var(--ink-mute)",
            marginTop: 10,
            lineHeight: 1.5,
            textAlign: "center",
            maxWidth: 280,
          }}
        >
          {t("body", { to })}
        </div>

        <button
          type="button"
          onClick={copyLink}
          style={{
            marginTop: 26,
            padding: "12px 14px",
            background: "var(--paper-light)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "var(--sh-soft)",
            border: "1px solid var(--paper-edge)",
            cursor: "pointer",
            fontFamily: "inherit",
            maxWidth: "100%",
          }}
        >
          <span
            className="t-mono"
            style={{
              fontSize: 11,
              color: "var(--ink-soft)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 220,
            }}
          >
            {shareUrl}
          </span>
          <span
            style={{
              fontSize: 9.5,
              color: copied ? "var(--olive)" : "var(--ink-mute)",
              fontFamily: "var(--font-mono), monospace",
              letterSpacing: 1.2,
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            {copied ? t("copied") : t("copy")}
          </span>
        </button>

        <Link
          href="/"
          style={{
            marginTop: 18,
            fontSize: 12,
            color: "var(--ink-mute)",
            textDecoration: "underline",
            textUnderlineOffset: 4,
          }}
        >
          {t("writeAnother")}
        </Link>

        <div
          className="t-mono"
          style={{
            marginTop: 30,
            fontSize: 9,
            color: "var(--ink-faint)",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            textAlign: "center",
            lineHeight: 1.7,
          }}
        >
          {t("footnoteLineOne")}
          <br />
          {t("footnoteLineTwo")}
        </div>
      </div>

      {/* Footer with primary action */}
      <div
        style={{
          padding: "14px 22px calc(22px + env(safe-area-inset-bottom))",
          background: "var(--paper)",
          borderTop: "1px solid var(--divider)",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={sendViaWhatsApp}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 999,
            background: "#25d366",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 15,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: "0 4px 16px rgba(37,211,102,.32)",
          }}
        >
          {t("whatsappCta", { to })}
        </button>
      </div>
    </div>
  );
}
