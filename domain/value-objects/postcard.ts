// ============================================================
// Respost — Postcard validation
// Block-based postcards. Pure functions; no I/O.
// ============================================================

import type {
  Block,
  CreatePostcardCommand,
  MarkdownBlock,
  PhotoBlock,
  MusicBlock,
  VideoBlock,
  PlaceBlock,
  ArticleBlock,
} from "../types";
import { MUSIC_SERVICES, VIDEO_SERVICES } from "../types";

const MAX_RECIPIENT_GRAPHEMES = 40;
const MAX_SENDER_GRAPHEMES = 40;
const MAX_PLACE_GRAPHEMES = 80;
const MAX_TITLE_GRAPHEMES = 100;
const MAX_BRIEF_GRAPHEMES = 80;
const MAX_SUMMARY_GRAPHEMES = 300;
const MAX_MD_GRAPHEMES = 2000;
const MAX_CAPTION_GRAPHEMES = 80;
const MAX_BLOCKS = 40;
const ALLOWED_PHOTO_MIME = ["image/jpeg", "image/png", "image/webp"];

type ValidationResult = { valid: true } | { valid: false; error: string };

// Grapheme-aware length, falling back to .length when Intl.Segmenter is unavailable.
function graphemes(s: string): number {
  try {
    const Seg = (Intl as unknown as {
      Segmenter?: new (...a: unknown[]) => { segment(s: string): Iterable<unknown> };
    }).Segmenter;
    if (Seg) {
      const seg = new Seg("en", { granularity: "grapheme" });
      let n = 0;
      for (const _ of seg.segment(s)) n++;
      return n;
    }
  } catch {
    /* fall through */
  }
  return s.length;
}

function isHttpsUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

// ─── Top-level field validators ──────────────────────────────

export function validateRecipient(name: string): ValidationResult {
  const t = name.trim();
  if (t.length === 0) return { valid: false, error: "Recipient is required" };
  if (graphemes(t) > MAX_RECIPIENT_GRAPHEMES) {
    return {
      valid: false,
      error: `Recipient must be ${MAX_RECIPIENT_GRAPHEMES} characters or less`,
    };
  }
  return { valid: true };
}

export function validateSender(name: string): ValidationResult {
  const t = name.trim();
  if (t.length === 0) return { valid: false, error: "Sender is required" };
  if (graphemes(t) > MAX_SENDER_GRAPHEMES) {
    return {
      valid: false,
      error: `Sender must be ${MAX_SENDER_GRAPHEMES} characters or less`,
    };
  }
  return { valid: true };
}

export function validatePlace(place: string | undefined): ValidationResult {
  if (place === undefined || place.trim().length === 0) return { valid: true };
  if (graphemes(place) > MAX_PLACE_GRAPHEMES) {
    return {
      valid: false,
      error: `Place must be ${MAX_PLACE_GRAPHEMES} characters or less`,
    };
  }
  return { valid: true };
}

export function validateTitle(title: string | undefined): ValidationResult {
  if (title === undefined || title.trim().length === 0) return { valid: true };
  if (graphemes(title) > MAX_TITLE_GRAPHEMES) {
    return {
      valid: false,
      error: `Title must be ${MAX_TITLE_GRAPHEMES} characters or less`,
    };
  }
  return { valid: true };
}

export function validateBrief(brief: string | undefined): ValidationResult {
  if (brief === undefined || brief.trim().length === 0) return { valid: true };
  if (graphemes(brief) > MAX_BRIEF_GRAPHEMES) {
    return {
      valid: false,
      error: `Brief must be ${MAX_BRIEF_GRAPHEMES} characters or less`,
    };
  }
  return { valid: true };
}

export function validateSummary(summary: string | undefined): ValidationResult {
  if (summary === undefined || summary.trim().length === 0) return { valid: true };
  if (graphemes(summary) > MAX_SUMMARY_GRAPHEMES) {
    return {
      valid: false,
      error: `Summary must be ${MAX_SUMMARY_GRAPHEMES} characters or less`,
    };
  }
  return { valid: true };
}

// ─── Per-block validators ────────────────────────────────────

