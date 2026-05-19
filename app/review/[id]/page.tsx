import Link from "next/link";
import { notFound } from "next/navigation";
import { fakePostcardById, fakePostcards } from "@/application/fixtures/fakeData";
import { ArrivalExperience } from "@/presenters/components/postcard-design/arrival/ArrivalExperience";
import type { Postcard, PostcardId } from "@/domain/types";

type Props = {
  params: Promise<{ id: string }>;
};

function buildImageMap(postcard: Postcard): Record<string, string> {
  const map: Record<string, string> = {};
  for (const b of postcard.blocks) {
    if (b.type === "photo" && b.image?.ref) {
      // Fixtures store the public URL directly in `image.ref` so the
      // identity mapping is the right resolver here.
      map[b.image.ref] = b.image.ref;
    }
  }
  return map;
}

export function generateStaticParams() {
  return fakePostcards.map((p) => ({ id: p.id }));
}

export default async function ReviewPostcardPage({ params }: Props) {
  const { id } = await params;
  const postcard = fakePostcardById.get(id as PostcardId);
  if (!postcard) notFound();

  const imageMap = buildImageMap(postcard);

  return (
    <main className="phone-shell">
      <div className="phone-frame">
        <ArrivalExperience postcard={postcard} imageMap={imageMap} />
      </div>
      <div
        style={{
          position: "fixed",
          left: 12,
          top: 12,
          zIndex: 50,
        }}
      >
        <Link
          href="/review"
          className="t-mono"
          style={{
            display: "inline-block",
            padding: "6px 10px",
            borderRadius: 999,
            background: "rgba(255,255,255,.85)",
            border: "1px solid var(--paper-edge)",
            fontSize: 9,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: "var(--ink-mute)",
            textDecoration: "none",
            backdropFilter: "blur(6px)",
          }}
        >
          ← all
        </Link>
      </div>
    </main>
  );
}
