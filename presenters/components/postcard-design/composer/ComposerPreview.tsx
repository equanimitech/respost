"use client";

import { useTranslations } from "next-intl";
import type { DraftBlock } from "@/application/composer/draftBlock";
import type { Block, BlockId, PhotoBlock, PhotoKind } from "@/domain/types";
import { PostcardBlockView } from "../blocks/PostcardBlockView";
import { ComposerChrome } from "./ComposerChrome";

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

type Props = {
  to: string;
  blocks: ReadonlyArray<DraftBlock>;
  onBack: () => void;
  onPublish: () => void;
  publishing: boolean;
  error?: string | null;
  onClose?: () => void;
  resolveImageUrl?: (ref: string) => string | undefined;
};

export function ComposerPreview({
  to,
  blocks,
  onBack,
  onPublish,
  publishing,
  error,
  onClose,
  resolveImageUrl,
}: Props) {
  const t = useTranslations("preview");
  return (
    <div className="app paper-grain">
      <ComposerChrome step={2} total={3} title={t("chromeTitle")} onClose={onClose} />

      <div style={{ padding: "8px 22px 12px", textAlign: "center", flexShrink: 0 }}>
        <div className="t-serif" style={{ fontSize: 17, fontWeight: 500 }}>
          {t("header", { to })}
        </div>
        <div
          className="t-mono"
          style={{
            fontSize: 9,
            letterSpacing: 1.5,
            color: "var(--ink-mute)",
            textTransform: "uppercase",
            marginTop: 4,
          }}
        >
          {t("subheader")}
        </div>
      </div>

      <div
        className="no-scrollbar"
        style={{
          flex: 1,
          overflow: "auto",
          background: "var(--paper-light)",
          margin: "0 18px",
          borderRadius: "10px 10px 0 0",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.5), 0 -4px 14px rgba(40,30,20,.08)",
          border: "1px solid var(--paper-edge)",
          borderBottom: "none",
        }}
      >
        <div style={{ padding: "14px 0 24px" }}>
          {blocks.map((b, i) => (
            <PostcardBlockView key={i} block={draftToView(b, i)} resolveImageUrl={resolveImageUrl} />
          ))}
        </div>
      </div>

      <div
        style={{
          padding: "14px 22px calc(22px + env(safe-area-inset-bottom))",
          background: "var(--paper)",
          borderTop: "1px solid var(--divider)",
        }}
      >
        {error && (
          <div
            style={{
              marginBottom: 10,
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
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={onBack}
            disabled={publishing}
            style={{
              padding: "14px 18px",
              borderRadius: 999,
              background: "var(--paper-light)",
              color: "var(--ink-soft)",
              border: "1px solid var(--paper-edge)",
              cursor: publishing ? "default" : "pointer",
              fontFamily: "inherit",
              fontSize: 14,
            }}
          >
            {t("back")}
          </button>
          <button
            type="button"
            onClick={onPublish}
            disabled={publishing}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 999,
              background: publishing ? "var(--ink-faint)" : "var(--terra)",
              color: "var(--paper-light)",
              border: "none",
              cursor: publishing ? "default" : "pointer",
              fontFamily: "inherit",
              fontSize: 15,
              fontWeight: 600,
              boxShadow: "0 4px 16px rgba(184,99,74,.3)",
            }}
          >
            {publishing ? t("sending") : t("share")}
          </button>
        </div>
      </div>
    </div>
  );
}
