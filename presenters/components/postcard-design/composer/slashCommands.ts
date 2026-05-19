"use client";

import { Extension, type Editor } from "@tiptap/react";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, {
  type SuggestionOptions,
  type SuggestionProps,
  type SuggestionKeyDownProps,
} from "@tiptap/suggestion";
import {
  SlashCommandsMenu,
  type SlashCommandItem,
  type SlashCommandsMenuHandle,
} from "./SlashCommandsMenu";

export const FORMAT_COMMAND_KINDS = [
  "bulletList",
  "numberedList",
  "quote",
  "divider",
  "bold",
  "italic",
] as const;

export type FormatCommandKind = (typeof FORMAT_COMMAND_KINDS)[number];

const FORMAT_COMMAND_KEYWORDS: Record<FormatCommandKind, readonly string[]> = {
  bulletList: ["ul", "list", "bullets"],
  numberedList: ["ol", "ordered", "numbers"],
  quote: ["quote", "blockquote", ">"],
  divider: ["hr", "divider", "---"],
  bold: ["b", "strong"],
  italic: ["i", "em"],
};

const FORMAT_COMMAND_ACTIONS: Record<
  FormatCommandKind,
  SlashCommandItem["command"]
> = {
  bulletList: ({ editor, range }) =>
    editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  numberedList: ({ editor, range }) =>
    editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  quote: ({ editor, range }) =>
    editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  divider: ({ editor, range }) =>
    editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  bold: ({ editor, range }) =>
    editor.chain().focus().deleteRange(range).toggleBold().run(),
  italic: ({ editor, range }) =>
    editor.chain().focus().deleteRange(range).toggleItalic().run(),
};

export function buildFormatCommands(
  translate: (kind: FormatCommandKind) => { title: string; description: string }
): readonly SlashCommandItem[] {
  return FORMAT_COMMAND_KINDS.map((kind) => {
    const labels = translate(kind);
    return {
      title: labels.title,
      description: labels.description,
      keywords: [...FORMAT_COMMAND_KEYWORDS[kind]],
      group: "format",
      command: FORMAT_COMMAND_ACTIONS[kind],
    } satisfies SlashCommandItem;
  });
}

function filterItems(
  items: readonly SlashCommandItem[],
  query: string
): SlashCommandItem[] {
  if (!query) return [...items];
  const q = query.toLowerCase();
  return items.filter((item) => {
    if (item.title.toLowerCase().includes(q)) return true;
    return item.keywords?.some((k) => k.toLowerCase().includes(q)) ?? false;
  });
}

type Renderer = ReactRenderer<SlashCommandsMenuHandle>;

function suggestionRenderer(): SuggestionOptions["render"] {
  return () => {
    let renderer: Renderer | null = null;
    let popup: HTMLDivElement | null = null;

    // Position relative to caret rect with floating-ui style flip + shift:
    // flip above when the popup would overflow the viewport bottom; clamp
    // horizontally so it stays inside the viewport.
    const positionPopup = (rect: DOMRect | null) => {
      if (!popup || !rect) return;
      popup.style.position = "fixed";
      popup.style.zIndex = "60";
      // Render off-screen first to measure, then place.
      popup.style.visibility = "hidden";
      popup.style.top = "0px";
      popup.style.left = "0px";
      const { offsetWidth: w, offsetHeight: h } = popup;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 6;
      const spaceBelow = vh - rect.bottom;
      const flipAbove = spaceBelow < h + margin && rect.top > spaceBelow;
      const top = flipAbove
        ? Math.max(margin, rect.top - h - margin)
        : rect.bottom + margin;
      const left = Math.max(margin, Math.min(rect.left, vw - w - margin));
      popup.style.top = `${top}px`;
      popup.style.left = `${left}px`;
      popup.style.visibility = "visible";
    };

    return {
      onStart: (props: SuggestionProps) => {
        renderer = new ReactRenderer(SlashCommandsMenu, {
          props: {
            items: props.items,
            command: (item: SlashCommandItem) =>
              item.command({ editor: props.editor, range: props.range }),
          },
          editor: props.editor,
        });
        popup = document.createElement("div");
        popup.appendChild(renderer.element);
        document.body.appendChild(popup);
        positionPopup(props.clientRect?.() ?? null);
      },
      onUpdate: (props: SuggestionProps) => {
        renderer?.updateProps({
          items: props.items,
          command: (item: SlashCommandItem) =>
            item.command({ editor: props.editor, range: props.range }),
        });
        positionPopup(props.clientRect?.() ?? null);
      },
      onKeyDown: (props: SuggestionKeyDownProps) => {
        if (props.event.key === "Escape") {
          popup?.remove();
          renderer?.destroy();
          renderer = null;
          popup = null;
          return true;
        }
        return renderer?.ref?.onKeyDown({ event: props.event }) ?? false;
      },
      onExit: () => {
        popup?.remove();
        renderer?.destroy();
        renderer = null;
        popup = null;
      },
    };
  };
}

type SlashOptions = {
  items: readonly SlashCommandItem[];
  suggestion: Omit<SuggestionOptions, "editor">;
};

export const SlashCommands = Extension.create<SlashOptions>({
  name: "slashCommands",
  addOptions() {
    return {
      items: [],
      suggestion: {
        char: "/",
        startOfLine: false,
        allowSpaces: false,
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: { from: number; to: number };
          props: SlashCommandItem;
        }) => props.command({ editor, range }),
        items: ({ query }: { query: string }) => filterItems([], query),
        render: suggestionRenderer(),
      },
    };
  },
  addProseMirrorPlugins() {
    const items = this.options.items;
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => filterItems(items, query),
      }),
    ];
  },
});
