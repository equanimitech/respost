"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { when } from "@legendapp/state";
import { decodeProposePayload } from "@/application/composer/composeUrl";
import {
  createDraft,
  deleteDraft,
  drafts$,
  getDraft,
  saveDraft,
  type DraftId,
} from "@/infrastructure/local/draftStore";
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
  draft: parseAsString.withDefault(""),
  propose: parseAsString.withDefault(""),
};

type Props = {
  defaultSender: string;
  defaultPlace?: string;
};

export function ComposerFlow({ defaultSender, defaultPlace }: Props) {
  const router = useRouter();
  const t = useTranslations("editor");

  const [state, setState] = useQueryStates(composerParsers, {
    history: "replace",
    clearOnDefault: true,
  });
  const { to, step, blocks } = state;

  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Authoritative draft id ref. URL state is mirrored; the ref
  // wins for write-side decisions because URL updates are async.
  const draftIdRef = useRef<DraftId | "">("");

  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const registerPreviewUrl = useCallback((refLink: string, url: string) => {
    setPreviewUrls((prev) => ({ ...prev, [refLink]: url }));
  }, []);
  const resolveImageUrl = useCallback(
    (ref: string) => previewUrls[ref],
    [previewUrls]
  );

  // ─── Mount: decode ?propose= or load ?draft= ────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Wait for IndexedDB to hydrate before reading or minting drafts.
      await when(drafts$._state.isLoadedLocal);
      if (cancelled) return;

      const patch: Partial<typeof state> = {};

      if (state.propose) {
        const decoded = decodeProposePayload(state.propose);
        if (decoded) {
          const created = createDraft({
            to: decoded.to,
            from: decoded.from ?? defaultSender,
            place: decoded.place ?? defaultPlace,
            blocks: decoded.blocks ?? [],
          });
          draftIdRef.current = created.id;
          patch.to = created.to;
          patch.from = created.from;
          patch.place = created.place;
          patch.blocks = created.blocks;
          patch.draft = created.id;
          if (created.to) patch.step = "editor";
        }
        patch.propose = "";
      } else if (state.draft) {
        const loaded = getDraft(state.draft as DraftId);
        if (loaded) {
          draftIdRef.current = loaded.id;
          patch.to = loaded.to;
          patch.from = loaded.from;
          patch.place = loaded.place;
          patch.blocks = loaded.blocks;
          if (loaded.to && state.step === "recipient") patch.step = "editor";
        } else {
          patch.draft = "";
        }
      }

      const nextFrom = patch.from ?? state.from;
      const nextPlace = patch.place ?? state.place;
      const nextBlocks = patch.blocks ?? state.blocks;
      const nextTo = patch.to ?? state.to;

      if (!nextFrom) patch.from = defaultSender;
      if (defaultPlace && !nextPlace) patch.place = defaultPlace;
      if (nextBlocks.length > 0 && state.step === "recipient" && nextTo) {
        patch.step = "editor";
      }

      if (cancelled) return;
      if (Object.keys(patch).length > 0) setState(patch);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Persist: mirror state to IndexedDB ─────────────────────
  //
  // Mints a draft the first time the postcard becomes "real"
  // (recipient set OR any non-md content). Visiting /compose
  // without engaging does not create a draft.
  useEffect(() => {
    if (!hydrated) return;
    const meaningful = state.to.length > 0 || state.blocks.length > 0;
    if (!meaningful) return;

    if (!draftIdRef.current) {
      const created = createDraft({
        to: state.to,
        from: state.from,
        place: state.place,
        blocks: state.blocks,
      });
      draftIdRef.current = created.id;
      setState({ draft: created.id });
    } else {
      saveDraft(draftIdRef.current, {
        to: state.to,
        from: state.from,
        place: state.place,
        blocks: state.blocks,
      });
    }
  }, [hydrated, state.to, state.from, state.place, state.blocks, setState]);

  const clearDraft = () =>
    setState({
      to: "",
      from: "",
      place: "",
      step: "recipient",
      blocks: [],
      draft: "",
    });

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
        if (draftIdRef.current) {
          deleteDraft(draftIdRef.current);
          draftIdRef.current = "";
        }
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
      setError(err instanceof Error ? err.message : t("publishFailed"));
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
