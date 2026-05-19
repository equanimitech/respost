import type { MusicBlock } from "@/domain/types";
import { cn } from "@/presenters/lib/utils";
import { OGCard, SERVICE_LABELS } from "./OGCard";

const GRADIENTS: Record<string, string> = {
  a: "linear-gradient(135deg, #3a3328 0%, #5c4a35 60%, #b8634a 100%)",
  b: "linear-gradient(135deg, #4a6378 0%, #2f4456 70%, #d8b88a 100%)",
  c: "linear-gradient(135deg, #7d7647 0%, #a99270 80%, #f4ead4 100%)",
  d: "linear-gradient(135deg, #5a4a3a 0%, #8a6b4a 70%, #c8a878 100%)",
};

type Props = { block: MusicBlock; rot?: number };

export function CardMusic({ block, rot }: Props) {
  const s = SERVICE_LABELS[block.service];
  const gradient = GRADIENTS[block.tone ?? "a"];
  const meta = [block.artist, block.album].filter(Boolean).join(" · ");
  return (
    <OGCard host={s.label} hostDot={s.dot} rot={rot}>
      <div className={cn("flex items-center gap-3.5 p-3.5 @md:gap-5 @md:p-5")}>
        <div
          className={cn(
            "relative size-16 shrink-0 rounded-sm @md:size-20",
            "shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_1px_2px_rgb(0_0_0/0.18)]",
          )}
          style={{ background: gradient }}
        >
          <div
            className={cn(
              "absolute left-1/2 top-1/2 size-5.5 -translate-x-1/2 -translate-y-1/2",
              "rounded-pill border-4 border-double bg-paper-light @md:size-7",
            )}
            style={{ borderColor: "rgba(60,40,20,.18)" }}
          />
        </div>
        <div className={cn("min-w-0 flex-1")}>
          <div
            className={cn(
              "t-sans truncate text-footnote font-semibold leading-tight tracking-tight text-ink",
              "@md:text-body",
            )}
          >
            {block.title}
          </div>
          {meta && (
            <div
              className={cn(
                "t-sans mt-0.5 truncate text-caption text-ink-mute",
                "@md:text-footnote",
              )}
            >
              {meta}
            </div>
          )}
          <div className={cn("mt-2.5 flex items-center gap-2")}>
            <a
              href={block.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "t-sans inline-flex items-center gap-1.5 rounded-pill",
                "border border-paper-edge bg-paper py-1 pl-1.5 pr-2.5",
                "text-caption font-medium text-ink-soft no-underline",
                "@md:text-footnote",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-4 shrink-0 items-center justify-center rounded-pill bg-ink",
                  "@md:size-5",
                )}
              >
                <svg width="7" height="7" viewBox="0 0 12 12" aria-hidden>
                  <path d="M3.5 2L10 6 3.5 10z" fill="var(--paper-light)" />
                </svg>
              </span>
              {block.dur ? `${block.dur} · ` : ""}open
            </a>
          </div>
        </div>
      </div>
    </OGCard>
  );
}
