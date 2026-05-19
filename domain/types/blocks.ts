// ============================================================
// Respost — Block types
// A postcard is an ordered list of typed blocks. Each block is
// immutable; mutation = replacement.
// ============================================================

import type { PostcardImage } from "./index";

export type BlockId = string & { readonly __brand: "BlockId" };

export const BLOCK_TYPES = [
  "md",
  "photo",
  "music",
  "video",
  "place",
  "article",
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

// "uploaded" / "handwriting" carry a real image blob.
// The remaining values are demo-only gradient placeholders.
export const PHOTO_KINDS = [
  "uploaded",
  "handwriting",
  "cafe",
  "beach",
  "street",
  "river",
  "window",
] as const;
export type PhotoKind = (typeof PHOTO_KINDS)[number];

export const REAL_PHOTO_KINDS = ["uploaded", "handwriting"] as const;
export type RealPhotoKind = (typeof REAL_PHOTO_KINDS)[number];

export const MUSIC_SERVICES = [
  "spotify",
  "youtube",
  "apple",
  "soundcloud",
  "bandcamp",
] as const;
export type MusicService = (typeof MUSIC_SERVICES)[number];

export const VIDEO_SERVICES = ["youtube"] as const;
export type VideoService = (typeof VIDEO_SERVICES)[number];

export const MUSIC_TONES = ["a", "b", "c", "d"] as const;
export type MusicTone = (typeof MUSIC_TONES)[number];

export type MarkdownBlock = {
  readonly type: "md";
  readonly id: BlockId;
  readonly md: string;
};

export type PhotoBlock = {
  readonly type: "photo";
  readonly id: BlockId;
  readonly kind: PhotoKind;
  readonly image?: PostcardImage;
  readonly caption?: string;
  readonly rot?: number;
};

export type MusicBlock = {
  readonly type: "music";
  readonly id: BlockId;
  readonly url: string;
  readonly service: MusicService;
  readonly title: string;
  readonly artist?: string;
  readonly album?: string;
  readonly dur?: string;
  readonly tone?: MusicTone;
};

export type VideoBlock = {
  readonly type: "video";
  readonly id: BlockId;
  readonly url: string;
  readonly service: VideoService;
  readonly title: string;
  readonly channel?: string;
  readonly dur?: string;
  readonly thumbUrl?: string;
  readonly thumbKind?: PhotoKind;
};

export type PlaceBlock = {
  readonly type: "place";
  readonly id: BlockId;
  readonly url: string;
  readonly name: string;
  readonly addr?: string;
  readonly caption?: string;
  readonly latitude?: number;
  readonly longitude?: number;
};

export type ArticleBlock = {
  readonly type: "article";
  readonly id: BlockId;
  readonly url: string;
  readonly host: string;
  readonly title: string;
  readonly excerpt?: string;
  readonly imageUrl?: string;
  readonly imageKind?: PhotoKind;
};

export type Block =
  | MarkdownBlock
  | PhotoBlock
  | MusicBlock
  | VideoBlock
  | PlaceBlock
  | ArticleBlock;
