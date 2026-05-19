import { z } from "zod";
import { draftBlocksSchema } from "@/presenters/components/postcard-design/compose-flow/draftSchema";

// ─── Compose URL contract ───────────────────────────────────────
//
// The composer page (`/compose`) is the single source of truth
// for what a URL can prefill. It uses `nuqs` to parse flat query
// params: `to`, `from`, `place`, `blocks` (JSON-encoded array).
// This module mirrors that contract — nothing more.
//
// No draft store, no opaque blob param. The URL itself is the
// payload, and every part is a `nuqs` parser away from typed state.
//
// Photo blocks require uploaded blobs and cannot ride the URL;
// callers must omit them. Photos are added inside the composer.
//
// `md` block content is markdown, parsed by `tiptap-markdown`
// inside TiptapProseEditor. StarterKit is configured with
// `heading: false`, `codeBlock: false`, html off, `tightLists`,
// `breaks`. Round-trip-safe subset:
//   - paragraphs, bold, italic, links
//   - bullet lists, ordered lists, blockquote, horizontal rule
//   - inline code
// Not supported (silently dropped or mangled by the parser):
//   - `#` headings, fenced code blocks, tables, `![]()` images,
//     raw HTML.
// For embeds (songs, videos, places, articles) use typed blocks
// rather than markdown links — the composer interleaves
// `md / media / md / media` blocks.

const composeUrlInputSchema = z.object({
  to: z.string().max(80).optional(),
  from: z.string().max(80).optional(),
  place: z.string().max(160).optional(),
  blocks: draftBlocksSchema.optional(),
});

export type ComposeUrlInput = z.infer<typeof composeUrlInputSchema>;

export { composeUrlInputSchema };

export function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_ORIGIN ??
    process.env.SITE_ORIGIN ??
    "https://respost.equanimi.tech"
  );
}

export function buildComposeUrl(input: ComposeUrlInput): string {
  const params = new URLSearchParams();
  if (input.to) params.set("to", input.to);
  if (input.from) params.set("from", input.from);
  if (input.place) params.set("place", input.place);
  if (input.blocks && input.blocks.length > 0) {
    params.set("blocks", JSON.stringify(input.blocks));
  }
  const qs = params.toString();
  return qs ? `${siteOrigin()}/compose?${qs}` : `${siteOrigin()}/compose`;
}

// ─── Propose codec ──────────────────────────────────────────────
//
// `?propose=<base64url JSON>` is a one-shot intent. The composer
// page decodes it, persists a new on-device draft in IndexedDB,
// then redirects to `/compose?draft=<id>`. The opaque blob keeps
// the propose URL atomic and easy to validate.

function bytesToB64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 =
    typeof btoa !== "undefined"
      ? btoa(bin)
      : Buffer.from(bin, "binary").toString("base64");
  return b64.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function b64UrlToBytes(s: string): Uint8Array {
  const b64 = s.replaceAll("-", "+").replaceAll("_", "/");
  const bin =
    typeof atob !== "undefined"
      ? atob(b64)
      : Buffer.from(b64, "base64").toString("binary");
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodeProposePayload(payload: ComposeUrlInput): string {
  return bytesToB64Url(new TextEncoder().encode(JSON.stringify(payload)));
}

export function decodeProposePayload(
  encoded: string
): ComposeUrlInput | null {
  try {
    const json = new TextDecoder().decode(b64UrlToBytes(encoded));
    const parsed = composeUrlInputSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function buildProposeUrl(input: ComposeUrlInput): string {
  return `${siteOrigin()}/compose?propose=${encodeProposePayload(input)}`;
}
