"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useQueryStates,
  parseAsString,
  parseAsStringEnum,
  parseAsJson,
} from "nuqs";
import {
  publishPostcard,
  type DraftBlock,
} from "@/application/actions/publishPostcard";
import { ComposerRecipient } from "../composer/ComposerRecipient";
import { ComposerEditor } from "../composer/ComposerEditor";
import { ComposerPreview } from "../composer/ComposerPreview";
import { draftBlocksSchema } from "./draftSchema";

const STEPS = ["recipient", "editor", "preview"] as const;
type Step = (typeof STEPS)[number];

const blocksParser = parseAsJson<ReadonlyArray<DraftBlock>>((v) => {
  const parsed = draftBlocksSchema.safeParse(v);
  return parsed.success ? parsed.data : null;
}).withDefault([]);

const composerParsers = {
  to: parseAsString.withDefault(""),
  from: parseAsString.withDefault(""),
  place: parseAsString.withDefault(""),
  step: parseAsStringEnum<Step>([...STEPS]).withDefault("recipient"),
  blocks: blocksParser,
};

type Props = {
  defaultSender: string;
  defaultPlace?: string;
};

export function ComposerFlow({ defaultSender, defaultPlace }: Props) {
  const router = useRouter();

  const [state, setState] = useQueryStates(composerParsers, {
    history: "replace",
    clearOnDefault: true,
  });
  const { to, step, blocks } = state;

  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // refLink → local objectUrl, so freshly uploaded photos render in
  // the composer (the PDS blob URL is only available after publish).
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const registerPreviewUrl = useCallback((refLink: string, url: string) => {
    setPreviewUrls((prev) => ({ ...prev, [refLink]: url }));
  }, []);
  const resolveImageUrl = useCallback(
    (ref: string) => previewUrls[ref],
    [previewUrls]
  );

  // Seed sender / place from env defaults if absent in URL.
  // If blocks are already present (e.g. MCP deep-link) and no step was set,
  // jump to editor.
  useEffect(() => {
    const patch: Partial<typeof state> = {};
    if (!state.from) patch.from = defaultSender;
    if (defaultPlace && !state.place) patch.place = defaultPlace;
    if (state.blocks.length > 0 && state.step === "recipient" && state.to) {
      patch.step = "editor";
    }
    if (Object.keys(patch).length > 0) setState(patch);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearDraft = () =>
    setState({ to: "", from: "", place: "", step: "recipient", blocks: [] });

  const close = () => {
    router.push("/");
  };

  const onContinueRecipient = (next: string) => {
    setState({ to: next, step: "editor" });
  };

  const onChangeBlocks = (next: ReadonlyArray<DraftBlock>) => {
    setState({ blocks: next });
  };

  const onPublish = async () => {
    setPublishing(true);
    setError(null);
    try {
      const result = await publishPostcard({
        to,
        from: state.from,
        place: state.place || undefined,
        blocks,
      });
      if (result.success === true) {
        clearDraft();
        router.push(
          `/sent/${result.rkey}?url=${encodeURIComponent(
            result.url
          )}&to=${encodeURIComponent(to)}`
        );
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  if (!hydrated) return null;

  if (step === "recipient") {
    return (
      <ComposerRecipient
        initialValue={to}
        onContinue={onContinueRecipient}
        onClose={close}
      />
    );
  }

  if (step === "editor") {
    return (
      <ComposerEditor
        to={to}
        blocks={blocks}
        onChange={onChangeBlocks}
        onChangeRecipient={() => setState({ step: "recipient" })}
        onClose={close}
        onPreview={() => setState({ step: "preview" })}
        resolveImageUrl={resolveImageUrl}
        onRegisterPreviewUrl={registerPreviewUrl}
      />
    );
  }

  return (
    <ComposerPreview
      to={to}
      blocks={blocks}
      onBack={() => setState({ step: "editor" })}
      onPublish={onPublish}
      publishing={publishing}
      error={error}
      onClose={close}
      resolveImageUrl={resolveImageUrl}
    />
  );
}
