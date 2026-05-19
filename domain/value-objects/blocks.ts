// ============================================================
// Respost — Block value-object helpers
// Pure functions. No side effects beyond crypto-grade randomness
// for id generation.
// ============================================================

import type {
  BlockId,
  MusicService,
  VideoService,
} from "../types";
import { MUSIC_SERVICES, VIDEO_SERVICES } from "../types";

/**
 * Generate a fresh, stable block id.
 * Format: 12 hex chars (≈48 bits) — collisions astronomically unlikely
 * within a single postcard (≤40 blocks).
 */
export function createBlockId(): BlockId {
  const bytes = new Uint8Array(6);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex as BlockId;
}

/**
 * Deterministic, stable rotation derived from a block id.
 * Range: [-2.4, 2.4] degrees. Same id → same rotation forever.
 */
export function freezePhotoRotation(id: BlockId): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  const t = (h % 1000) / 1000;
  return Math.round((t * 4.8 - 2.4) * 10) / 10;
}

/**
 * Recognise a music service from a URL. Returns null if not recognised.
 */
export function inferMusicService(url: string): MusicService | null {
  const host = parseOgHost(url);
  if (!host) return null;
  const map: ReadonlyArray<readonly [string, MusicService]> = [
    ["open.spotify.com", "spotify"],
    ["spotify.com", "spotify"],
    ["music.apple.com", "apple"],
    ["soundcloud.com", "soundcloud"],
    ["bandcamp.com", "bandcamp"],
    ["youtube.com", "youtube"],
    ["youtu.be", "youtube"],
  ];
  for (const [needle, service] of map) {
    if (host.endsWith(needle)) {
      // For youtube hosts, classify as music *only* if the path looks like
      // a music URL (music.youtube.com, /playlist, etc). Bare watch URLs are
      // video blocks; the inferer for video picks them up first.
      if (service === "youtube" && !host.startsWith("music.")) continue;
      return service;
    }
  }
  // Final guard: music.youtube.com
  if (host.startsWith("music.youtube.")) return "youtube";
  // Ensure service is one of the canonical values
  return MUSIC_SERVICES.includes(map[0][1]) ? null : null;
}

/**
 * Recognise a video service. Currently: YouTube only.
 */
export function inferVideoService(url: string): VideoService | null {
  const host = parseOgHost(url);
  if (!host) return null;
  if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be") {
    if (!VIDEO_SERVICES.includes("youtube")) return null;
    return "youtube";
  }
  return null;
}

/**
 * Return the bare host of a URL, lower-cased, without leading "www.".
 * Returns null for malformed URLs.
 */
export function parseOgHost(url: string): string | null {
  try {
    const u = new URL(url);
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Recognise a Maps URL.
 */
export function isMapsUrl(url: string): boolean {
  const host = parseOgHost(url);
  if (!host) return false;
  return (
    host === "maps.google.com" ||
    host === "google.com" || // /maps path
    host === "goo.gl" ||
    host === "maps.app.goo.gl" ||
    host.endsWith(".google.com") ||
    host === "openstreetmap.org" ||
    host.endsWith(".openstreetmap.org")
  );
}
