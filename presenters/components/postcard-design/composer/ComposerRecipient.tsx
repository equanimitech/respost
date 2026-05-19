"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ComposerChrome } from "./ComposerChrome";

type Props = {
  initialValue: string;
  recents?: ReadonlyArray<string>;
  onContinue: (to: string) => void;
  onClose?: () => void;
};

export function ComposerRecipient({
  initialValue,
  recents = [],
  onContinue,
  onClose,
}: Props) {
  const t = useTranslations("recipient");
  const [value, setValue] = useState(initialValue);

  const submit = () => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    onContinue(trimmed);
  };

  return (
    <div className="app">
      <ComposerChrome step={0} total={3} title={t("chromeTitle")} onClose={onClose} />
      <div style={{ padding: "32px 28px 0", flex: 1 }}>
        <div className="t-serif" style={{ fontSize: 26, fontWeight: 500, lineHeight: 1.15 }}>
          {t("question")}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--ink-mute)",
            marginTop: 10,
            lineHeight: 1.5,
            maxWidth: 280,
          }}
        >
          {t("hint")}
        </div>

        <div style={{ marginTop: 40, position: "relative" }}>
          <label
            htmlFor="composer-to"
            className="t-mono"
            style={{
              fontSize: 9,
              letterSpacing: 1.8,
              color: "var(--ink-mute)",
              textTransform: "uppercase",
              marginBottom: 4,
              display: "block",
            }}
          >
            {t("label")}
          </label>
          <div
            style={{
              padding: "6px 0 12px",
              borderBottom: "1.5px solid var(--ink-faint)",
            }}
          >
            <input
              id="composer-to"
              name="to"
              autoComplete="off"
              spellCheck={false}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder={t("placeholder")}
              className="t-hand"
              style={{
                fontSize: 38,
                color: "var(--ink)",
                lineHeight: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                width: "100%",
                fontFamily: "var(--font-hand), cursive",
              }}
            />
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              marginTop: 8,
              lineHeight: 1.5,
            }}
          >
            {t("hintNicknames")}
          </div>
        </div>

        {recents.length > 0 && (
          <div style={{ marginTop: 36 }}>
            <div
              className="t-mono"
              style={{
                fontSize: 9,
                letterSpacing: 1.5,
                color: "var(--ink-mute)",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              {t("recent")}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {recents.map((n, i) => (
                <button
                  key={n + i}
                  type="button"
                  onClick={() => setValue(n)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    background: value === n ? "rgba(184,99,74,.10)" : "var(--paper-light)",
                    border: `1px solid ${value === n ? "var(--terra)" : "var(--paper-edge)"}`,
                    color: value === n ? "var(--terra-deep)" : "var(--ink-soft)",
                    fontFamily: "var(--font-serif-display), serif",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          padding: "12px 22px calc(22px + env(safe-area-inset-bottom))",
          background: "var(--paper)",
          borderTop: "1px solid var(--divider)",
        }}
      >
        <button
          type="button"
          onClick={submit}
          disabled={value.trim().length === 0}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 999,
            background: value.trim().length === 0 ? "var(--ink-faint)" : "var(--ink)",
            color: "var(--paper-light)",
            border: "none",
            cursor: value.trim().length === 0 ? "default" : "pointer",
            fontFamily: "inherit",
            fontSize: 15,
            fontWeight: 600,
            opacity: value.trim().length === 0 ? 0.5 : 1,
          }}
        >
          {t("continue")}
        </button>
      </div>
    </div>
  );
}
