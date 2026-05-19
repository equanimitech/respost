"use server";

import { createLocation } from "@/domain/value-objects/location";
import { validatePostcard } from "@/domain/value-objects/postcard";
import {
  createBlockId,
  freezePhotoRotation,
} from "@/domain/value-objects/blocks";
import type {
  Block,
  BlockId,
  CreatePostcardCommand,
  Location,
  PhotoKind,
} from "@/domain/types";
import {
  createPostcardRecord,
  type BlockRecord,
} from "@/infrastructure/atproto/client";
import { revalidatePath } from "next/cache";

// Draft block types live in application/composer/draftBlock.ts. Re-exported
// here for back-compat; new imports should target the new location.
export type {
  DraftArticleBlock,
  DraftBlobRef,
  DraftBlock,
  DraftLinkBlock,
  DraftMarkdownBlock,
  DraftMusicBlock,
  DraftPhotoBlock,
  DraftPlaceBlock,
  DraftVideoBlock,
} from "@/application/composer/draftBlock";
import type {
  DraftBlobRef,
  DraftBlock,
  DraftPhotoBlock,
} from "@/application/composer/draftBlock";

type SenderLocationInput = {
  name: string;
  latitude?: number;
  longitude?: number;
  granularity: string;
};

export type PublishInput = {
  to: string;
  from: string;
  place?: string;
  senderLocation?: SenderLocationInput;
  title?: string;
  brief?: string;
  summary?: string;
  cover?: DraftBlobRef;
  blocks: ReadonlyArray<DraftBlock>;
};

export type PublishResult =
  | { success: true; uri: string; rkey: string; url: string }
  | { success: false; error: string };

// ─── Hydration: Draft → Domain block ─────────────────────────

function hydrateBlock(draft: DraftBlock): Block {
  const id = (draft.id ?? createBlockId()) as BlockId;
  switch (draft.type) {
    case "md":
      return { type: "md", id, md: draft.md };
    case "photo": {
      const kind: PhotoKind = draft.kind;
      const rot = draft.rot ?? freezePhotoRotation(id);
      return {
        type: "photo",
        id,
        kind,
        image: draft.blob
          ? { ref: draft.blob.ref.$link, mimeType: draft.blob.mimeType }
          : undefined,
        caption: draft.caption,
        rot,
      };
    }
    case "music":
      return {
        type: "music",
        id,
        url: draft.url,
        service: draft.service,
        title: draft.title,
        artist: draft.artist,
        album: draft.album,
        dur: draft.dur,
        tone: draft.tone,
      };
    case "video":
      return {
        type: "video",
        id,
        url: draft.url,
        service: draft.service,
        title: draft.title,
        channel: draft.channel,
        dur: draft.dur,
        thumbUrl: draft.thumbUrl,
      };
    case "place":
      return {
        type: "place",
        id,
        url: draft.url,
        name: draft.name,
        addr: draft.addr,
        caption: draft.caption,
        latitude: draft.latitude,
        longitude: draft.longitude,
      };
    case "article":
      return {
        type: "article",
        id,
        url: draft.url,
        host: draft.host,
        title: draft.title,
        excerpt: draft.excerpt,
        imageUrl: draft.imageUrl,
      };
  }
}

// ─── Domain block → PDS record block ─────────────────────────

function toRecordBlock(b: Block, draft: DraftBlock): BlockRecord {
  switch (b.type) {
    case "md":
      return { type: "md", id: b.id, md: b.md };
    case "photo": {
      const d = draft as DraftPhotoBlock;
      const image = d.blob
        ? {
            $type: "blob" as const,
            ref: d.blob.ref,
            mimeType: d.blob.mimeType,
            size: d.blob.size,
          }
        : undefined;
      return {
        type: "photo",
        id: b.id,
        kind: b.kind === "handwriting" ? "handwriting" : "uploaded",
        image,
        caption: b.caption,
        rot: b.rot,
      };
    }
    case "music":
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
    case "video":
      return {
        type: "video",
        id: b.id,
        url: b.url,
        service: b.service,
        title: b.title,
        channel: b.channel,
        dur: b.dur,
        thumbUrl: b.thumbUrl,
      };
    case "place":
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
    case "article":
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
}

function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_ORIGIN ??
    process.env.SITE_ORIGIN ??
    "https://respost.equanimi.tech"
  );
}

export async function publishPostcard(
  input: PublishInput
): Promise<PublishResult> {
  try {
    // 1. Hydrate drafts → domain blocks (assign ids, freeze rotations)
    const hydrated: Block[] = [];
    for (const d of input.blocks) hydrated.push(hydrateBlock(d));

    // 2. Build sender location if present
    let senderLocation: Location | undefined;
    if (input.senderLocation) {
      senderLocation = createLocation(input.senderLocation);
    }

    // 3. Validate the whole postcard
    const command: CreatePostcardCommand = {
      to: input.to.trim(),
      from: input.from.trim(),
      place: input.place?.trim(),
      senderLocation,
      title: input.title?.trim() || undefined,
      brief: input.brief?.trim() || undefined,
      summary: input.summary?.trim() || undefined,
      cover: input.cover
        ? { ref: input.cover.ref.$link, mimeType: input.cover.mimeType }
        : undefined,
      blocks: hydrated,
    };

    const validation = validatePostcard(command);
    if (validation.valid === false) {
      return { success: false, error: validation.error };
    }

    // 4. Map domain blocks → record blocks (pulling blob refs from drafts)
    const recordBlocks: BlockRecord[] = [];
    for (let i = 0; i < hydrated.length; i++) {
      recordBlocks.push(toRecordBlock(hydrated[i], input.blocks[i]));
    }

    // 5. Persist
    const record = await createPostcardRecord({
      to: command.to,
      from: command.from,
      place: command.place,
      senderLocation: senderLocation
        ? {
            name: senderLocation.name,
            latitude: senderLocation.latitude,
            longitude: senderLocation.longitude,
            granularity: senderLocation.granularity,
          }
        : undefined,
      title: command.title,
      brief: command.brief,
      summary: command.summary,
      cover: input.cover
        ? {
            $type: "blob",
            ref: input.cover.ref,
            mimeType: input.cover.mimeType,
            size: input.cover.size,
          }
        : undefined,
      blocks: recordBlocks,
      createdAt: new Date().toISOString(),
    });

    const rkey = record.uri.replace("at://", "").split("/")[2];
    const url = `${siteOrigin()}/p/${rkey}`;

    revalidatePath("/map");
    return { success: true, uri: record.uri, rkey, url };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publish failed";
    return { success: false, error: message };
  }
}
