"use client";

import { useRef, useState, useTransition } from "react";
import type { DraftBlock } from "@/application/actions/publishPostcard";
import { uploadImageBlob } from "@/application/actions/uploadImageBlob";
import { unfurlUrl } from "@/application/actions/unfurlUrl";
import { PostcardBlockView } from "../blocks/PostcardBlockView";
import { Icon } from "../primitives/Icon";
import type { PhotoBlock, Block, BlockId, PhotoKind } from "@/domain/types";
import { ComposerChrome } from "./ComposerChrome";
import { compressImage } from "../compose-flow/compressImage";
import { TiptapProseEditor } from "./TiptapProseEditor";

type Props = {
  to: string;
  blocks: ReadonlyArray<DraftBlock>;
  onChange: (next: ReadonlyArray<DraftBlock>) => void;
  onClose?: () => void;
  onChangeRecipient: () => void;
  onPreview: () => void;
  resolveImageUrl?: (ref: string) => string | undefined;
  onRegisterPreviewUrl?: (refLink: string, url: string) => void;
};

// Convert a DraftBlock to a Domain Block so we can re-use the read-only renderer.
function draftToView(d: DraftBlock, idx: number): Block {
  const fakeId = `draft-${idx}` as BlockId;
  switch (d.type) {
    case "md":
      return { type: "md", id: fakeId, md: d.md };
    case "photo": {
      const kind: PhotoKind = d.kind;
      const block: PhotoBlock = {
        type: "photo",
        id: fakeId,
        kind,
        image: d.blob
          ? { ref: d.blob.ref.$link, mimeType: d.blob.mimeType }
          : undefined,
        caption: d.caption,
        rot: d.rot ?? -1,
      };
      return block;
    }
    case "music":
      return { ...d, id: fakeId };
    case "video":
      return { ...d, id: fakeId };
    case "place":
      return { ...d, id: fakeId };
    case "article":
      return { ...d, id: fakeId };
  }
}

const URL_RE = /^https?:\/\/[^\s]+$/;

// Tiptap autolinks pasted URLs, so a "URL-only" draft may serialize as
// `<https://…>`, `[https://…](https://…)`, or the bare URL. Extract the URL
// if the trimmed markdown is just one of those forms.
function extractSoleUrl(md: string): string | null {
  const t = md.trim();
  if (URL_RE.test(t)) return t;
  const angle = t.match(/^<(https?:\/\/[^\s>]+)>$/);
  if (angle) return angle[1];
  const linked = t.match(/^\[(https?:\/\/[^\s\]]+)\]\(\1\)$/);
  if (linked) return linked[1];
  return null;
}

