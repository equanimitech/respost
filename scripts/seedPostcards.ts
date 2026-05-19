// ============================================================
// Seed fake postcards onto the configured ATProto account.
//
// Usage: pnpm seed                              # all postcards
//        pnpm seed -- --only=3kpc7terrace       # one rkey
//        pnpm seed -- --dry                     # no writes
//
// Notes:
//   - Writes records under the single ATProto account in .env.
//     `authorDid` will collapse to that account; `from` / `to` /
//     `place` still differ per card.
//   - Photo + handwriting blocks fetch their external URL and
//     upload as a blob, then swap `image.ref` from URL → CID.
//   - bsky.social enforces ~1MB blob cap. Unsplash w=1200 is
//     usually fine; downsized to w=1100 here as a margin.
// ============================================================

import {
  createPostcardRecord,
  uploadImage,
  type BlockRecord,
  type PostcardRecord,
} from "@/infrastructure/atproto/client";
import { fakePostcards } from "@/application/fixtures/fakeData";
import type { Block, Postcard } from "@/domain/types";

const args = new Set(process.argv.slice(2));
const dry = args.has("--dry");
const onlyArg = [...args].find((a) => a.startsWith("--only="));
const only = onlyArg?.slice("--only=".length);

const MAX_W = 1100;

function shrinkUrl(url: string): string {
  return url.replace(/([?&])w=\d+/, `$1w=${MAX_W}`);
}

async function fetchBytes(url: string): Promise<{
  bytes: Uint8Array;
  mimeType: string;
}> {
  const res = await fetch(shrinkUrl(url), {
    headers: { "User-Agent": "Respost-Seed/0.1" },
  });
  if (!res.ok) {
    throw new Error(`fetch ${url} → ${res.status}`);
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  const mime = res.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
  return { bytes: buf, mimeType: mime };
}

async function materializeBlock(b: Block): Promise<BlockRecord> {
  if (b.type === "photo") {
    if (!b.image) {
      return {
        type: "photo",
        id: b.id,
        kind: b.kind === "handwriting" ? "handwriting" : "uploaded",
        caption: b.caption,
        rot: b.rot,
      };
    }
    const url = b.image.ref;
    if (dry) {
      console.log(`  · [dry] would upload ${url}`);
      return {
        type: "photo",
        id: b.id,
        kind: b.kind === "handwriting" ? "handwriting" : "uploaded",
        caption: b.caption,
        rot: b.rot,
      };
    }
    const { bytes, mimeType } = await fetchBytes(url);
    const blob = await uploadImage(bytes, mimeType);
    console.log(`  · uploaded ${bytes.byteLength}B ${mimeType} → ${blob.ref.$link}`);
    return {
      type: "photo",
      id: b.id,
      kind: b.kind === "handwriting" ? "handwriting" : "uploaded",
      image: { $type: "blob", ...blob },
      caption: b.caption,
      rot: b.rot,
    };
  }
  if (b.type === "md") return { type: "md", id: b.id, md: b.md };
  if (b.type === "music") {
    return {
      type: "music",
      id: b.id,
      url: b.url,
      service: b.service,
      title: b.title,
      artist: b.artist,
      album: b.album,
      dur: b.dur,
      tone: b.tone,
    };
  }
  if (b.type === "video") {
    return {
      type: "video",
      id: b.id,
      url: b.url,
      service: "youtube",
      title: b.title,
      channel: b.channel,
      dur: b.dur,
      thumbUrl: b.thumbUrl,
    };
  }
  if (b.type === "place") {
    return {
      type: "place",
      id: b.id,
      url: b.url,
      name: b.name,
      addr: b.addr,
      caption: b.caption,
      latitude: b.latitude,
      longitude: b.longitude,
    };
  }
  return {
    type: "article",
    id: b.id,
    url: b.url,
    host: b.host,
    title: b.title,
    excerpt: b.excerpt,
    imageUrl: b.imageUrl,
  };
}

async function seedOne(p: Postcard): Promise<void> {
  console.log(`\n→ ${p.id}  to:${p.to}  from:${p.from}  place:${p.place ?? "—"}`);
  const blocks: BlockRecord[] = [];
  for (const b of p.blocks) blocks.push(await materializeBlock(b));

  const record: Omit<PostcardRecord, "$type"> = {
    to: p.to,
    from: p.from,
    place: p.place,
    senderLocation: p.senderLocation
      ? {
          name: p.senderLocation.name,
          latitude: p.senderLocation.latitude,
          longitude: p.senderLocation.longitude,
          granularity: p.senderLocation.granularity,
        }
      : undefined,
    blocks,
    createdAt: p.createdAt.toISOString(),
  };

  if (dry) {
    console.log(`  · [dry] would createRecord (${blocks.length} blocks)`);
    return;
  }
  const { uri } = await createPostcardRecord(record);
  const rkey = uri.split("/").pop();
  console.log(`  ✓ ${uri}`);
  console.log(`    /sent/${rkey}`);
}

async function main() {
  const cards = only
    ? fakePostcards.filter((p) => p.id === only)
    : fakePostcards;
  if (!cards.length) {
    console.error(`no postcards matched ${only ? `--only=${only}` : ""}`);
    process.exit(1);
  }
  console.log(`Seeding ${cards.length} postcard(s)${dry ? " (dry run)" : ""}…`);
  for (const p of cards) await seedOne(p);
  console.log(`\nDone.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
