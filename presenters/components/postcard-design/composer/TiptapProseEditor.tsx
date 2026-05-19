"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Markdown, type MarkdownStorage } from "tiptap-markdown";
import { useEffect, useRef } from "react";
import { SlashCommands } from "./slashCommands";
import type { SlashCommandItem } from "./SlashCommandsMenu";

type Props = {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  slashItems?: readonly SlashCommandItem[];
};

export function TiptapProseEditor({
  value,
  onChange,
  placeholder,
  autoFocus,
  slashItems,
}: Props) {
  const lastEmittedRef = useRef(value);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        link: { openOnClick: false },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "",
      }),
      SlashCommands.configure({
        items: slashItems ?? [],
      }),
      Markdown.configure({
        html: false,
        tightLists: true,
        breaks: true,
        transformPastedText: true,
      }),
    ],
    content: value,
    autofocus: autoFocus ? "end" : false,
    onUpdate: ({ editor }) => {
      const storage = editor.storage as unknown as { markdown: MarkdownStorage };
      const md = storage.markdown.getMarkdown();
      lastEmittedRef.current = md;
      onChange(md);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value === lastEmittedRef.current) return;
    lastEmittedRef.current = value;
    editor.commands.setContent(value, { emitUpdate: false });
  }, [value, editor]);

  return (
    <div className="tiptap-prose">
      <EditorContent editor={editor} />
    </div>
  );
}
