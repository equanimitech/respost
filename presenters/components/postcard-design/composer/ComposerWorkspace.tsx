"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type {
  DraftBlock,
  DraftPhotoBlock,
} from "@/application/composer/draftBlock";
import { isDraftLinkBlock } from "@/application/composer/draftBlock";
import { uploadImageBlob } from "@/application/actions/uploadImageBlob";
import { resolveLink, type LinkKind } from "@/application/actions/resolveLink";
import type { Block, BlockId, PhotoBlock, PhotoKind } from "@/domain/types";
import { Icon } from "../primitives/Icon";
import { ComposerChrome } from "./ComposerChrome";
import { PostcardBlockView } from "../blocks/PostcardBlockView";
import { compressImage } from "../compose-flow/compressImage";
import {
  TiptapPostcardEditor,
  type TiptapPostcardEditorHandle,
} from "./TiptapPostcardEditor";
import type { SlashCommandItem } from "./SlashCommandsMenu";
import {
  buildFormatCommands,
  type FormatCommandKind,
} from "./slashCommands";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/presenters/components/ui/toggle-group";

type Props = {
  to: string;
  title: string;
  brief: string;
  summary: string;
  blocks: ReadonlyArray<DraftBlock>;
  preview: boolean;
  onChange: (next: ReadonlyArray<DraftBlock>) => void;
  onChangeTo: (next: string) => void;
  onChangeTitle: (next: string) => void;
  onChangeBrief: (next: string) => void;
  onChangeSummary: (next: string) => void;
  onChangeMode: (preview: boolean) => void;
  onClose?: () => void;
  onPublish: () => void;
  publishing: boolean;
  error: string | null;
  resolveImageUrl?: (ref: string) => string | undefined;
  onRegisterPreviewUrl?: (refLink: string, url: string) => void;
};

