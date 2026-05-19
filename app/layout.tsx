import type { Metadata, Viewport } from "next";
import { Lora, Caveat } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

const lora = Lora({
  variable: "--font-serif-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const title = t("title");
  const description = t("description");
  const ogDescription = t("ogDescription");
  return {
    title,
    description,
    icons: {
      icon: "/respost-logo.png",
      apple: "/respost-logo.png",
    },
    openGraph: {
      title,
      description: ogDescription,
      images: [{ url: "/respost-logo.png", width: 1024, height: 1024 }],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ede4d2" },
    { media: "(prefers-color-scheme: dark)", color: "#15110c" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} style={{ colorScheme: "light dark" }} suppressHydrationWarning>
      <body
        className={`${lora.variable} ${caveat.variable} antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <NuqsAdapter>{children}</NuqsAdapter>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
