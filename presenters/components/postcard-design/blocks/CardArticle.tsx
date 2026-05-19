import type { ArticleBlock } from "@/domain/types";
import { cn } from "@/presenters/lib/utils";
import { Photo } from "../primitives/Photo";
import { OGCard } from "./OGCard";

type Props = { block: ArticleBlock; rot?: number };

export function CardArticle({ block, rot = -0.4 }: Props) {
  return (
    <OGCard host={block.host} hostDot="var(--ink-mute)" rot={rot}>
      <a
        href={block.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("flex text-inherit no-underline")}
      >
        <Photo
          kind={block.imageKind ?? "window"}
          src={block.imageUrl}
          className={cn("size-26 shrink-0 @md:size-32")}
        />
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col justify-center gap-1",
            "px-3.5 py-3 @md:px-5 @md:py-4",
          )}
        >
          <div
            className={cn(
              "t-sans line-clamp-2 text-footnote font-semibold leading-snug",
              "tracking-tight text-ink @md:text-body",
            )}
          >
            {block.title}
          </div>
          {block.excerpt && (
            <div
              className={cn(
                "t-sans line-clamp-2 text-caption leading-snug text-ink-mute",
                "@md:text-footnote",
              )}
            >
              {block.excerpt}
            </div>
          )}
        </div>
      </a>
    </OGCard>
  );
}