function validateMarkdownBlock(b: MarkdownBlock): ValidationResult {
  if (typeof b.md !== "string") return { valid: false, error: "Markdown block missing text" };
  const trimmed = b.md.trim();
  if (trimmed.length === 0) return { valid: false, error: "Empty markdown block" };
  if (graphemes(b.md) > MAX_MD_GRAPHEMES) {
    return {
      valid: false,
      error: `A text block exceeds ${MAX_MD_GRAPHEMES} characters`,
    };
  }
  return { valid: true };
}

function validatePhotoBlock(b: PhotoBlock): ValidationResult {
  if (b.kind === "uploaded" || b.kind === "handwriting") {
    if (!b.image) return { valid: false, error: "Photo block missing image" };
    if (!ALLOWED_PHOTO_MIME.includes(b.image.mimeType)) {
      return { valid: false, error: `Unsupported photo type: ${b.image.mimeType}` };
    }
  }
  if (b.caption !== undefined && graphemes(b.caption) > MAX_CAPTION_GRAPHEMES) {
    return {
      valid: false,
      error: `Caption must be ${MAX_CAPTION_GRAPHEMES} characters or less`,
    };
  }
  return { valid: true };
}

function validateMusicBlock(b: MusicBlock): ValidationResult {
  if (!isHttpsUrl(b.url)) return { valid: false, error: "Music block needs a valid URL" };
  if (!MUSIC_SERVICES.includes(b.service)) {
    return { valid: false, error: `Unknown music service: ${b.service}` };
  }
  if (!b.title || b.title.trim().length === 0) {
    return { valid: false, error: "Music block missing title" };
  }
  return { valid: true };
}

function validateVideoBlock(b: VideoBlock): ValidationResult {
  if (!isHttpsUrl(b.url)) return { valid: false, error: "Video block needs a valid URL" };
  if (!VIDEO_SERVICES.includes(b.service)) {
    return { valid: false, error: `Unknown video service: ${b.service}` };
  }
  if (!b.title || b.title.trim().length === 0) {
    return { valid: false, error: "Video block missing title" };
  }
  return { valid: true };
}

function validatePlaceBlock(b: PlaceBlock): ValidationResult {
  if (!isHttpsUrl(b.url)) return { valid: false, error: "Place block needs a valid URL" };
  if (!b.name || b.name.trim().length === 0) {
    return { valid: false, error: "Place block missing name" };
  }
  return { valid: true };
}

function validateArticleBlock(b: ArticleBlock): ValidationResult {
  if (!isHttpsUrl(b.url)) return { valid: false, error: "Article block needs a valid URL" };
  if (!b.host || b.host.trim().length === 0) {
    return { valid: false, error: "Article block missing host" };
  }
  if (!b.title || b.title.trim().length === 0) {
    return { valid: false, error: "Article block missing title" };
  }
  return { valid: true };
}

function validateBlock(b: Block): ValidationResult {
  switch (b.type) {
    case "md": return validateMarkdownBlock(b);
    case "photo": return validatePhotoBlock(b);
    case "music": return validateMusicBlock(b);
    case "video": return validateVideoBlock(b);
    case "place": return validatePlaceBlock(b);
    case "article": return validateArticleBlock(b);
  }
}

export function validateBlocks(
  blocks: ReadonlyArray<Block>
): ValidationResult {
  if (blocks.length === 0) {
    return { valid: false, error: "A postcard needs at least one block" };
  }
  if (blocks.length > MAX_BLOCKS) {
    return { valid: false, error: `A postcard can hold at most ${MAX_BLOCKS} blocks` };
  }
  for (const b of blocks) {
    const r = validateBlock(b);
    if (r.valid === false) return r;
  }
  return { valid: true };
}

// ─── Aggregate validator ─────────────────────────────────────

export function validatePostcard(
  command: CreatePostcardCommand
): ValidationResult {
  const to = validateRecipient(command.to);
  if (to.valid === false) return to;

  const from = validateSender(command.from);
  if (from.valid === false) return from;

  const place = validatePlace(command.place);
  if (place.valid === false) return place;

  const title = validateTitle(command.title);
  if (title.valid === false) return title;

  const brief = validateBrief(command.brief);
  if (brief.valid === false) return brief;

  const summary = validateSummary(command.summary);
  if (summary.valid === false) return summary;

  const blocks = validateBlocks(command.blocks);
  if (blocks.valid === false) return blocks;

  return { valid: true };
}
