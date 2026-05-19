"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import type { ReactNode } from "react";
import { useEditorBlockCtx } from "./EditorBlockContext";

type Props = {
  children: ReactNode;
  onDelete: () => void;
};

export function BlockNodeView({ children, onDelete }: Props) {
  const { removeAriaLabel } = useEditorBlockCtx();
  return (
    <NodeViewWrapper
      as="div"
      contentEditable={false}
      style={{ position: "relative" }}
    >
      {children}
      <button
        type="button"
        onClick={onDelete}
        aria-label={removeAriaLabel}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "rgba(60,40,20,.6)",
          color: "var(--paper-light)",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: 14,
          lineHeight: 1,
          zIndex: 2,
        }}
      >
        ×
      </button>
    </NodeViewWrapper>
  );
}

export function makeDeleteHandler(props: NodeViewProps): () => void {
  return () => {
    const { editor, getPos } = props;
    const pos = getPos();
    if (typeof pos !== "number") return;
    editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + props.node.nodeSize })
      .run();
  };
}
