// ============================================================
// Respost — Editor ↔ DraftBlock mapping
// Translates between the ProseMirror document the user edits and
// the DraftBlock[] persisted to URL state / sent to publish.
//
// The editor doc contains:
//   - standard prose nodes (paragraph, list, blockquote, ...)
//   - custom atom nodes: photoBlock, linkCardBlock
//
// Mapping rules:
//   - Consecutive prose nodes → ONE markdown DraftBlock (run length
//     encoded; the boundary between md blocks is a photo or link card).
//   - photoBlock node → DraftPhotoBlock
//   - linkCardBlock node → DraftMusicBlock | Video | Place | Article
//
// This module is the only place where Tiptap node attrs are reshaped
// into DraftBlock types. Presenters consume it; resolveLink and the
// publish use case do not depend on it.
// ============================================================

import type { Node as PMNode, Schema } from "@tiptap/pm/model";
import type { JSONContent } from "@tiptap/react";
import { parseOgHost } from "@/domain/value-objects/blocks";
import type {
  DraftArticleBlock,
  DraftBlock,
  DraftLinkBlock,
  DraftMusicBlock,
  DraftPhotoBlock,
  DraftPlaceBlock,
  DraftVideoBlock,
} from "./draftBlock";
import {
  placeholderArticle,
  placeholderMusic,
  placeholderPlace,
  placeholderVideo,
} from "./draftBlockFactories";

// ─── Node attr shapes ──────────────────────────────────────────

export type PhotoNodeAttrs = {
  id: string | null;
  kind: "uploaded" | "handwriting";
  blobRef: string | null;
  mimeType: string | null;
  blobSize: number | null;
  caption: string | null;
  rot: number | null;
};

export type LinkCardKind = "music" | "video" | "place" | "article";

export type LinkCardAttrs = {
  id: string | null;
  kind: LinkCardKind;
  url: string;
  data: Record<string, unknown>;
};

// ─── Doc → DraftBlock[] ────────────────────────────────────────

type MarkdownSerializerLike = {
  serialize: (node: PMNode) => string;
};

function photoNodeToDraft(node: PMNode): DraftPhotoBlock {
  const a = node.attrs as PhotoNodeAttrs;
  const blob =
    a.blobRef && a.mimeType
      ? {
          ref: { $link: a.blobRef },
          mimeType: a.mimeType,
          size: a.blobSize ?? 0,
        }
      : undefined;
  return {
    type: "photo",
    id: a.id ?? undefined,
    kind: a.kind,
    blob,
    caption: a.caption ?? undefined,
    rot: a.rot ?? undefined,
  };
}

function linkCardNodeToDraft(node: PMNode): DraftLinkBlock {
  const a = node.attrs as LinkCardAttrs;
  const { url, data, kind, id } = a;
  const host = parseOgHost(url) ?? url;
  switch (kind) {
    case "music": {
      const fallback = placeholderMusic(url);
      const block: DraftMusicBlock = {
        type: "music",
        id: id ?? undefined,
        url,
        service: (data.service as DraftMusicBlock["service"]) ?? fallback.service,
        title: (data.title as string) ?? fallback.title,
        artist: data.artist as string | undefined,
        album: data.album as string | undefined,
        dur: data.dur as string | undefined,
        tone: data.tone as DraftMusicBlock["tone"],
      };
      return block;
    }
    case "video": {
      const fallback = placeholderVideo(url, host);
      const block: DraftVideoBlock = {
        type: "video",
        id: id ?? undefined,
        url,
        service: (data.service as DraftVideoBlock["service"]) ?? fallback.service,
        title: (data.title as string) ?? fallback.title,
        channel: (data.channel as string | undefined) ?? fallback.channel,
        dur: data.dur as string | undefined,
        thumbUrl: data.thumbUrl as string | undefined,
      };
      return block;
    }
    case "place": {
      const fallback = placeholderPlace(url, host);
      const block: DraftPlaceBlock = {
        type: "place",
        id: id ?? undefined,
        url,
        name: (data.name as string) ?? fallback.name,
        addr: (data.addr as string | undefined) ?? fallback.addr,
        caption: data.caption as string | undefined,
        latitude: data.latitude as number | undefined,
        longitude: data.longitude as number | undefined,
      };
      return block;
    }
    case "article": {
      const fallback = placeholderArticle(url, host);
      const block: DraftArticleBlock = {
        type: "article",
        id: id ?? undefined,
        url,
        host: (data.host as string) ?? fallback.host,
        title: (data.title as string) ?? fallback.title,
        excerpt: data.excerpt as string | undefined,
        imageUrl: data.imageUrl as string | undefined,
      };
      return block;
    }
  }
}

