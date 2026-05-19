"use client";

import {
  useEditor,
  EditorContent,
  type Editor,
  type JSONContent,
} from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type Ref,
} from "react";
import type { Node as PMNode } from "@tiptap/pm/model";
import type {
  DraftBlock,
  DraftLinkBlock,
  DraftPhotoBlock,
} from "@/application/composer/draftBlock";
import {
  docToDraftBlocks,
  draftBlocksToDocJson,
  linkCardDraftToNodeJson,
  photoDraftToNodeJson,
} from "@/application/composer/editorMapping";
import { createBlockId } from "@/domain/value-objects/blocks";
import { SlashCommands } from "./slashCommands";
import type { SlashCommandItem } from "./SlashCommandsMenu";
import { PhotoNode } from "./nodes/PhotoNode";
import { LinkCardNode } from "./nodes/LinkCardNode";
import {
  EditorBlockContext,
  type EditorBlockCtx,
} from "./nodes/EditorBlockContext";

export type TiptapPostcardEditorHandle = {
  insertPhoto: (photo: DraftPhotoBlock) => void;
  insertLinkCard: (block: DraftLinkBlock) => void;
};

type Props = {
  value: ReadonlyArray<DraftBlock>;
  onChange: (next: ReadonlyArray<DraftBlock>) => void;
  placeholder?: string;
  slashItems?: readonly SlashCommandItem[];
  resolveImageUrl?: (ref: string) => string | undefined;
  removeAriaLabel: string;
  autoFocus?: boolean;
  handleRef?: Ref<TiptapPostcardEditorHandle>;
};

function blocksKey(blocks: ReadonlyArray<DraftBlock>): string {
  return JSON.stringify(blocks);
}

export function TiptapPostcardEditor({
  value,
  onChange,
  placeholder,
  slashItems,
  resolveImageUrl,
  removeAriaLabel,
  autoFocus,
  handleRef,
}: Props) {
  const lastEmittedRef = useRef<string>(blocksKey([]));
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

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
      PhotoNode,
      LinkCardNode,
    ],
    content: { type: "doc", content: [{ type: "paragraph" }] } as JSONContent,
    autofocus: autoFocus ? "end" : false,
    onUpdate: ({ editor }) => {
      const md = markdownStorage(editor);
      const next = docToDraftBlocks(editor.state.doc, editor.schema, md.serializer);
      const key = blocksKey(next);
      if (key === lastEmittedRef.current) return;
      lastEmittedRef.current = key;
      onChangeRef.current(next);
    },
  });

  // Sync incoming value → editor content when it diverges from last emitted.
  useEffect(() => {
    if (!editor) return;
    const key = blocksKey(value);
    if (key === lastEmittedRef.current) return;
    lastEmittedRef.current = key;
    const md = markdownStorage(editor);
    const doc = draftBlocksToDocJson(value, md.parser, editor.schema);
    editor.commands.setContent(doc, { emitUpdate: false });
  }, [value, editor]);

  // Expose imperative insert helpers.
  useImperativeHandle(
    handleRef,
    () => ({
      insertPhoto: (photo: DraftPhotoBlock) => {
        if (!editor) return;
        const node = photoDraftToNodeJson({
          ...photo,
          id: photo.id ?? createBlockId(),
        });
        insertAtomAtCaret(editor, node);
      },
      insertLinkCard: (block: DraftLinkBlock) => {
        if (!editor) return;
        const withId = { ...block, id: block.id ?? createBlockId() } as DraftLinkBlock;
        const node = linkCardDraftToNodeJson(withId);
        insertAtomAtCaret(editor, node);
      },
    }),
    [editor]
  );

  const ctx = useMemo<EditorBlockCtx>(
    () => ({ resolveImageUrl, removeAriaLabel }),
    [resolveImageUrl, removeAriaLabel]
  );

  return (
    <EditorBlockContext.Provider value={ctx}>
      <div className="tiptap-prose">
        <EditorContent editor={editor} />
      </div>
    </EditorBlockContext.Provider>
  );
}

type MarkdownStorageShape = {
  parser: { parse: (md: string) => string };
  serializer: { serialize: (n: PMNode) => string };
};

function markdownStorage(editor: Editor): MarkdownStorageShape {
  const storage = editor.storage as unknown as {
    markdown: MarkdownStorageShape;
  };
  return storage.markdown;
}

function insertAtomAtCaret(editor: Editor, atom: JSONContent) {
  editor
    .chain()
    .focus()
    .insertContent([atom, { type: "paragraph" }])
    .run();
}
