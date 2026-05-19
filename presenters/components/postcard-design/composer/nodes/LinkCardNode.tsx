"use client";

import {
  Node,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import type {
  ArticleBlock,
  BlockId,
  MusicBlock,
  PlaceBlock,
  VideoBlock,
} from "@/domain/types";
import { createBlockId, parseOgHost } from "@/domain/value-objects/blocks";
import { CardMusic } from "../../blocks/CardMusic";
import { CardVideo } from "../../blocks/CardVideo";
import { CardPlace } from "../../blocks/CardPlace";
import { CardArticle } from "../../blocks/CardArticle";
import { BlockNodeView, makeDeleteHandler } from "./BlockNodeView";
import {
  PLACEHOLDER_TITLES,
  placeholderMusic,
  placeholderVideo,
} from "@/application/composer/draftBlockFactories";
import type { LinkCardAttrs } from "@/application/composer/editorMapping";

function LinkCardNodeView(props: NodeViewProps) {
  const attrs = props.node.attrs as LinkCardAttrs;
  const { kind, url, data } = attrs;
  const onDelete = makeDeleteHandler(props);
  const id = (attrs.id ?? createBlockId()) as BlockId;
  const host = parseOgHost(url) ?? url;

  switch (kind) {
    case "music": {
      const fallback = placeholderMusic(url);
      const block: MusicBlock = {
        type: "music",
        id,
        url,
        service: (data.service as MusicBlock["service"]) ?? fallback.service,
        title: (data.title as string) ?? fallback.title,
        artist: data.artist as string | undefined,
        album: data.album as string | undefined,
        dur: data.dur as string | undefined,
        tone: data.tone as MusicBlock["tone"],
      };
      return (
        <BlockNodeView onDelete={onDelete}>
          <CardMusic block={block} />
        </BlockNodeView>
      );
    }
    case "video": {
      const fallback = placeholderVideo(url, host);
      const block: VideoBlock = {
        type: "video",
        id,
        url,
        service: (data.service as VideoBlock["service"]) ?? fallback.service,
        title: (data.title as string) ?? fallback.title,
        channel: (data.channel as string | undefined) ?? fallback.channel,
        dur: data.dur as string | undefined,
        thumbUrl: data.thumbUrl as string | undefined,
      };
      return (
        <BlockNodeView onDelete={onDelete}>
          <CardVideo block={block} />
        </BlockNodeView>
      );
    }
    case "place": {
      const block: PlaceBlock = {
        type: "place",
        id,
        url,
        name: (data.name as string) ?? PLACEHOLDER_TITLES.place,
        addr: (data.addr as string | undefined) ?? host,
        caption: data.caption as string | undefined,
        latitude: data.latitude as number | undefined,
        longitude: data.longitude as number | undefined,
      };
      return (
        <BlockNodeView onDelete={onDelete}>
          <CardPlace block={block} />
        </BlockNodeView>
      );
    }
    case "article": {
      const block: ArticleBlock = {
        type: "article",
        id,
        url,
        host: (data.host as string) ?? host,
        title: (data.title as string) ?? PLACEHOLDER_TITLES.article,
        excerpt: data.excerpt as string | undefined,
        imageUrl: data.imageUrl as string | undefined,
      };
      return (
        <BlockNodeView onDelete={onDelete}>
          <CardArticle block={block} />
        </BlockNodeView>
      );
    }
  }
}

export const LinkCardNode = Node.create({
  name: "linkCardBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      id: { default: null },
      kind: { default: "article" },
      url: { default: "" },
      data: { default: {} },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-link-card-block]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, "data-link-card-block": "" }];
  },
  addNodeView() {
    return ReactNodeViewRenderer(LinkCardNodeView);
  },
});