export function docToDraftBlocks(
  doc: PMNode,
  schema: Schema,
  serializer: MarkdownSerializerLike,
): DraftBlock[] {
  const out: DraftBlock[] = [];
  let mdRun: PMNode[] = [];

  const flushMd = () => {
    if (mdRun.length === 0) return;
    const synthetic = schema.nodes.doc.create(null, mdRun);
    const md = serializer.serialize(synthetic).trim();
    mdRun = [];
    if (md.length === 0) return;
    out.push({ type: "md", md });
  };

  doc.forEach((child) => {
    if (child.type.name === "photoBlock") {
      flushMd();
      out.push(photoNodeToDraft(child));
      return;
    }
    if (child.type.name === "linkCardBlock") {
      flushMd();
      out.push(linkCardNodeToDraft(child));
      return;
    }
    mdRun.push(child);
  });
  flushMd();

  return out;
}

// ─── DraftBlock[] → ProseMirror JSON doc ───────────────────────

type MarkdownParserLike = {
  parse: (md: string) => PMNode;
};

export function photoDraftToNodeJson(b: DraftPhotoBlock): JSONContent {
  const attrs: PhotoNodeAttrs = {
    id: b.id ?? null,
    kind: b.kind,
    blobRef: b.blob?.ref.$link ?? null,
    mimeType: b.blob?.mimeType ?? null,
    blobSize: b.blob?.size ?? null,
    caption: b.caption ?? null,
    rot: b.rot ?? null,
  };
  return { type: "photoBlock", attrs };
}

export function linkCardDraftToNodeJson(b: DraftLinkBlock): JSONContent {
  const attrs: LinkCardAttrs = (() => {
    switch (b.type) {
      case "music":
        return {
          id: b.id ?? null,
          kind: "music",
          url: b.url,
          data: {
            service: b.service,
            title: b.title,
            artist: b.artist,
            album: b.album,
            dur: b.dur,
            tone: b.tone,
          },
        };
      case "video":
        return {
          id: b.id ?? null,
          kind: "video",
          url: b.url,
          data: {
            service: b.service,
            title: b.title,
            channel: b.channel,
            dur: b.dur,
            thumbUrl: b.thumbUrl,
          },
        };
      case "place":
        return {
          id: b.id ?? null,
          kind: "place",
          url: b.url,
          data: {
            name: b.name,
            addr: b.addr,
            caption: b.caption,
            latitude: b.latitude,
            longitude: b.longitude,
          },
        };
      case "article":
        return {
          id: b.id ?? null,
          kind: "article",
          url: b.url,
          data: {
            host: b.host,
            title: b.title,
            excerpt: b.excerpt,
            imageUrl: b.imageUrl,
          },
        };
    }
  })();
  return { type: "linkCardBlock", attrs };
}

export function draftBlocksToDocJson(
  blocks: ReadonlyArray<DraftBlock>,
  parser: MarkdownParserLike,
): JSONContent {
  const content: JSONContent[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case "md": {
        const parsed = parser.parse(b.md);
        const json = parsed.toJSON() as JSONContent;
        const children = (json.content ?? []) as JSONContent[];
        for (const c of children) content.push(c);
        break;
      }
      case "photo":
        content.push(photoDraftToNodeJson(b));
        break;
      case "music":
      case "video":
      case "place":
      case "article":
        content.push(linkCardDraftToNodeJson(b));
        break;
    }
  }
  if (content.length === 0) {
    content.push({ type: "paragraph" });
  }
  return { type: "doc", content };
}
