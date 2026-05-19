import { z } from "zod";
import type { DraftBlock } from "@/application/actions/publishPostcard";
import {
  MUSIC_SERVICES,
  MUSIC_TONES,
  VIDEO_SERVICES,
} from "@/domain/types/blocks";

const blobRefSchema = z.object({
  ref: z.object({ $link: z.string() }),
  mimeType: z.string(),
  size: z.number(),
});

const mdBlockSchema = z.object({
  type: z.literal("md"),
  id: z.string().optional(),
  md: z.string(),
});

const photoBlockSchema = z.object({
  type: z.literal("photo"),
  id: z.string().optional(),
  kind: z.enum(["uploaded", "handwriting"]),
  blob: blobRefSchema.optional(),
  caption: z.string().optional(),
  rot: z.number().optional(),
});

const musicBlockSchema = z.object({
  type: z.literal("music"),
  id: z.string().optional(),
  url: z.string(),
  service: z.enum(MUSIC_SERVICES),
  title: z.string(),
  artist: z.string().optional(),
  album: z.string().optional(),
  dur: z.string().optional(),
  tone: z.enum(MUSIC_TONES).optional(),
});

const videoBlockSchema = z.object({
  type: z.literal("video"),
  id: z.string().optional(),
  url: z.string(),
  service: z.enum(VIDEO_SERVICES),
  title: z.string(),
  channel: z.string().optional(),
  dur: z.string().optional(),
  thumbUrl: z.string().optional(),
});

const placeBlockSchema = z.object({
  type: z.literal("place"),
  id: z.string().optional(),
  url: z.string(),
  name: z.string(),
  addr: z.string().optional(),
  caption: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const articleBlockSchema = z.object({
  type: z.literal("article"),
  id: z.string().optional(),
  url: z.string(),
  host: z.string(),
  title: z.string(),
  excerpt: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const draftBlockSchema = z.union([
  mdBlockSchema,
  photoBlockSchema,
  musicBlockSchema,
  videoBlockSchema,
  placeBlockSchema,
  articleBlockSchema,
]);

export const draftBlocksSchema = z.array(draftBlockSchema);

// Compile-time check that schema and DraftBlock stay in sync.
type _Check = z.infer<typeof draftBlockSchema> extends DraftBlock
  ? DraftBlock extends z.infer<typeof draftBlockSchema>
    ? true
    : false
  : false;
const _check: _Check = true;
void _check;
