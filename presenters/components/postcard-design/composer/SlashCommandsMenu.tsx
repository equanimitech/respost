"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/presenters/components/ui/command";

export type SlashCommandItem = {
  title: string;
  description?: string;
  keywords?: readonly string[];
  group?: string;
  command: (props: {
    editor: import("@tiptap/react").Editor;
    range: { from: number; to: number };
  }) => void;
};

type Props = {
  items: readonly SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
};

export type SlashCommandsMenuHandle = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

type GroupSlice = {
  key: string;
  startIndex: number;
  items: ReadonlyArray<{ item: SlashCommandItem; index: number }>;
};

// Bucket items by their `group` field, preserving order; emits slices with
// stable indices so keyboard nav can address a flat selection model.
function groupItems(items: readonly SlashCommandItem[]): readonly GroupSlice[] {
  const slices: GroupSlice[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const key = item.group ?? "general";
    const last = slices[slices.length - 1];
    if (last && last.key === key) {
      last.items = [...last.items, { item, index: i }];
    } else {
      slices.push({ key, startIndex: i, items: [{ item, index: i }] });
    }
  }
  return slices;
}

const HOVER_LOCK_MS = 250;

export const SlashCommandsMenu = forwardRef<SlashCommandsMenuHandle, Props>(
  function SlashCommandsMenu({ items, command }, ref) {
    const t = useTranslations("slashMenu");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const listRef = useRef<HTMLDivElement | null>(null);
    const hoverLockUntilRef = useRef(0);
    const slices = useMemo(() => groupItems(items), [items]);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    // Keyboard moves should scroll the selected item into view; lock pointer
    // hover for a short window so a static cursor doesn't snap selection back.
    useEffect(() => {
      const root = listRef.current;
      if (!root) return;
      const target = root.querySelector<HTMLElement>(
        `[data-slash-index="${selectedIndex}"]`
      );
      target?.scrollIntoView({ block: "nearest" });
    }, [selectedIndex]);

    const select = (index: number) => {
      const item = items[index];
      if (item) command(item);
    };

    const moveKeyboard = (next: number) => {
      hoverLockUntilRef.current = Date.now() + HOVER_LOCK_MS;
      setSelectedIndex(next);
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (items.length === 0) return false;
        if (event.key === "ArrowUp") {
          moveKeyboard((selectedIndex + items.length - 1) % items.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          moveKeyboard((selectedIndex + 1) % items.length);
          return true;
        }
        if (event.key === "Home") {
          moveKeyboard(0);
          return true;
        }
        if (event.key === "End") {
          moveKeyboard(items.length - 1);
          return true;
        }
        if (event.key === "Enter" || event.key === "Tab") {
          select(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    const activeId = `slash-item-${selectedIndex}`;

    return (
      <Command
        shouldFilter={false}
        className="w-64 border border-border shadow-[var(--sh-card)]"
        aria-activedescendant={items.length > 0 ? activeId : undefined}
      >
        <CommandList ref={listRef} role="listbox">
          <CommandEmpty>{t("noMatches")}</CommandEmpty>
          {slices.map((slice) => (
            <CommandGroup
              key={slice.key}
              heading={
                slice.key === "general" ? undefined : t(`groups.${slice.key}`)
              }
            >
              {slice.items.map(({ item, index }) => {
                const isSelected = index === selectedIndex;
                return (
                  <CommandItem
                    key={item.title}
                    id={`slash-item-${index}`}
                    data-slash-index={index}
                    data-selected={isSelected}
                    aria-selected={isSelected}
                    onPointerMove={() => {
                      if (Date.now() < hoverLockUntilRef.current) return;
                      setSelectedIndex(index);
                    }}
                    onSelect={() => select(index)}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm">{item.title}</span>
                      {item.description ? (
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      ) : null}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    );
  },
);
