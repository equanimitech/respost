import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPostcardByKey } from "@/application/queries/getPostcards";
import { blobImageUrl } from "@/infrastructure/atproto/client";
import { ArrivalExperience } from "@/presenters/components/postcard-design/arrival/ArrivalExperience";
import type { Postcard } from "@/domain/types";

type Props = {
  params: Promise<{ rkey: string }>;
};

function firstPhotoRef(postcard: Postcard): string | null {
  for (const b of postcard.blocks) {
    if (b.type === "photo" && b.image?.ref) return b.image.ref;
  }
  return null;
}

function buildImageMap(postcard: Postcard): Record<string, string> {
  const map: Record<string, string> = {};
  for (const b of postcard.blocks) {
    if (b.type === "photo" && b.image?.ref) {
      map[b.image.ref] = blobImageUrl(postcard.authorDid, b.image.ref);
    }
  }
  return map;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { rkey } = await params;
  const t = await getTranslations("meta");
  const postcard = await getPostcardByKey(rkey).catch(() => null);

  if (!postcard) {
    return { title: t("notFound") };
  }

  const title = postcard.title ?? t("postcardFor", { to: postcard.to });
  const description =
    postcard.summary ??
    (postcard.place
      ? t("sentFromPlace", { from: postcard.from, place: postcard.place })
      : t("sentNoPlace", { from: postcard.from }));

  const coverRef = postcard.cover?.ref ?? firstPhotoRef(postcard);
  const ogImage = coverRef
    ? [{ url: blobImageUrl(postcard.authorDid, coverRef) }]
    : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: ogImage,
    },
  };
}

export default async function PostcardPage({ params }: Props) {
  const { rkey } = await params;

  let postcard;
  try {
    postcard = await getPostcardByKey(rkey);
  } catch {
    notFound();
  }

  if (!postcard) {
    notFound();
  }

  const imageMap = buildImageMap(postcard);

  return (
    <main className="phone-shell">
      <div className="phone-frame">
        <ArrivalExperience postcard={postcard} imageMap={imageMap} />
      </div>
    </main>
  );
}
