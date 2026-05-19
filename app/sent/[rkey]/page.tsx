import { getTranslations } from "next-intl/server";
import { ComposerSent } from "@/presenters/components/postcard-design/composer/ComposerSent";

type Props = {
  params: Promise<{ rkey: string }>;
  searchParams: Promise<{ url?: string; to?: string }>;
};

function fallbackOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_ORIGIN ??
    process.env.SITE_ORIGIN ??
    "https://respost.equanimi.tech"
  );
}

export default async function SentPage({ params, searchParams }: Props) {
  const { rkey } = await params;
  const sp = await searchParams;
  const t = await getTranslations("sent");
  const url = sp.url ?? `${fallbackOrigin()}/p/${rkey}`;
  const to = sp.to ?? t("fallbackRecipient");

  return (
    <main className="phone-shell">
      <div className="phone-frame">
        <ComposerSent to={to} shareUrl={url} />
      </div>
    </main>
  );
}
