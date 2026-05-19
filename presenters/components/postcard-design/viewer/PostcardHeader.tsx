import type { Postcard } from "@/domain/types";
import { useLocale, useTranslations } from "next-intl";
import { Postmark } from "../primitives/Postmark";

type Props = { postcard: Postcard };

function senderInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed[0].toUpperCase() : "·";
}

function postmarkPlace(place: string | undefined): string {
  if (!place) return "MAIL";
  const upper = place.toUpperCase();
  return upper.length <= 5 ? upper : upper.slice(0, 3);
}

const ROMAN_MONTHS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"] as const;

function formatDate(d: Date): string {
  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear() % 100;
  return `${day}·${ROMAN_MONTHS[month]}·${year}`;
}

function relativeTime(d: Date, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const diffMs = d.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(diffSec, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 2_592_000) return rtf.format(Math.round(diffSec / 86400), "day");
  if (abs < 31_536_000) return rtf.format(Math.round(diffSec / 2_592_000), "month");
  return rtf.format(Math.round(diffSec / 31_536_000), "year");
}

export function PostcardHeader({ postcard }: Props) {
  const t = useTranslations("viewer");
  const locale = useLocale();
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
          {relativeTime(postcard.createdAt, locale)}
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
