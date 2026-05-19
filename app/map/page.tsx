import Link from "next/link";
import { getPostcardMarkers } from "@/application/queries/getPostcards";
import { PostcardMap } from "@/presenters/components/Map/PostcardMap";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  let markers: Awaited<ReturnType<typeof getPostcardMarkers>> = [];

  try {
    markers = await getPostcardMarkers();
  } catch {
    // ATProto not configured yet — show empty map
  }

  return (
    <main className="h-screen w-screen relative">
      <PostcardMap markers={markers} />
      <Link
        href="/"
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          padding: "8px 14px",
          background: "var(--paper)",
          color: "var(--ink)",
          textDecoration: "none",
          borderRadius: 999,
          fontSize: 13,
          fontFamily: "var(--font-mono), monospace",
          letterSpacing: 1,
          textTransform: "uppercase",
          boxShadow: "var(--sh-card)",
        }}
      >
        ← home
      </Link>
    </main>
  );
}
