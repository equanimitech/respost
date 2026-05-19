// ============================================================
// Respost — Domain Types
// Pure types, no dependencies. If a non-coder can't read this,
// it's wrong.
// ============================================================

import type { Block } from "./blocks";

// --- Branded identifiers ---

export type PostcardId = string & { readonly __brand: "PostcardId" };
export type LabelId = string & { readonly __brand: "LabelId" };
export type Did = string & { readonly __brand: "Did" };
export type RecipientName = string & { readonly __brand: "RecipientName" };
export type SenderName = string & { readonly __brand: "SenderName" };
export type PlaceName = string & { readonly __brand: "PlaceName" };

// --- Location (sender's optional structured place — used by /map) ---

export const GRANULARITY_LEVELS = [
  "establishment",
  "neighborhood",
  "city",
  "region",
  "country",
] as const;

export type Granularity = (typeof GRANULARITY_LEVELS)[number];

export type Location = {
  readonly name: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly granularity: Granularity;
};

// --- Images ---

export type PostcardImage = {
  readonly ref: string; // blob CID from ATProto
  readonly mimeType: string;
  readonly alt?: string;
};

export type BlobRef = {
  readonly ref: { $link: string };
  readonly mimeType: string;
  readonly size: number;
};

// --- Postcard aggregate ---

export type Postcard = {
  readonly id: PostcardId;
  readonly uri: string;
  readonly authorDid: Did;
  readonly to: RecipientName;
  readonly from: SenderName;
  readonly place?: PlaceName;
  readonly senderLocation?: Location;
  readonly title?: string;
  readonly summary?: string;
  readonly cover?: PostcardImage;
  readonly blocks: ReadonlyArray<Block>;
  readonly createdAt: Date;
};

// --- Commands ---

export type CreatePostcardCommand = {
  readonly to: string;
  readonly from: string;
  readonly place?: string;
  readonly senderLocation?: Location;
  readonly title?: string;
  readonly summary?: string;
  readonly cover?: PostcardImage;
  readonly blocks: ReadonlyArray<Block>;
};

// --- Label (used by /map labels feature) ---

export type Label = {
  readonly id: LabelId;
  readonly name: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly radius: number;
  readonly createdAt: Date;
};

export type CreateLabelCommand = {
  readonly name: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly radius?: number;
};

// --- Map view ---

export type PostcardMarker = {
  readonly id: PostcardId;
  readonly latitude: number;
  readonly longitude: number;
  readonly authorDid: Did;
  readonly createdAt: Date;
};

// Re-export block types so consumers only need one import path.
export type {
  Block,
  BlockId,
  BlockType,
  MarkdownBlock,
  PhotoBlock,
  MusicBlock,
  VideoBlock,
  PlaceBlock,
  ArticleBlock,
  PhotoKind,
  MusicService,
  VideoService,
  MusicTone,
} from "./blocks";
export {
  BLOCK_TYPES,
  PHOTO_KINDS,
  REAL_PHOTO_KINDS,
  MUSIC_SERVICES,
  VIDEO_SERVICES,
  MUSIC_TONES,
} from "./blocks";
