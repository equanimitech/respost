"use client";

import { useEffect, useRef, useState } from "react";
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
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    onContinue(trimmed);
  };

  return (
    <div className="app">
      <ComposerChrome step={0} total={3} title="addressed to · 1/3" onClose={onClose} />
      <div style={{ padding: "32px 28px 0", flex: 1 }}>
        <div className="t-serif" style={{ fontSize: 26, fontWeight: 500, lineHeight: 1.15 }}>
          Who is this <br />
          postcard for?
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
          Just a name — they&apos;ll see it on the envelope. No contacts, no accounts.
        </div>

        <div style={{ marginTop: 40, position: "relative" }}>
          <div
            className="t-mono"
            style={{
              fontSize: 9,
              letterSpacing: 1.8,
              color: "var(--ink-mute)",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            To
          </div>
          <div
            style={{
              padding: "6px 0 12px",
              borderBottom: "1.5px solid var(--ink-faint)",
            }}
          >
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder="mom"
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
            Nicknames are good. So is &quot;mãe&quot; or &quot;you in 10 years&quot;.
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
              recent
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
          Continue →
        </button>
      </div>
    </div>
  );
}
