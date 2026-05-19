import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getPostcardMarkers } from "@/application/queries/getPostcards";
import { fakePostcards } from "@/application/fixtures/fakeData";
import { PostcardMap } from "@/presenters/components/Map/PostcardMap";
import type { PostcardMarker } from "@/domain/types";

export const dynamic = "force-dynamic";

type MapPageProps = {
  searchParams: Promise<{ fake?: string }>;
};

function fakeMarkers(): PostcardMarker[] {
  const markers: PostcardMarker[] = [];
  for (const p of fakePostcards) {
    const loc = p.senderLocation;
    if (!loc || loc.latitude === undefined || loc.longitude === undefined) {
      continue;
    }
    markers.push({
      id: p.id,
      latitude: loc.latitude,
      longitude: loc.longitude,
      authorDid: p.authorDid,
      createdAt: p.createdAt,
      title: p.title,
      brief: p.brief,
      place: p.place,
    });
  }
  return markers;
}

export default async function MapPage({ searchParams }: MapPageProps) {
  const { fake } = await searchParams;
  const t = await getTranslations("map");
  const isFake = fake === "1" || fake === "true";

  let markers: PostcardMarker[] = [];
  if (isFake) {
    markers = fakeMarkers();
  } else {
    try {
      markers = await getPostcardMarkers();
    } catch {
      // ATProto not configured yet — show empty map
    }
  }

  const hrefBase = isFake ? "/review" : "/p";

  return (
    <main className="h-screen w-screen relative">
      <PostcardMap markers={markers} hrefBase={hrefBase} />
      <Link
        href="/"
        className="focus-visible:ring-2 focus-visible:ring-[var(--inkblue)] focus-visible:outline-none"
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          padding: "8px 14px",
          background: "rgba(246, 241, 231, 0.72)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          color: "var(--ink)",
          textDecoration: "none",
          borderRadius: 999,
          fontSize: 13,
          fontFamily: "var(--font-mono)",
          letterSpacing: 1,
          textTransform: "uppercase",
          boxShadow: "var(--sh-card)",
          border: "1px solid rgba(60, 40, 20, 0.08)",
        }}
      >
        {t("home")}
      </Link>
      {isFake && (
        <div
          className="t-mono"
          style={{
            position: "absolute",
            bottom: 14,
            left: 14,
            padding: "6px 12px",
            background: "rgba(246, 241, 231, 0.72)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            color: "var(--ink-mute)",
            borderRadius: 999,
            fontSize: 9,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            boxShadow: "var(--sh-card)",
            border: "1px solid rgba(60, 40, 20, 0.08)",
          }}
        >
          {t("localFakeCount", { count: markers.length })}
        </div>
      )}
    </main>
  );
}
