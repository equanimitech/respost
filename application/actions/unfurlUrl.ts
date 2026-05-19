"use server";

import {
  inferMusicService,
  inferVideoService,
  isMapsUrl,
  parseOgHost,
} from "@/domain/value-objects/blocks";
import type { DraftBlock } from "./publishPostcard";
import type { MusicService } from "@/domain/types";

export type UnfurlResult =
  | { success: true; block: DraftBlock }
  | { success: false; error: string };

const FETCH_TIMEOUT_MS = 4500;
const MAX_BYTES = 800_000;
const UA =
  "Mozilla/5.0 (compatible; Respost/0.1; +https://respost.fyi) AppleWebKit/537.36";

type OgMeta = {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
};

async function timedFetch(url: string, init?: RequestInit) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        "user-agent": UA,
        accept: "text/html,application/json;q=0.9,*/*;q=0.5",
        ...(init?.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function matchMeta(html: string, key: string): string | undefined {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const propFirst = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*?content=["']([^"']*)["']`,
    "i"
  );
  const contentFirst = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]*?(?:property|name)=["']${escaped}["']`,
    "i"
  );
  const m = html.match(propFirst) ?? html.match(contentFirst);
  return m ? decodeEntities(m[1]) : undefined;
}

async function readBoundedText(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return await res.text();
  const decoder = new TextDecoder("utf-8", { fatal: false });
  let total = 0;
  let out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    out += decoder.decode(value, { stream: true });
    if (total >= MAX_BYTES) {
      try {
        await reader.cancel();
      } catch {
        // ignore
      }
      break;
    }
  }
  out += decoder.decode();
  return out;
}

async function fetchOgMeta(url: string): Promise<OgMeta> {
  try {
    const res = await timedFetch(url, { redirect: "follow" });
    if (!res.ok) return {};
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.toLowerCase().includes("html")) return {};
    const html = await readBoundedText(res);
    return {
      title:
        matchMeta(html, "og:title") ??
        matchMeta(html, "twitter:title") ??
        extractTitle(html),
      description:
        matchMeta(html, "og:description") ??
        matchMeta(html, "twitter:description") ??
        matchMeta(html, "description"),
      image:
        matchMeta(html, "og:image") ??
        matchMeta(html, "twitter:image") ??
        matchMeta(html, "twitter:image:src"),
      siteName: matchMeta(html, "og:site_name"),
    };
  } catch {
    return {};
  }
}

function extractTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? decodeEntities(m[1].trim()) : undefined;
}

type OEmbed = {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  provider_name?: string;
};

async function fetchOEmbed(endpoint: string): Promise<OEmbed | null> {
  try {
    const res = await timedFetch(endpoint);
    if (!res.ok) return null;
    const data = (await res.json()) as OEmbed;
    return data;
  } catch {
    return null;
  }
}

async function fetchYouTubeOEmbed(url: string): Promise<OEmbed | null> {
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    url
  )}&format=json`;
  return await fetchOEmbed(endpoint);
}

async function fetchSpotifyOEmbed(url: string): Promise<OEmbed | null> {
  const endpoint = `https://open.spotify.com/oembed?url=${encodeURIComponent(
    url
  )}`;
  return await fetchOEmbed(endpoint);
}

async function fetchSoundCloudOEmbed(url: string): Promise<OEmbed | null> {
  const endpoint = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(
    url
  )}`;
  return await fetchOEmbed(endpoint);
}

// Try to split "Artist - Track" / "Track · Artist" / "Track by Artist" patterns.
function splitArtistTrack(s: string): { title: string; artist?: string } {
  const dash = s.match(/^(.+?)\s+[-–—]\s+(.+)$/);
  if (dash) return { artist: dash[1].trim(), title: dash[2].trim() };
  const by = s.match(/^(.+?)\s+by\s+(.+)$/i);
  if (by) return { title: by[1].trim(), artist: by[2].trim() };
  const dot = s.match(/^(.+?)\s+·\s+(.+)$/);
  if (dot) return { title: dot[1].trim(), artist: dot[2].trim() };
  return { title: s.trim() };
}

