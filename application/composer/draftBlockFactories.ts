// ============================================================
// Respost — Draft block placeholder factories
// Single source of truth for "what does a link block look like
// when we have nothing but the URL". Used by:
//   - resolveLink (server fallback when OG/oEmbed fetch fails)
//   - editorMapping (defensive default when PM attrs missing data)
// ============================================================

import { inferMusicService, inferVideoService } from "@/domain/value-objects/blocks";
import type {
  DraftArticleBlock,
  DraftMusicBlock,
  DraftPlaceBlock,
  DraftVideoBlock,
} from "./draftBlock";

export const PLACEHOLDER_TITLES = {
  music: "Track",
  video: "Video",
  place: "A place",
  article: "Article",
} as const;

export function placeholderMusic(url: string): DraftMusicBlock {
  return {
    type: "music",
    url,
    service: inferMusicService(url) ?? "spotify",
    title: PLACEHOLDER_TITLES.music,
  };
}

export function placeholderVideo(url: string, host: string): DraftVideoBlock {
  return {
    type: "video",
    url,
    service: inferVideoService(url) ?? "youtube",
    title: PLACEHOLDER_TITLES.video,
    channel: host,
  };
}

export function placeholderPlace(url: string, host: string): DraftPlaceBlock {
  return {
    type: "place",
    url,
    name: PLACEHOLDER_TITLES.place,
    addr: host,
  };
}

export function placeholderArticle(url: string, host: string): DraftArticleBlock {
  return {
    type: "article",
    url,
    host,
    title: PLACEHOLDER_TITLES.article,
  };
}