function graphemeCount(s: string): number {
  try {
    const Seg = (Intl as unknown as {
      Segmenter?: new (
        ...a: unknown[]
      ) => { segment(s: string): Iterable<unknown> };
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

const TITLE_MAX = 100;
const BRIEF_MAX = 80;
const SUMMARY_MAX = 300;

const URL_RE = /^https?:\/\/[^\s]+$/;

function draftToView(d: DraftBlock, idx: number): Block {
  const fakeId = `preview-${idx}` as BlockId;
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

export function ComposerWorkspace({
  to,
  title,
  brief,
  summary,
  blocks,
  preview,
  onChange,
  onChangeTo,
  onChangeTitle,
  onChangeBrief,
  onChangeSummary,
  onChangeMode,
  onClose,
  onPublish,
  publishing,
  error,
  resolveImageUrl,
  onRegisterPreviewUrl,
}: Props) {
  const t = useTranslations("editor");
  const tPreview = useTranslations("preview");

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

  const editorHandleRef = useRef<TiptapPostcardEditorHandle | null>(null);
  const openLinkPromptRef = useRef<(kind: LinkKind) => void>(() => {});

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
      const photo: DraftPhotoBlock = {
        type: "photo",
        kind,
        blob: result.blob,
      };
      editorHandleRef.current?.insertPhoto(photo);
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
        if (isDraftLinkBlock(result.block)) {
          editorHandleRef.current?.insertLinkCard(result.block);
        }
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
        group: "media",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).run();
          openLinkPromptRef.current("song");
        },
      },
      {
        title: tSlash("video.title"),
        description: tSlash("video.description"),
        keywords: ["video", "youtube", "yt", "clip"],
        group: "media",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).run();
          openLinkPromptRef.current("video");
        },
      },
      {
        title: tSlash("place.title"),
        description: tSlash("place.description"),
        keywords: ["place", "map", "maps", "location", "pin"],
        group: "media",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).run();
          openLinkPromptRef.current("place");
        },
      },
      {
        title: tSlash("link.title"),
        description: tSlash("link.description"),
        keywords: ["link", "article", "url", "web", "page"],
        group: "media",
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).run();
          openLinkPromptRef.current("link");
        },
      },
    ],
    [tSlash]
  );

  const slashItems = useMemo<readonly SlashCommandItem[]>(
    () => [...linkSlashItems, ...formatSlashItems],
    [linkSlashItems, formatSlashItems]
  );

  const empty = blocks.length === 0;
  const canPublish = !empty && !publishing;

  return (
    <div className={preview ? "app paper-grain" : "app"}>
      <ComposerChrome
        step={preview ? 2 : 1}
        total={3}
        title={preview ? tPreview("chromeTitle") : t("chromeTitle")}
        onClose={onClose}
      />

      {/* Mode toggle + addressee */}
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
        <input
          type="text"
          value={to}
          onChange={(e) => onChangeTo(e.target.value)}
          aria-label={t("to")}
          maxLength={80}
          className="t-hand"
          style={{
            fontSize: 19,
            color: "var(--ink)",
            lineHeight: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            padding: 0,
            minWidth: 80,
            flex: "0 1 auto",
            fontFamily: "inherit",
          }}
        />
        <div style={{ flex: 1 }} />
        <ToggleGroup
          type="single"
          value={preview ? "preview" : "edit"}
          onValueChange={(v) => {
            if (v === "edit" || v === "preview") onChangeMode(v === "preview");
          }}
          variant="outline"
          size="sm"
          aria-label={tPreview("modeToggleAria")}
        >
          <ToggleGroupItem value="edit">{tPreview("modeEdit")}</ToggleGroupItem>
          <ToggleGroupItem value="preview" disabled={empty}>
            {tPreview("modePreview")}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Canvas — postcard surface */}
      <div className="no-scrollbar" style={{ flex: 1, overflow: "auto", padding: "12px 14px 8px" }}>
        <div
          style={{
            background: "var(--paper-light)",
            borderRadius: 14,
            border: "1px solid var(--paper-edge)",
            boxShadow: "var(--sh-soft)",
            padding: preview ? "14px 0 24px" : "6px 0 4px",
            minHeight: "60%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {preview ? (
            blocks.map((b, i) => (
              <PostcardBlockView
                key={i}
                block={draftToView(b, i)}
                resolveImageUrl={resolveImageUrl}
              />
            ))
          ) : (
            <>
              <div
                style={{
                  padding: "14px 22px 0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <input
                  type="text"
                  value={title}
                  onChange={(e) => onChangeTitle(e.target.value)}
                  placeholder={t("titlePlaceholder")}
                  aria-label={t("titleAria")}
                  maxLength={200}
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: "var(--ink)",
                    fontFamily: "inherit",
                    fontSize: 22,
                    fontWeight: 600,
                    lineHeight: 1.2,
                    padding: "4px 0",
                    borderBottom: "1px solid transparent",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderBottomColor =
                      "var(--paper-edge)")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderBottomColor = "transparent")
                  }
                />
                {title.length > 0 && (
                  <div
                    style={{
                      alignSelf: "flex-end",
                      fontSize: 10,
                      color:
                        graphemeCount(title) > TITLE_MAX
                          ? "var(--stamp-red)"
                          : "var(--ink-faint)",
                    }}
                  >
                    {graphemeCount(title)}/{TITLE_MAX}
                  </div>
                )}
              </div>
              {empty && (
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

              <div
                style={{
                  position: "relative",
                  padding: "14px 22px 20px",
                  flex: 1,
                }}
              >
                {empty && (
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
                <TiptapPostcardEditor
                  value={blocks}
                  onChange={onChange}
                  slashItems={slashItems}
                  placeholder={empty ? t("placeholderEmpty") : t("placeholderContinue")}
                  resolveImageUrl={resolveImageUrl}
                  removeAriaLabel={t("removeBlockAria")}
                  handleRef={editorHandleRef}
                />
              </div>
            </>
          )}
        </div>

        {!preview && (
          <details
            style={{
              margin: "10px 22px 0",
              fontSize: 13,
              color: "var(--ink)",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontFamily: "inherit",
                color: "var(--ink-mute)",
                padding: "6px 0",
                userSelect: "none",
              }}
            >
              {t("detailsLabel")}
            </summary>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                padding: "8px 0 4px",
              }}
            >
              <label
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                <span style={{ fontSize: 11, color: "var(--ink-mute)" }}>
                  {t("briefLabel")}
                </span>
                <textarea
                  value={brief}
                  onChange={(e) => onChangeBrief(e.target.value)}
                  placeholder={t("briefPlaceholder")}
                  rows={1}
                  maxLength={160}
                  style={{
                    width: "100%",
                    border: "1px solid var(--paper-edge)",
                    borderRadius: 6,
                    background: "var(--paper-light)",
                    color: "var(--ink)",
                    fontFamily: "inherit",
                    fontSize: 13,
                    lineHeight: 1.4,
                    padding: "6px 8px",
                    resize: "vertical",
                  }}
                />
                <span
                  style={{
                    alignSelf: "flex-end",
                    fontSize: 10,
                    color:
                      graphemeCount(brief) > BRIEF_MAX
                        ? "var(--stamp-red)"
                        : "var(--ink-faint)",
                  }}
                >
                  {graphemeCount(brief)}/{BRIEF_MAX}
                </span>
              </label>

              <label
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                <span style={{ fontSize: 11, color: "var(--ink-mute)" }}>
                  {t("summaryLabel")}
                </span>
                <textarea
                  value={summary}
                  onChange={(e) => onChangeSummary(e.target.value)}
                  placeholder={t("summaryPlaceholder")}
                  rows={3}
                  maxLength={600}
                  style={{
                    width: "100%",
                    border: "1px solid var(--paper-edge)",
                    borderRadius: 6,
                    background: "var(--paper-light)",
                    color: "var(--ink)",
                    fontFamily: "inherit",
                    fontSize: 13,
                    lineHeight: 1.45,
                    padding: "6px 8px",
                    resize: "vertical",
                  }}
                />
                <span
                  style={{
                    alignSelf: "flex-end",
                    fontSize: 10,
                    color:
                      graphemeCount(summary) > SUMMARY_MAX
                        ? "var(--stamp-red)"
                        : "var(--ink-faint)",
                  }}
                >
                  {graphemeCount(summary)}/{SUMMARY_MAX}
                </span>
              </label>
            </div>
          </details>
        )}

        {photoError && !preview && (
          <div
            role="alert"
            aria-live="polite"
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
      {!preview && linkPrompt && (
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

      {/* Footer: toolbar (edit) + Share (always) */}
      <div
        style={{
          padding: "6px 10px calc(6px + env(safe-area-inset-bottom))",
          background: "var(--paper)",
          borderTop: "1px solid var(--divider)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flexShrink: 0,
        }}
      >
        {!preview && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              onClick={() => onPickPhoto("uploaded")}
              disabled={photoBusy}
              style={toolBtnStyle()}
              className="focus-visible:ring-2 focus-visible:ring-[var(--inkblue)] focus-visible:outline-none"
              title={t("toolbar.photo")}
              aria-label={t("toolbar.photo")}
            >
              <Icon name="image" size={18} strokeWidth={1.6} />
            </button>
            <button
              type="button"
              onClick={() => openLinkPrompt("song")}
              style={toolBtnStyle()}
              className="focus-visible:ring-2 focus-visible:ring-[var(--inkblue)] focus-visible:outline-none"
              title={t("toolbar.song")}
              aria-label={t("toolbar.song")}
            >
              <Icon name="music" size={18} strokeWidth={1.6} />
            </button>
            <button
              type="button"
              onClick={() => openLinkPrompt("video")}
              style={toolBtnStyle()}
              className="focus-visible:ring-2 focus-visible:ring-[var(--inkblue)] focus-visible:outline-none"
              title={t("toolbar.video")}
              aria-label={t("toolbar.video")}
            >
              <Icon name="play" size={18} strokeWidth={1.6} />
            </button>
            <button
              type="button"
              onClick={() => openLinkPrompt("place")}
              style={toolBtnStyle()}
              className="focus-visible:ring-2 focus-visible:ring-[var(--inkblue)] focus-visible:outline-none"
              title={t("toolbar.place")}
              aria-label={t("toolbar.place")}
            >
              <Icon name="pin" size={18} strokeWidth={1.6} />
            </button>
            <button
              type="button"
              onClick={() => openLinkPrompt("link")}
              style={toolBtnStyle()}
              className="focus-visible:ring-2 focus-visible:ring-[var(--inkblue)] focus-visible:outline-none"
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
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "8px 12px",
              background: "rgba(168,73,60,.10)",
              border: "1px solid var(--stamp-red)",
              borderRadius: 8,
              color: "var(--stamp-red)",
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={preview ? onPublish : () => onChangeMode(true)}
          disabled={preview ? !canPublish : empty}
          style={{
            width: "100%",
            padding: "12px 18px",
            borderRadius: 999,
            background: preview
              ? publishing
                ? "var(--ink-faint)"
                : "var(--terra)"
              : "var(--ink)",
            color: "var(--paper-light)",
            border: "none",
            cursor: (preview ? !canPublish : empty) ? "default" : "pointer",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            opacity: (preview ? !canPublish : empty) ? 0.45 : 1,
            boxShadow: preview && !publishing ? "0 4px 16px rgba(184,99,74,.3)" : undefined,
          }}
        >
          {preview
            ? publishing
              ? tPreview("sending")
              : tPreview("share")
            : t("previewCta")}
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
