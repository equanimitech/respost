import type { VideoBlock } from "@/domain/types";
import { cn } from "@/presenters/lib/utils";
import { Photo } from "../primitives/Photo";
import { OGCard, SERVICE_LABELS } from "./OGCard";

type Props = { block: VideoBlock; rot?: number };

export function CardVideo({ block, rot = 0.8 }: Props) {
  const s = SERVICE_LABELS[block.service];
  return (
    <OGCard host={s.label} hostDot={s.dot} rot={rot}>
      <a
        href={block.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("block text-inherit no-underline")}
      >
        <div className={cn("relative")}>
          <Photo
            kind={block.thumbKind ?? "street"}
            src={block.thumbUrl}
            className={cn("aspect-video w-full")}
          />
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              "bg-gradient-to-b from-transparent from-40% to-black/35",
            )}
          >
            <div
              className={cn(
                "flex size-13 items-center justify-center rounded-pill bg-white/95",
                "shadow-[0_2px_8px_rgb(0_0_0/0.25)] @md:size-16",
              )}
            >
              <svg
                className={cn("size-4.5 @md:size-6")}
                viewBox="0 0 12 12"
                aria-hidden
              >
                <path d="M3.5 2L10 6 3.5 10z" fill="var(--ink)" />
              </svg>
            </div>
          </div>
          {block.dur && (
            <div
              className={cn(
                "t-mono tabular absolute bottom-2 right-2 rounded-xs",
                "bg-black/75 px-1.5 py-0.5 text-caption2 leading-none",
                "tracking-wide text-white",
              )}
            >
              {block.dur}
            </div>
          )}
        </div>
        <div className={cn("px-3.5 pt-3 pb-3.5 @md:px-5 @md:pt-4 @md:pb-5")}>
          <div
            className={cn(
              "t-sans line-clamp-2 text-footnote font-semibold leading-snug",
              "tracking-tight text-ink @md:text-body",
            )}
          >
            {block.title}
          </div>
          {block.channel && (
            <div
              className={cn(
                "t-sans mt-1 text-caption text-ink-mute @md:text-footnote",
              )}
            >
              {block.channel}
            </div>
          )}
        </div>
      </a>
    </OGCard>
  );
}
