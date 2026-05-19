import {
  listPostcardRecords,
  getPostcardRecord,
  getAuthorDid,
  type PostcardRecord,
  type BlockRecord,
} from "@/infrastructure/atproto/client";
import type {
  Block,
  BlockId,
  Did,
  Granularity,
  Location,
  MusicService,
  MusicTone,
  PhotoKind,
  Postcard,
  PostcardId,
  PostcardMarker,
  RecipientName,
  SenderName,
  PlaceName,
  VideoService,
} from "@/domain/types";
import {
  MUSIC_SERVICES,
  MUSIC_TONES,
  REAL_PHOTO_KINDS,
  VIDEO_SERVICES,
} from "@/domain/types";

function parseAtUri(uri: string): {
  did: string;
  collection: string;
  rkey: string;
} {
  const parts = uri.replace("at://", "").split("/");
  return { did: parts[0], collection: parts[1], rkey: parts[2] };
}

function toLocation(field: NonNullable<PostcardRecord["senderLocation"]>): Location {
  return {
    name: field.name,
    latitude: field.latitude,
    longitude: field.longitude,
    granularity: field.granularity as Granularity,
  };
}

function toBlock(b: BlockRecord): Block {
  const id = b.id as BlockId;
  switch (b.type) {
    case "md":
      return { type: "md", id, md: b.md };
    case "photo": {
      const kind: PhotoKind = REAL_PHOTO_KINDS.includes(
        b.kind as (typeof REAL_PHOTO_KINDS)[number]
      )
        ? b.kind
        : "uploaded";
      return {
        type: "photo",
        id,
        kind,
        image: b.image
          ? { ref: b.image.ref.$link, mimeType: b.image.mimeType }
          : undefined,
        caption: b.caption,
        rot: b.rot,
      };
    }
    case "music": {
      const service: MusicService = (MUSIC_SERVICES as ReadonlyArray<string>).includes(
        b.service
      )
        ? (b.service as MusicService)
        : "spotify";
      const tone =
        b.tone && (MUSIC_TONES as ReadonlyArray<string>).includes(b.tone)
          ? (b.tone as MusicTone)
          : undefined;
      return {
        type: "music",
        id,
        url: b.url,
        service,
        title: b.title,
        artist: b.artist,
        album: b.album,
        dur: b.dur,
        tone,
      };
    }
    case "video": {
      const service: VideoService = (VIDEO_SERVICES as ReadonlyArray<string>).includes(
        b.service
      )
        ? (b.service as VideoService)
        : "youtube";
      return {
        type: "video",
        id,
        url: b.url,
        service,
        title: b.title,
        channel: b.channel,
        dur: b.dur,
        thumbUrl: b.thumbUrl,
      };
    }
    case "place":
      return {
        type: "place",
        id,
        url: b.url,
        name: b.name,
        addr: b.addr,
        caption: b.caption,
        latitude: b.latitude,
        longitude: b.longitude,
      };
    case "article":
      return {
        type: "article",
        id,
        url: b.url,
        host: b.host,
        title: b.title,
        excerpt: b.excerpt,
        imageUrl: b.imageUrl,
      };
  }
}

function toDomain(uri: string, record: PostcardRecord): Postcard {
  const { did, rkey } = parseAtUri(uri);
  const blocks: Block[] = [];
  for (const b of record.blocks) blocks.push(toBlock(b));
  return {
    id: rkey as PostcardId,
    uri,
    authorDid: did as Did,
    to: record.to as RecipientName,
    from: record.from as SenderName,
    place: record.place ? (record.place as PlaceName) : undefined,
    senderLocation: record.senderLocation
      ? toLocation(record.senderLocation)
      : undefined,
    title: record.title,
    summary: record.summary,
    cover: record.cover
      ? { ref: record.cover.ref.$link, mimeType: record.cover.mimeType }
      : undefined,
    blocks,
    createdAt: new Date(record.createdAt),
  };
}

/**
 * All postcards from the authenticated sender.
 */
export async function getMyPostcards(): Promise<Postcard[]> {
  const did = await getAuthorDid();
  const { records } = await listPostcardRecords(did);

  const result: Postcard[] = [];
  for (const r of records) {
    try {
      result.push(toDomain(r.uri, r.value));
    } catch {
      // skip malformed records (e.g. pre-pivot legacy shape)
    }
  }
  return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Single postcard by rkey.
 */
export async function getPostcardByKey(
  rkey: string
): Promise<Postcard | null> {
  const did = await getAuthorDid();
  const result = await getPostcardRecord(did, rkey);
  if (!result) return null;
  try {
    return toDomain(result.uri, result.value);
  } catch {
    return null;
  }
}

/**
 * Markers for the /map route. Pulls coordinates from each postcard's
 * sender location; postcards without coordinates are skipped.
 */
export async function getPostcardMarkers(): Promise<PostcardMarker[]> {
  const postcards = await getMyPostcards();
  const markers: PostcardMarker[] = [];
  for (const p of postcards) {
    const loc = p.senderLocation;
    if (!loc || loc.latitude === undefined || loc.longitude === undefined) continue;
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
