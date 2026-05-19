"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSelector } from "@legendapp/state/react";
import {
  deleteDraft,
  drafts$,
  type Draft,
  type DraftId,
} from "@/infrastructure/local/draftStore";

function formatRelative(ts: number, now: number): string {
  const diff = Math.max(0, now - ts);
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return "just now";
  if (diff < hour) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  return `${Math.floor(diff / day)}d ago`;
}

export function DraftsList() {
  const t = useTranslations("drafts");
  const router = useRouter();

  const loaded = useSelector(() => drafts$._state.isLoadedLocal.get());
  const drafts = useSelector(() => {
    const all = Object.values(drafts$.get() ?? {}) as Draft[];
    return [...all].sort((a, b) => b.updatedAt - a.updatedAt);
  });

  const onDelete = (id: DraftId) => {
    if (typeof window !== "undefined" && !window.confirm(t("deleteConfirm"))) {
      return;
    }
    deleteDraft(id);
  };

  const [now] = useState(() => Date.now());

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        padding:
          "20px 18px calc(20px + env(safe-area-inset-bottom))",
        color: "var(--ink)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 22,
        }}
      >
        <Link
          href="/"
          style={{
            color: "var(--ink-mute)",
            textDecoration: "none",
            fontSize: 13,
          }}
        >
          {t("back")}
        </Link>
        <h1
          className="t-serif"
          style={{ fontSize: 22, margin: 0, fontWeight: 500 }}
        >
          {t("title")}
        </h1>
        <Link
          href="/compose"
          style={{
            color: "var(--ink-mute)",
            textDecoration: "underline",
            textUnderlineOffset: 4,
            fontSize: 13,
          }}
        >
          {t("newDraft")}
        </Link>
      </div>

      {!loaded ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--ink-faint)",
            fontSize: 13,
          }}
        >
          …
        </div>
      ) : drafts.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            textAlign: "center",
            padding: "0 24px",
          }}
        >
          <div className="t-serif" style={{ fontSize: 19 }}>
            {t("emptyTitle")}
          </div>
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-mute)",
              lineHeight: 1.5,
              margin: 0,
              maxWidth: 280,
            }}
          >
            {t("emptyHint")}
          </p>
        </div>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {drafts.map((d) => (
            <li
              key={d.id}
              style={{
                background: "var(--paper-light)",
                border: "1px solid var(--paper-edge)",
                borderRadius: 12,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "var(--sh-soft)",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  router.push(`/compose?draft=${encodeURIComponent(d.id)}`)
                }
                style={{
                  flex: 1,
                  background: "transparent",
                  border: 0,
                  padding: 0,
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  color: "var(--ink)",
                }}
              >
                <div
                  className="t-hand"
                  style={{ fontSize: 19, lineHeight: 1.2 }}
                >
                  {d.to || t("noRecipient")}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--ink-faint)",
                    marginTop: 4,
                  }}
                >
                  {d.place ? `${d.place} · ` : ""}
                  {t("lastEdited", { when: formatRelative(d.updatedAt, now) })}
                </div>
              </button>
              <button
                type="button"
                onClick={() => onDelete(d.id)}
                aria-label={t("delete")}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "var(--ink-faint)",
                  cursor: "pointer",
                  fontSize: 12,
                  padding: "6px 8px",
                  fontFamily: "inherit",
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
