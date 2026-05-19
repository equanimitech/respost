"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { DraftBlock } from "@/application/actions/publishPostcard";
import { uploadImageBlob } from "@/application/actions/uploadImageBlob";
import { resolveLink, type LinkKind } from "@/application/actions/resolveLink";
import { PostcardBlockView } from "../blocks/PostcardBlockView";
import { Icon } from "../primitives/Icon";
import type { PhotoBlock, Block, BlockId, PhotoKind } from "@/domain/types";
import { ComposerChrome } from "./ComposerChrome";
import { compressImage } from "../compose-flow/compressImage";
import { TiptapProseEditor } from "./TiptapProseEditor";
import type { SlashCommandItem } from "./SlashCommandsMenu";
import {
  buildFormatCommands,
  type FormatCommandKind,
} from "./slashCommands";

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
  const t = useTranslations("editor");
  const [draftMd, setDraftMd] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [linkPrompt, setLinkPrompt] = useState<{
    kind: LinkKind;
    value: string;
    resolving: boolean;
    error?: string;
  } | null>(null);
  const [_, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const handwritingRef = useRef<HTMLInputElement | null>(null);
  const linkInputRef = useRef<HTMLInputElement | null>(null);

  const openLinkPromptRef = useRef<(kind: LinkKind) => void>(() => {});

  const flushDraftMd = (
    current: ReadonlyArray<DraftBlock>
  ): ReadonlyArray<DraftBlock> => {
    const t = draftMd.trim();
    if (t.length === 0) return current;
    return [...current, { type: "md", md: draftMd }];
  };

  const handleAddPhoto = async (
    file: File,
    kind: "uploaded" | "handwriting"
  ) => {
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      const compressed = await compressImage(file);
      const result = await uploadImageBlob(
        compressed.base64,
        compressed.mimeType
      );
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
      setPhotoError(err instanceof Error ? err.message : t("photoFailed"));
    } finally {
      setPhotoBusy(false);
    }
  };

  const onPickPhoto = (kind: "uploaded" | "handwriting") => {
    if (kind === "handwriting") handwritingRef.current?.click();
    else fileRef.current?.click();
  };

  const openLinkPrompt = (kind: LinkKind) => {
    setLinkPrompt({ kind, value: "", resolving: false });
    setTimeout(() => linkInputRef.current?.focus(), 0);
  };
  openLinkPromptRef.current = openLinkPrompt;

  const submitLink = () => {
    if (!linkPrompt) return;
    const url = linkPrompt.value.trim();
    if (!URL_RE.test(url)) return;
    setLinkPrompt({ ...linkPrompt, resolving: true, error: undefined });
    startTransition(async () => {
      const result = await resolveLink(url, linkPrompt.kind);
      if (result.success === true) {
        const flushed = flushDraftMd(blocks);
        onChange([...flushed, result.block]);
        setDraftMd("");
        setLinkPrompt(null);
        return;
      }
      const errMsg = result.error;
      setLinkPrompt((p) =>
        p ? { ...p, resolving: false, error: errMsg } : p
      );
    });
  };

  const dismissLinkPrompt = () => setLinkPrompt(null);

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

  const tSlash = useTranslations("linkSlashCommands");
  const tFormat = useTranslations("slashCommands");
  const formatSlashItems = useMemo<readonly SlashCommandItem[]>(
    () =>
      buildFormatCommands((kind: FormatCommandKind) => ({
        title: tFormat(`${kind}.title`),
        description: tFormat(`${kind}.description`),
      })),
    [tFormat]
  );
  const linkSlashItems = useMemo<SlashCommandItem[]>(
    () => [
      {
        title: tSlash("song.title"),
        description: tSlash("song.description"),
        keywords: ["song", "music", "spotify", "soundcloud", "track"],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).run();
          openLinkPromptRef.current("song");
        },
      },
      {
        title: tSlash("video.title"),
        description: tSlash("video.description"),
        keywords: ["video", "youtube", "yt", "clip"],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).run();
          openLinkPromptRef.current("video");
        },
      },
      {
        title: tSlash("place.title"),
        description: tSlash("place.description"),
        keywords: ["place", "map", "maps", "location", "pin"],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).run();
          openLinkPromptRef.current("place");
        },
      },
      {
        title: tSlash("link.title"),
        description: tSlash("link.description"),
        keywords: ["link", "article", "url", "web", "page"],
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).run();
          openLinkPromptRef.current("link");
        },
      },
    ],
    [tSlash]
  );

  return (
    <div className="app">
      <ComposerChrome step={1} total={3} title={t("chromeTitle")} onClose={onClose} />

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
          {t("to")}
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
          {t("change")}
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
              aria-label={t("addPhotoAria")}
            >
              <Icon name="image" size={26} strokeWidth={1.4} />
              <div className="t-mono" style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>
                {t("tapToAddPhoto")}
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>
                {t("addPhotoHint")}
              </div>
            </button>
          )}

          {blocks.map((b, i) => (
            <div key={i} style={{ position: "relative" }}>
              <PostcardBlockView block={draftToView(b, i)} resolveImageUrl={resolveImageUrl} />
              <button
                type="button"
                onClick={() => removeBlock(i)}
                aria-label={t("removeBlockAria")}
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
                <span aria-hidden>✎</span> {t("writeHere")}
              </div>
            )}
            <TiptapProseEditor
              value={draftMd}
              onChange={setDraftMd}
              slashItems={[...linkSlashItems, ...formatSlashItems]}
              placeholder={blocks.length === 0 ? t("placeholderEmpty") : t("placeholderContinue")}
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
      </div>

      {/* Link prompt — appears above the toolbar when a slash command is picked */}
      {linkPrompt && (
        <div
          style={{
            padding: "10px 14px",
            background: "var(--paper-light)",
            borderTop: "1px solid var(--divider)",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div
            className="t-mono"
            style={{
              fontSize: 9,
              letterSpacing: 1.5,
              color: "var(--terra)",
              textTransform: "uppercase",
            }}
          >
            /{t(`linkKind.${linkPrompt.kind}`)}
            {linkPrompt.resolving ? ` · ${t("linkPrompt.fetching")}` : ""}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              ref={linkInputRef}
              type="url"
              value={linkPrompt.value}
              onChange={(e) =>
                setLinkPrompt(
                  linkPrompt
                    ? { ...linkPrompt, value: e.target.value, error: undefined }
                    : null
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") submitLink();
                else if (e.key === "Escape") dismissLinkPrompt();
              }}
              placeholder={t(`linkPlaceholder.${linkPrompt.kind}`)}
              disabled={linkPrompt.resolving}
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
              onClick={dismissLinkPrompt}
              disabled={linkPrompt.resolving}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                background: "transparent",
                border: "1px solid var(--paper-edge)",
                color: "var(--ink-mute)",
                cursor: linkPrompt.resolving ? "default" : "pointer",
                fontFamily: "inherit",
                fontSize: 12,
              }}
            >
              {t("linkPrompt.cancel")}
            </button>
            <button
              type="button"
              onClick={submitLink}
              disabled={
                !URL_RE.test(linkPrompt.value.trim()) || linkPrompt.resolving
              }
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background:
                  URL_RE.test(linkPrompt.value.trim()) && !linkPrompt.resolving
                    ? "var(--ink)"
                    : "var(--ink-faint)",
                color: "var(--paper-light)",
                border: "none",
                cursor:
                  URL_RE.test(linkPrompt.value.trim()) && !linkPrompt.resolving
                    ? "pointer"
                    : "default",
                fontFamily: "inherit",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {t("linkPrompt.add")}
            </button>
          </div>
          {linkPrompt.error && (
            <div style={{ color: "var(--stamp-red)", fontSize: 11 }}>
              {linkPrompt.error}
            </div>
          )}
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
          title={t("toolbar.photo")}
          aria-label={t("toolbar.photo")}
        >
          <Icon name="image" size={18} strokeWidth={1.6} />
        </button>
        <button
          type="button"
          onClick={() => openLinkPrompt("song")}
          style={toolBtnStyle()}
          title={t("toolbar.song")}
          aria-label={t("toolbar.song")}
        >
          <Icon name="music" size={18} strokeWidth={1.6} />
        </button>
        <button
          type="button"
          onClick={() => openLinkPrompt("video")}
          style={toolBtnStyle()}
          title={t("toolbar.video")}
          aria-label={t("toolbar.video")}
        >
          <Icon name="play" size={18} strokeWidth={1.6} />
        </button>
        <button
          type="button"
          onClick={() => openLinkPrompt("place")}
          style={toolBtnStyle()}
          title={t("toolbar.place")}
          aria-label={t("toolbar.place")}
        >
          <Icon name="pin" size={18} strokeWidth={1.6} />
        </button>
        <button
          type="button"
          onClick={() => openLinkPrompt("link")}
          style={toolBtnStyle()}
          title={t("toolbar.link")}
          aria-label={t("toolbar.link")}
        >
          <Icon name="edit" size={18} strokeWidth={1.6} />
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
          {t("previewCta")}
        </button>
      </div>
    </div>
  );
}

function toolBtnStyle() {
  return {
    width: 38,
    height: 38,
    padding: 0,
    borderRadius: 8,
    background: "transparent",
    border: "1px solid var(--paper-edge)",
    cursor: "pointer",
    color: "var(--ink-soft)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontFamily: "inherit",
  } as const;
}