export function ComposerEditor({
  to,
  blocks,
  onChange,
  onClose,
  onChangeRecipient,
  onPreview,
  resolveImageUrl,
  onRegisterPreviewUrl,
}: Props) {
  const [draftMd, setDraftMd] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [unfurled, setUnfurled] = useState<DraftBlock | null>(null);
  const [linkInput, setLinkInput] = useState<string | null>(null);
  const [_, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const handwritingRef = useRef<HTMLInputElement | null>(null);
  const linkInputRef = useRef<HTMLInputElement | null>(null);

  // Commit the pending markdown into the block list (if any).
  const flushDraftMd = (current: ReadonlyArray<DraftBlock>): ReadonlyArray<DraftBlock> => {
    const t = draftMd.trim();
    if (t.length === 0) return current;
    return [...current, { type: "md", md: draftMd }];
  };

  const handleAddPhoto = async (file: File, kind: "uploaded" | "handwriting") => {
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      const compressed = await compressImage(file);
      const result = await uploadImageBlob(compressed.base64, compressed.mimeType);
      if (result.success === false) {
        setPhotoError(result.error);
        return;
      }
      onRegisterPreviewUrl?.(result.blob.ref.$link, compressed.objectUrl);
      const flushed = flushDraftMd(blocks);
      const next: ReadonlyArray<DraftBlock> = [
        ...flushed,
        {
          type: "photo",
          kind,
          blob: result.blob,
        },
      ];
      onChange(next);
      setDraftMd("");
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Photo failed");
    } finally {
      setPhotoBusy(false);
    }
  };

  const onPickPhoto = (kind: "uploaded" | "handwriting") => {
    if (kind === "handwriting") handwritingRef.current?.click();
    else fileRef.current?.click();
  };

  const handlePastedLink = (url: string) => {
    setPendingUrl(url);
    setUnfurled(null);
    startTransition(async () => {
      const result = await unfurlUrl(url);
      if (result.success) setUnfurled(result.block);
    });
  };

  const onMdChange = (val: string) => {
    setDraftMd(val);
    const url = extractSoleUrl(val);
    if (url && url !== pendingUrl) {
      handlePastedLink(url);
    } else if (!url && pendingUrl) {
      setPendingUrl(null);
      setUnfurled(null);
    }
  };

  const confirmUnfurl = () => {
    if (!unfurled) return;
    // If the draft is just the URL (in any form), drop it; otherwise flush md first.
    const soleUrl = extractSoleUrl(draftMd);
    const next: ReadonlyArray<DraftBlock> =
      soleUrl && soleUrl === pendingUrl
        ? [...blocks, unfurled]
        : [...flushDraftMd(blocks), unfurled];
    onChange(next);
    setDraftMd("");
    setPendingUrl(null);
    setUnfurled(null);
  };

  const dismissUnfurl = () => {
    setPendingUrl(null);
    setUnfurled(null);
  };

  const removeBlock = (i: number) => {
    const next = blocks.slice(0, i).concat(blocks.slice(i + 1));
    onChange(next);
  };

  const goPreview = () => {
    const next = flushDraftMd(blocks);
    if (next !== blocks) onChange(next);
    setDraftMd("");
    onPreview();
  };

  return (
    <div className="app">
      <ComposerChrome step={1} total={3} title="write · 2/3" onClose={onClose} />

      {/* Addressee tab */}
      <div
        style={{
          padding: "4px 22px 10px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
          borderBottom: "1px dashed var(--paper-edge)",
        }}
      >
        <div
          className="t-mono"
          style={{
            fontSize: 9,
            letterSpacing: 1.5,
            color: "var(--ink-mute)",
            textTransform: "uppercase",
          }}
        >
          to
        </div>
        <div className="t-hand" style={{ fontSize: 19, color: "var(--ink)", lineHeight: 1 }}>
          {to}
        </div>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={onChangeRecipient}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--ink-faint)",
            fontSize: 11,
            fontFamily: "inherit",
          }}
        >
          change
        </button>
      </div>

      {/* Canvas — postcard surface */}
      <div className="no-scrollbar" style={{ flex: 1, overflow: "auto", padding: "12px 14px 8px" }}>
        <div
          style={{
            background: "var(--paper-light)",
            borderRadius: 14,
            border: "1px solid var(--paper-edge)",
            boxShadow: "var(--sh-soft)",
            padding: "6px 0 4px",
            minHeight: "60%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {blocks.length === 0 && draftMd.length === 0 && (
            <button
              type="button"
              onClick={() => onPickPhoto("uploaded")}
              disabled={photoBusy}
              style={{
                margin: "12px 18px 6px",
                padding: "22px 16px",
                borderRadius: 10,
                border: "1.5px dashed var(--paper-edge)",
                background: "transparent",
                color: "var(--ink-mute)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                fontFamily: "inherit",
              }}
              aria-label="Add a photo"
            >
              <Icon name="image" size={26} strokeWidth={1.4} />
              <div className="t-mono" style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>
                tap to add a photo
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>
                or use the toolbar below for handwriting · link
              </div>
            </button>
          )}

          {blocks.map((b, i) => (
            <div key={i} style={{ position: "relative" }}>
              <PostcardBlockView block={draftToView(b, i)} resolveImageUrl={resolveImageUrl} />
              <button
                type="button"
                onClick={() => removeBlock(i)}
                aria-label="Remove block"
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "rgba(60,40,20,.6)",
                  color: "var(--paper-light)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: 14,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}

          {/* Inline prose editor (tiptap, markdown-backed) */}
          <div
            style={{
              position: "relative",
              padding: "14px 22px 20px",
              flex: 1,
            }}
          >
            {blocks.length === 0 && draftMd.length === 0 && (
              <div
                className="t-mono"
                style={{
                  fontSize: 9,
                  letterSpacing: 1.5,
                  color: "var(--ink-mute)",
                  textTransform: "uppercase",
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span aria-hidden>✎</span> write your note here
              </div>
            )}
            <TiptapProseEditor
              value={draftMd}
              onChange={onMdChange}
              placeholder={blocks.length === 0 ? "write something quiet…" : "keep going…"}
            />
          </div>
        </div>

        {photoError && (
          <div
            style={{
              margin: "0 22px 12px",
              padding: "8px 12px",
              background: "rgba(168,73,60,.10)",
              border: "1px solid var(--stamp-red)",
              borderRadius: 8,
              color: "var(--stamp-red)",
              fontSize: 12,
            }}
          >
            {photoError}
          </div>
        )}

        {pendingUrl && (
          <div style={{ padding: "0 14px 14px" }}>
            <div
              style={{
                background: "var(--paper-light)",
                borderRadius: 14,
                padding: "14px 14px 12px",
                border: "1.5px solid var(--terra)",
                boxShadow: "0 12px 28px rgba(40,30,20,.18)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <div
                  className="t-mono"
                  style={{
                    fontSize: 9,
                    color: "var(--terra)",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                  }}
                >
                  {unfurled ? "ready to tuck in" : "link pasted · unfurling"}
                </div>
              </div>
              <div
                className="t-mono"
                style={{
                  fontSize: 11,
                  color: "var(--ink-soft)",
                  padding: "6px 10px",
                  background: "var(--paper)",
                  borderRadius: 6,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginBottom: 12,
                }}
              >
                {pendingUrl}
              </div>
              {unfurled && (
                <div style={{ marginBottom: 12, fontSize: 12, color: "var(--ink-soft)" }}>
                  Detected: <strong>{unfurled.type}</strong>
                </div>
              )}
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={dismissUnfurl}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 999,
                    background: "transparent",
                    color: "var(--ink-mute)",
                    border: "1px solid var(--paper-edge)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 13,
                  }}
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={confirmUnfurl}
                  disabled={!unfurled}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 999,
                    background: unfurled ? "var(--ink)" : "var(--ink-faint)",
                    color: "var(--paper-light)",
                    border: "none",
                    cursor: unfurled ? "pointer" : "default",
                    fontFamily: "inherit",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  Tuck it in
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Link prompt overlay */}
      {linkInput !== null && (
        <div
          style={{
            padding: "10px 14px",
            background: "var(--paper-light)",
            borderTop: "1px solid var(--divider)",
            flexShrink: 0,
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          <input
            ref={linkInputRef}
            type="url"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = linkInput.trim();
                if (URL_RE.test(v)) {
                  handlePastedLink(v);
                  setLinkInput(null);
                }
              } else if (e.key === "Escape") {
                setLinkInput(null);
              }
            }}
            placeholder="paste a link (spotify, youtube, maps, anything)"
            className="t-mono"
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid var(--paper-edge)",
              background: "var(--paper)",
              color: "var(--ink)",
              fontSize: 12,
              outline: "none",
              fontFamily: "var(--font-mono), monospace",
            }}
          />
          <button
            type="button"
            onClick={() => setLinkInput(null)}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              background: "transparent",
              border: "1px solid var(--paper-edge)",
              color: "var(--ink-mute)",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 12,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const v = linkInput.trim();
              if (URL_RE.test(v)) {
                handlePastedLink(v);
                setLinkInput(null);
              }
            }}
            disabled={!URL_RE.test(linkInput.trim())}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: URL_RE.test(linkInput.trim()) ? "var(--ink)" : "var(--ink-faint)",
              color: "var(--paper-light)",
              border: "none",
              cursor: URL_RE.test(linkInput.trim()) ? "pointer" : "default",
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Unfurl
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div
        style={{
          padding: "6px 10px calc(6px + env(safe-area-inset-bottom))",
          background: "var(--paper)",
          borderTop: "1px solid var(--divider)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => onPickPhoto("uploaded")}
          disabled={photoBusy}
          style={toolBtnStyle()}
        >
          <Icon name="image" size={18} strokeWidth={1.6} />
          <span style={toolBtnLabelStyle()}>Photo</span>
        </button>
        <button
          type="button"
          onClick={() => onPickPhoto("handwriting")}
          disabled={photoBusy}
          style={toolBtnStyle()}
        >
          <Icon name="paper" size={18} strokeWidth={1.6} />
          <span style={toolBtnLabelStyle()}>Handwriting</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setLinkInput("");
            setTimeout(() => linkInputRef.current?.focus(), 0);
          }}
          style={toolBtnStyle()}
        >
          <Icon name="edit" size={18} strokeWidth={1.6} />
          <span style={toolBtnLabelStyle()}>Link</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleAddPhoto(f, "uploaded");
            e.target.value = "";
          }}
        />
        <input
          ref={handwritingRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleAddPhoto(f, "handwriting");
            e.target.value = "";
          }}
        />
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={goPreview}
          disabled={blocks.length === 0 && draftMd.trim().length === 0}
          style={{
            padding: "10px 18px",
            borderRadius: 999,
            background: "var(--ink)",
            color: "var(--paper-light)",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            opacity: blocks.length === 0 && draftMd.trim().length === 0 ? 0.45 : 1,
          }}
        >
          Preview →
        </button>
      </div>
    </div>
  );
}

function toolBtnStyle() {
  return {
    minHeight: 34,
    padding: "5px 10px",
    borderRadius: 8,
    background: "transparent",
    border: "1px solid var(--paper-edge)",
    cursor: "pointer",
    color: "var(--ink-soft)",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontFamily: "inherit",
    fontSize: 12,
  } as const;
}

function toolBtnLabelStyle() {
  return {
    fontFamily: "var(--font-sans-display), sans-serif",
    fontSize: 12,
    color: "var(--ink-soft)",
  } as const;
}
