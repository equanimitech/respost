"use client";

import {
  Node,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import type { PhotoBlock, BlockId, PhotoKind } from "@/domain/types";
import {
  createBlockId,
  freezePhotoRotation,
} from "@/domain/value-objects/blocks";
import { PhotoBlockView } from "../../blocks/PhotoBlockView";
import { BlockNodeView, makeDeleteHandler } from "./BlockNodeView";
import { useEditorBlockCtx } from "./EditorBlockContext";
import type { PhotoNodeAttrs } from "@/application/composer/editorMapping";

function PhotoNodeView(props: NodeViewProps) {
  const { resolveImageUrl } = useEditorBlockCtx();
  const attrs = props.node.attrs as PhotoNodeAttrs;
  const id = (attrs.id ?? createBlockId()) as BlockId;
  const rot = attrs.rot ?? freezePhotoRotation(id);
  const block: PhotoBlock = {
    type: "photo",
    id,
    kind: attrs.kind as PhotoKind,
    image: attrs.blobRef
      ? { ref: attrs.blobRef, mimeType: attrs.mimeType ?? "image/jpeg" }
      : undefined,
    caption: attrs.caption ?? undefined,
    rot,
  };
  const url = attrs.blobRef ? resolveImageUrl?.(attrs.blobRef) : undefined;
  return (
    <BlockNodeView onDelete={makeDeleteHandler(props)}>
      <PhotoBlockView block={block} imageUrl={url} />
    </BlockNodeView>
  );
}

export const PhotoNode = Node.create({
  name: "photoBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      id: { default: null },
      kind: { default: "uploaded" },
      blobRef: { default: null },
      mimeType: { default: null },
      blobSize: { default: null },
      caption: { default: null },
      rot: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-photo-block]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, "data-photo-block": "" }];
  },
  addNodeView() {
    return ReactNodeViewRenderer(PhotoNodeView);
  },
});