async function unfurlVideo(url: string): Promise<DraftBlock> {
  const host = parseOgHost(url) ?? "";
  const oembed = await fetchYouTubeOEmbed(url);
  if (oembed?.title) {
    return {
      type: "video",
      url,
      service: "youtube",
      title: oembed.title,
      channel: oembed.author_name ?? host,
      thumbUrl: oembed.thumbnail_url,
    };
  }
  const og = await fetchOgMeta(url);
  return {
    type: "video",
    url,
    service: "youtube",
    title: og.title ?? "YouTube video",
    channel: og.siteName ?? host,
    thumbUrl: og.image,
  };
}

async function unfurlMusic(
  url: string,
  service: MusicService
): Promise<DraftBlock> {
  let oembed: OEmbed | null = null;
  if (service === "spotify") oembed = await fetchSpotifyOEmbed(url);
  else if (service === "soundcloud") oembed = await fetchSoundCloudOEmbed(url);

  // Fall back to OG scrape for richer metadata (description often contains artist/album)
  const og = await fetchOgMeta(url);

  // Prefer oEmbed title, otherwise OG title.
  const rawTitle = oembed?.title ?? og.title ?? "Track";
  const { title, artist: parsedArtist } = splitArtistTrack(rawTitle);

  // Description: Spotify often returns "Listen to <track> on Spotify. <artist> · Song · YYYY"
  let artist = parsedArtist ?? oembed?.author_name;
  let album: string | undefined;
  if (og.description) {
    // Match "<artist> · Song · <year>" or "<artist> · Album · <year>"
    const m = og.description.match(/·\s*([^·]+?)\s*·/);
    if (m) album = m[1].trim();
    if (!artist) {
      const listenMatch = og.description.match(
        /(?:Listen to .+? on Spotify\.\s*)?([^·.]+?)\s*·/
      );
      if (listenMatch) artist = listenMatch[1].trim();
    }
  }

  return {
    type: "music",
    url,
    service,
    title,
    artist,
    album: album && album.toLowerCase() !== "song" ? album : undefined,
  };
}

async function unfurlArticle(url: string): Promise<DraftBlock> {
  const host = parseOgHost(url) ?? "";
  const og = await fetchOgMeta(url);
  return {
    type: "article",
    url,
    host: og.siteName ?? host,
    title: og.title ?? host,
    excerpt: og.description,
    imageUrl: og.image,
  };
}

/**
 * Resolve a URL into a draft block, fetching oEmbed / OG metadata when
 * possible. Falls back to URL-shape pattern matching on network failure.
 */
export async function unfurlUrl(url: string): Promise<UnfurlResult> {
  if (!url || typeof url !== "string") {
    return { success: false, error: "Empty URL" };
  }

  const host = parseOgHost(url);
  if (!host) return { success: false, error: "Invalid URL" };

  try {
    const video = inferVideoService(url);
    if (video) {
      return { success: true, block: await unfurlVideo(url) };
    }

    const music = inferMusicService(url);
    if (music) {
      return { success: true, block: await unfurlMusic(url, music) };
    }

    if (isMapsUrl(url)) {
      const og = await fetchOgMeta(url);
      return {
        success: true,
        block: {
          type: "place",
          url,
          name: og.title ?? "A place",
          addr: og.siteName ?? host,
        },
      };
    }

    return { success: true, block: await unfurlArticle(url) };
  } catch {
    // Network failed entirely — fall back to URL-shape guess.
    return { success: true, block: shapeOnly(url, host) };
  }
}

function shapeOnly(url: string, host: string): DraftBlock {
  const video = inferVideoService(url);
  if (video) {
    return {
      type: "video",
      url,
      service: video,
      title: "YouTube video",
      channel: host,
    };
  }
  const music = inferMusicService(url);
  if (music) {
    return { type: "music", url, service: music, title: "Track" };
  }
  if (isMapsUrl(url)) {
    return { type: "place", url, name: "A place", addr: host };
  }
  return { type: "article", url, host, title: host };
}
