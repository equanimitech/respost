import type { MarkdownBlock } from "@/domain/types";
import { MarkdownText } from "../primitives/MarkdownText";

type Props = { block: MarkdownBlock };

export function MarkdownBlockView({ block }: Props) {
  return <MarkdownText md={block.md} />;
}
