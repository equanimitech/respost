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

const SLASH_COMMANDS: readonly SlashCommandItem[] = [
  {
    title: "Bullet list",
    description: "Unordered list",
    keywords: ["ul", "list", "bullets"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: "Numbered list",
    description: "Ordered list",
    keywords: ["ol", "ordered", "numbers"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: "Quote",
    description: "Blockquote",
    keywords: ["quote", "blockquote", ">"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: "Divider",
    description: "Horizontal rule",
    keywords: ["hr", "divider", "---"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    title: "Bold",
    description: "Toggle bold",
    keywords: ["b", "strong"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBold().run(),
  },
  {
    title: "Italic",
    description: "Toggle italic",
    keywords: ["i", "em"],
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleItalic().run(),
  },
];

function filterItems(query: string): SlashCommandItem[] {
  if (!query) return [...SLASH_COMMANDS];
  const q = query.toLowerCase();
  return SLASH_COMMANDS.filter((item) => {
    if (item.title.toLowerCase().includes(q)) return true;
    return item.keywords?.some((k) => k.toLowerCase().includes(q)) ?? false;
  });
}

type Renderer = ReactRenderer<SlashCommandsMenuHandle>;

function suggestionRenderer(): SuggestionOptions["render"] {
  return () => {
    let renderer: Renderer | null = null;
    let popup: HTMLDivElement | null = null;

    const positionPopup = (rect: DOMRect | null) => {
      if (!popup || !rect) return;
      popup.style.position = "fixed";
      popup.style.top = `${rect.bottom + 6}px`;
      popup.style.left = `${rect.left}px`;
      popup.style.zIndex = "60";
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
  suggestion: Omit<SuggestionOptions, "editor">;
};

export const SlashCommands = Extension.create<SlashOptions>({
  name: "slashCommands",
  addOptions() {
    return {
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
        items: ({ query }: { query: string }) => filterItems(query),
        render: suggestionRenderer(),
      },
    };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
