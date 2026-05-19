"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
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

export const SlashCommandsMenu = forwardRef<SlashCommandsMenuHandle, Props>(
  function SlashCommandsMenu({ items, command }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    const select = (index: number) => {
      const item = items[index];
      if (item) command(item);
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((i) => (i + items.length - 1) % items.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((i) => (i + 1) % items.length);
          return true;
        }
        if (event.key === "Enter") {
          select(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    return (
      <Command
        shouldFilter={false}
        className="w-64 border border-border shadow-[var(--sh-card)]"
      >
        <CommandList>
          <CommandEmpty>No matches.</CommandEmpty>
          <CommandGroup>
            {items.map((item, index) => (
              <CommandItem
                key={item.title}
                data-selected={index === selectedIndex}
                onPointerMove={() => setSelectedIndex(index)}
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
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    );
  },
);
