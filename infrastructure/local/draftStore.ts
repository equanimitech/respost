"use client";

import { observable } from "@legendapp/state";
import {
  configureObservablePersistence,
  persistObservable,
} from "@legendapp/state/persist";
import { ObservablePersistIndexedDB } from "@legendapp/state/persist-plugins/indexeddb";
import type { DraftBlock } from "@/application/actions/publishPostcard";

// ─── On-device draft store ──────────────────────────────────────
//
// Local-first: drafts live in IndexedDB on whichever device opened
// the URL. No server-side state, no cross-device sync. Built on
// Legend-State so consumers can subscribe reactively (drafts list
// auto-refreshes; the composer mirrors changes back to disk).
//
// Photo blobs are not stored here yet — photos are picked inside
// the composer and uploaded at publish time.

export type DraftId = string & { readonly __brand: "DraftId" };

export type Draft = {
  readonly id: DraftId;
  readonly to: string;
  readonly from: string;
  readonly place: string;
  readonly blocks: ReadonlyArray<DraftBlock>;
  readonly createdAt: number;
  readonly updatedAt: number;
};

const DB_NAME = "respost";
const DB_VERSION = 1;
const TABLE = "drafts";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  configureObservablePersistence({
    pluginLocal: ObservablePersistIndexedDB,
    localOptions: {
      indexedDB: {
        databaseName: DB_NAME,
        version: DB_VERSION,
        tableNames: [TABLE],
      },
    },
  });
  configured = true;
}

ensureConfigured();

// Persisted dictionary keyed by draft id. Each value carries an
// `id` field — required by the IndexedDB plugin's row mode.
export const drafts$ = persistObservable<Record<DraftId, Draft>>(
  {},
  { local: { name: TABLE } }
);

export function newDraftId(): DraftId {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID() as DraftId;
  }
  return `d-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}` as DraftId;
}

export type DraftSeed = {
  readonly to?: string;
  readonly from?: string;
  readonly place?: string;
  readonly blocks?: ReadonlyArray<DraftBlock>;
};

export function createDraft(seed: DraftSeed): Draft {
  const now = Date.now();
  const draft: Draft = {
    id: newDraftId(),
    to: seed.to ?? "",
    from: seed.from ?? "",
    place: seed.place ?? "",
    blocks: seed.blocks ?? [],
    createdAt: now,
    updatedAt: now,
  };
  drafts$[draft.id].set(draft);
  return draft;
}

export function getDraft(id: DraftId): Draft | undefined {
  return drafts$[id].get();
}

export type DraftPatch = {
  readonly to?: string;
  readonly from?: string;
  readonly place?: string;
  readonly blocks?: ReadonlyArray<DraftBlock>;
};

export function saveDraft(id: DraftId, patch: DraftPatch): Draft | undefined {
  const existing = drafts$[id].get();
  if (!existing) return undefined;
  const next: Draft = {
    ...existing,
    to: patch.to ?? existing.to,
    from: patch.from ?? existing.from,
    place: patch.place ?? existing.place,
    blocks: patch.blocks ?? existing.blocks,
    updatedAt: Date.now(),
  };
  drafts$[id].set(next);
  return next;
}

export function deleteDraft(id: DraftId): void {
  drafts$[id].delete();
}

export function listDrafts(): ReadonlyArray<Draft> {
  const all = Object.values(drafts$.get() ?? {}) as Draft[];
  return [...all].sort((a, b) => b.updatedAt - a.updatedAt);
}
