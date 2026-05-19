// Pure functional helpers for the composer draft state.
// All operations return a new array; the input is never mutated.

import type { DraftBlock } from "@/application/actions/publishPostcard";

export function appendBlock(
  blocks: ReadonlyArray<DraftBlock>,
  block: DraftBlock
): ReadonlyArray<DraftBlock> {
  return [...blocks, block];
}

export function insertBlockAt(
  blocks: ReadonlyArray<DraftBlock>,
  index: number,
  block: DraftBlock
): ReadonlyArray<DraftBlock> {
  const i = Math.max(0, Math.min(index, blocks.length));
  return [...blocks.slice(0, i), block, ...blocks.slice(i)];
}

export function removeBlockAt(
  blocks: ReadonlyArray<DraftBlock>,
  index: number
): ReadonlyArray<DraftBlock> {
  if (index < 0 || index >= blocks.length) return blocks;
  return [...blocks.slice(0, index), ...blocks.slice(index + 1)];
}

export function moveBlock(
  blocks: ReadonlyArray<DraftBlock>,
  from: number,
  to: number
): ReadonlyArray<DraftBlock> {
  if (from === to || from < 0 || from >= blocks.length) return blocks;
  const next = [...blocks];
  const [removed] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(to, next.length)), 0, removed);
  return next;
}

export function updateBlockAt(
  blocks: ReadonlyArray<DraftBlock>,
  index: number,
  patch: Partial<DraftBlock>
): ReadonlyArray<DraftBlock> {
  if (index < 0 || index >= blocks.length) return blocks;
  const current = blocks[index];
  // Type-safe shallow merge: the patch must be of the same discriminant.
  if (patch.type && patch.type !== current.type) return blocks;
  const merged = { ...current, ...patch } as DraftBlock;
  return [...blocks.slice(0, index), merged, ...blocks.slice(index + 1)];
}

export function updateMarkdownAt(
  blocks: ReadonlyArray<DraftBlock>,
  index: number,
  md: string
): ReadonlyArray<DraftBlock> {
  const b = blocks[index];
  if (!b || b.type !== "md") return blocks;
  return updateBlockAt(blocks, index, { type: "md", md });
}
