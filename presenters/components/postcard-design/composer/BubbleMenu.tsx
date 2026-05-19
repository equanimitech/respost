"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/react";
import { Icon, type IconName } from "../primitives/Icon";

type Coords = { top: number; left: number; flipBelow: boolean };

type BubbleState = {
  coords: Coords | null;
  bold: boolean;
  italic: boolean;
};

const EMPTY: BubbleState = {
  coords: null,
  bold: false,
  italic: false,
};

type Props = {
  editor: Editor | null;
  boldLabel: string;
  italicLabel: string;
};

export function BubbleMenu({ editor, boldLabel, italicLabel }: Props) {
  const [state, setState] = useState<BubbleState>(EMPTY);

  useEffect(() => {
    if (!editor) return;
    const update = () => setState(computeBubbleState(editor));
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    editor.on("focus", update);
    editor.on("blur", update);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    update();
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
      editor.off("focus", update);
      editor.off("blur", update);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [editor]);

  if (!editor || !state.coords) return null;
  if (typeof document === "undefined") return null;

  const { top, left, flipBelow } = state.coords;
  const translateY = flipBelow ? "0%" : "-100%";

  return createPortal(
    <div
      role="toolbar"
      aria-label="Text formatting"
      style={{
        position: "fixed",
        top,
        left,
        transform: `translate(-50%, ${translateY}) translateY(${flipBelow ? 8 : -8}px)`,
        zIndex: 70,
        background: "var(--paper)",
        border: "1px solid var(--paper-edge)",
        borderRadius: 999,
        boxShadow: "var(--sh-card)",
        padding: 4,
        display: "flex",
        gap: 2,
      }}
      // Prevent the click from blurring the editor selection.
      onMouseDown={(e) => e.preventDefault()}
    >
      <BubbleButton
        active={state.bold}
        label={boldLabel}
        icon="bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <BubbleButton
        active={state.italic}
        label={italicLabel}
        icon="italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
    </div>,
    document.body
  );
}

function computeBubbleState(editor: Editor): BubbleState {
  const { state, view, isFocused } = editor;
  const { from, to, empty } = state.selection;
  if (!isFocused || empty) return EMPTY;

  // Only show over real text — skip if selection is purely over atoms (photo,
  // link card) or has no text content.
  let hasText = false;
  state.doc.nodesBetween(from, to, (node) => {
    if (node.isText && node.text && node.text.length > 0) hasText = true;
  });
  if (!hasText) return EMPTY;

  const start = view.coordsAtPos(from);
  const end = view.coordsAtPos(to);
  const left = (start.left + end.left) / 2;
  const flipBelow = start.top < 56;
  const top = flipBelow ? end.bottom : start.top;

  return {
    coords: { top, left, flipBelow },
    bold: editor.isActive("bold"),
    italic: editor.isActive("italic"),
  };
}

type BubbleButtonProps = {
  active: boolean;
  label: string;
  icon: IconName;
  onClick: () => void;
};

function BubbleButton({ active, label, icon, onClick }: BubbleButtonProps): ReactNode {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        borderRadius: 999,
        background: active ? "var(--ink)" : "transparent",
        color: active ? "var(--paper-light)" : "var(--ink-soft)",
        border: "none",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "inherit",
      }}
    >
      <Icon name={icon} size={16} strokeWidth={icon === "bold" ? 2 : 1.6} />
    </button>
  );
}
