import type { Block } from "@/domain/types";
import { MarkdownBlockView } from "./MarkdownBlockView";
import { PhotoBlockView } from "./PhotoBlockView";
import { CardMusic } from "./CardMusic";
import { CardVideo } from "./CardVideo";
import { CardPlace } from "./CardPlace";
import { CardArticle } from "./CardArticle";

type Props = {
  block: Block;
  resolveImageUrl?: (ref: string) => string;
};

/**
 * Render any block. The viewer page passes `resolveImageUrl` (server-built
 * blob URL) so photo blocks display real images.
 */
export function PostcardBlockView({ block, resolveImageUrl }: Props) {
  switch (block.type) {
    case "md":
      return <MarkdownBlockView block={block} />;
    case "photo": {
      const url = block.image && resolveImageUrl
        ? resolveImageUrl(block.image.ref)
        : undefined;
      return <PhotoBlockView block={block} imageUrl={url} />;
    }
    case "music":
      return <CardMusic block={block} />;
    case "video":
      return <CardVideo block={block} />;
    case "place":
      return <CardPlace block={block} />;
    case "article":
      return <CardArticle block={block} />;
  }
}
