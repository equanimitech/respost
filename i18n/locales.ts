export const LOCALES = ["en", "pt", "es", "fr"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  pt: "Português",
  es: "Español",
  fr: "Français",
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function pickLocaleFromAcceptLanguage(header: string): Locale | null {
  const tags = header
    .split(",")
    .map((s) => s.split(";")[0].trim().toLowerCase().slice(0, 2));
  for (const tag of tags) {
    if (isLocale(tag)) return tag;
  }
  return null;
}
