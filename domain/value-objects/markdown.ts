// ============================================================
// Respost — Minimal inline markdown parser
// Supports **bold** and *italic*. Pure function, no React.
// ============================================================

export type MdSegment =
  | { readonly kind: "text"; readonly text: string }
  | { readonly kind: "bold"; readonly text: string }
  | { readonly kind: "italic"; readonly text: string };

const INLINE_RE = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;

/**
 * Parse a single line of postcard prose into bold/italic/text segments.
 * Unmatched markers are emitted as plain text.
 */
export function parseInline(text: string): ReadonlyArray<MdSegment> {
  const out: MdSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE_RE)) {
    const index = m.index ?? 0;
    if (index > last) {
      out.push({ kind: "text", text: text.slice(last, index) });
    }
    const t = m[0];
    if (t.startsWith("**")) {
      out.push({ kind: "bold", text: t.slice(2, -2) });
    } else {
      out.push({ kind: "italic", text: t.slice(1, -1) });
    }
    last = index + t.length;
  }
  if (last < text.length) {
    out.push({ kind: "text", text: text.slice(last) });
  }
  return out;
}

/**
 * Split markdown body into paragraphs (blank-line separated).
 */
export function splitParagraphs(md: string): ReadonlyArray<string> {
  return md.split(/\n\n+/);
}
