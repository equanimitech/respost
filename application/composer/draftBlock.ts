// ============================================================
// Respost — Composer draft block types
// "Draft" = what the composer holds and sends to the server.
// Ids may be missing, rotations may not be frozen. Blob refs are
// already uploaded (composer uploads photos via uploadImageBlob
// before publish). The publish action hydrates drafts into domain
// blocks, assigning ids and freezing rotations.
// ============================================================

import type {
  MusicService,
  MusicTone,
  VideoService,
} from "@/domain/types";

export type DraftBlobRef = {
  ref: { $link: string };
  mimeType: string;
  size: number;
};

export type DraftMarkdownBlock = { type: "md"; id?: string; md: string };

export type DraftPhotoBlock = {
  type: "photo";
  id?: string;
  kind: "uploaded" | "handwriting";
  blob?: DraftBlobRef;
  caption?: string;
  rot?: number;
};

export type DraftMusicBlock = {
  type: "music";
  id?: string;
  url: string;
  service: MusicService;
  title: string;
  artist?: string;
  album?: string;
  dur?: string;
  tone?: MusicTone;
};

export type DraftVideoBlock = {
  type: "video";
  id?: string;
  url: string;
  service: VideoService;
  title: string;
  channel?: string;
  dur?: string;
  thumbUrl?: string;
};

export type DraftPlaceBlock = {
  type: "place";
  id?: string;
  url: string;
  name: string;
  addr?: string;
  caption?: string;
  latitude?: number;
  longitude?: number;
};

export type DraftArticleBlock = {
  type: "article";
  id?: string;
  url: string;
  host: string;
  title: string;
  excerpt?: string;
  imageUrl?: string;
};

export type DraftBlock =
  | DraftMarkdownBlock
  | DraftPhotoBlock
  | DraftMusicBlock
  | DraftVideoBlock
  | DraftPlaceBlock
  | DraftArticleBlock;

export type DraftLinkBlock =
  | DraftMusicBlock
  | DraftVideoBlock
  | DraftPlaceBlock
  | DraftArticleBlock;

export function isDraftLinkBlock(b: DraftBlock): b is DraftLinkBlock {
  return (
    b.type === "music" ||
    b.type === "video" ||
    b.type === "place" ||
    b.type === "article"
  );
}
