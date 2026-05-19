"use client";

import { createContext, useContext } from "react";

export type EditorBlockCtx = {
  resolveImageUrl?: (ref: string) => string | undefined;
  removeAriaLabel: string;
};

export const EditorBlockContext = createContext<EditorBlockCtx>({
  removeAriaLabel: "Remove block",
});

export function useEditorBlockCtx(): EditorBlockCtx {
  return useContext(EditorBlockContext);
}
