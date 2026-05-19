"use client";

import type { Postcard } from "@/domain/types";
import { formatDistanceToNowStrict, type Locale as DateLocale } from "date-fns";
import { enUS, ptBR, es, fr } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import type { Locale as AppLocale } from "@/i18n/locales";
import { Postmark } from "../primitives/Postmark";

type Props = { postcard: Postcard };

const DATE_LOCALES: Record<AppLocale, DateLocale> = {
  en: enUS,
  pt: ptBR,
  es,
  fr,
};

function senderInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed[0].toUpperCase() : "·";
}

function postmarkPlace(place: string | undefined): string {
  if (!place) return "MAIL";
  const upper = place.toUpperCase();
  return upper.length <= 5 ? upper : upper.slice(0, 3);
}

function formatDate(d: Date): string {
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear() % 100;
  const romanMonth = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][month - 1];
  return `${day}·${romanMonth}·${year}`;
}

export function PostcardHeader({ postcard }: Props) {
  const t = useTranslations("viewer");
  const locale = useLocale() as AppLocale;
  const dateLocale = DATE_LOCALES[locale] ?? enUS;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "20px 24px 8px",
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: "var(--terra)",
          color: "var(--paper-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-serif-display), serif",
          fontWeight: 500,
          fontSize: 15,
        }}
      >
        {senderInitial(postcard.from)}
      </div>
      <div style={{ flex: 1 }}>
        <div
          className="t-serif"
          style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.1 }}
        >
          {t("from", { sender: postcard.from })}
        </div>
        <div
          className="t-mono"
          style={{
            fontSize: 11,
            letterSpacing: 1.2,
            color: "var(--ink-mute)",
            textTransform: "uppercase",
            marginTop: 3,
          }}
        >
          {postcard.place ? t("sentFromPlace", { place: postcard.place }) : ""}
          {formatDistanceToNowStrict(postcard.createdAt, {
            addSuffix: true,
            locale: dateLocale,
          })}
        </div>
      </div>
      <Postmark
        place={postmarkPlace(postcard.place)}
        date={formatDate(postcard.createdAt)}
        size={54}
        rot={-6}
      />
    </div>
  );
}
