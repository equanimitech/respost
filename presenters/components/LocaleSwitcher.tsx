"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { setLocale } from "@/application/actions/setLocale";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/locales";

type Props = {
  align?: "start" | "center" | "end";
};

export function LocaleSwitcher({ align = "center" }: Props) {
  const current = useLocale() as Locale;
  const t = useTranslations("language");
  const [pending, startTransition] = useTransition();

  const onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value;
    if (next === current) return;
    startTransition(async () => {
      await setLocale(next);
    });
  };

  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        justifyContent:
          align === "center" ? "center" : align === "end" ? "flex-end" : "flex-start",
        fontFamily: "var(--font-mono), monospace",
        fontSize: 11,
        color: "var(--ink-mute)",
        letterSpacing: 1.2,
        textTransform: "uppercase",
        opacity: pending ? 0.6 : 1,
      }}
    >
      <span aria-hidden>🌐</span>
      <span className="sr-only">{t("label")}</span>
      <select
        value={current}
        onChange={onChange}
        disabled={pending}
        aria-label={t("label")}
        style={{
          background: "transparent",
          border: "none",
          fontFamily: "inherit",
          fontSize: "inherit",
          color: "var(--ink-soft)",
          padding: "6px 8px",
          borderRadius: 999,
          cursor: pending ? "wait" : "pointer",
        }}
      >
        {LOCALES.map((locale) => (
          <option key={locale} value={locale}>
            {LOCALE_LABELS[locale]}
          </option>
        ))}
      </select>
    </label>
  );
}
