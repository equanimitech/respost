import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import {
  DEFAULT_LOCALE,
  LOCALES,
  isLocale,
  pickLocaleFromAcceptLanguage,
  type Locale,
} from "./locales";

async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const stored = cookieStore.get("NEXT_LOCALE")?.value;
  if (stored && isLocale(stored)) return stored;

  const h = await headers();
  const accept = h.get("accept-language");
  if (accept) {
    const picked = pickLocaleFromAcceptLanguage(accept);
    if (picked) return picked;
  }
  return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  const messages = (await import(`./messages/${locale}.json`)).default;
  return { locale, messages };
});

export { LOCALES, DEFAULT_LOCALE };
