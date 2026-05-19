import { BskyAgent } from "@atproto/api";

const POSTCARD_COLLECTION = "tech.equanimi.respost.postcard";
const LABEL_COLLECTION = "tech.equanimi.respost.label";

let agent: BskyAgent | null = null;

/**
 * Get an authenticated ATProto agent.
 * Uses env vars for credentials (server-side only).
 */
export async function getAgent(): Promise<BskyAgent> {
  if (agent) return agent;

  const service = process.env.ATPROTO_SERVICE ?? "https://bsky.social";
  const identifier = process.env.ATPROTO_IDENTIFIER;
  const password = process.env.ATPROTO_PASSWORD;

  if (!identifier || !password) {
    throw new Error(
      "Missing ATPROTO_IDENTIFIER or ATPROTO_PASSWORD environment variables"
    );
  }

  agent = new BskyAgent({ service });
  await agent.login({ identifier, password });
  return agent;
}

/**
 * Get the DID of the authenticated user.
 */
export async function getAuthorDid(): Promise<string> {
  const a = await getAgent();
  if (!a.session?.did) {
    throw new Error("Not authenticated");
  }
  return a.session.did;
}

// --- Block-shaped postcard records ---

type LocationField = {
  name: string;
  latitude?: number;
  longitude?: number;
  granularity: string;
};

type ImageBlob = {
  $type: "blob";
  ref: { $link: string };
  mimeType: string;
  size: number;
};

export type BlockRecord =
  | { type: "md"; id: string; md: string }
  | {
      type: "photo";
      id: string;
      kind: "uploaded" | "handwriting";
      image?: ImageBlob;
      caption?: string;
      rot?: number;
    }
  | {
      type: "music";
      id: string;
      url: string;
      service: string;
      title: string;
      artist?: string;
      album?: string;
      dur?: string;
      tone?: string;
    }
  | {
      type: "video";
      id: string;
      url: string;
      service: "youtube";
      title: string;
      channel?: string;
      dur?: string;
      thumbUrl?: string;
    }
  | {
      type: "place";
      id: string;
      url: string;
      name: string;
      addr?: string;
      caption?: string;
      latitude?: number;
      longitude?: number;
    }
  | {
      type: "article";
      id: string;
      url: string;
      host: string;
      title: string;
      excerpt?: string;
      imageUrl?: string;
    };

export type CoverBlob = {
  $type: "blob";
  ref: { $link: string };
  mimeType: string;
  size: number;
};

export type PostcardRecord = {
  $type: typeof POSTCARD_COLLECTION;
  to: string;
  from: string;
  place?: string;
  senderLocation?: LocationField;
  title?: string;
  brief?: string;
  summary?: string;
  cover?: CoverBlob;
  blocks: ReadonlyArray<BlockRecord>;
  createdAt: string;
};

/**
 * Upload an image blob to the PDS.
 */
export async function uploadImage(
  data: Uint8Array,
  mimeType: string
): Promise<{ ref: { $link: string }; mimeType: string; size: number }> {
  const a = await getAgent();
  const response = await a.uploadBlob(data, { encoding: mimeType });
  return {
    ref: { $link: String(response.data.blob.ref) },
    mimeType: response.data.blob.mimeType,
    size: response.data.blob.size,
  };
}

/**
 * Create a postcard record on the PDS.
 */
export async function createPostcardRecord(
  record: Omit<PostcardRecord, "$type">
): Promise<{ uri: string; cid: string }> {
  const a = await getAgent();
  const did = await getAuthorDid();

  const response = await a.com.atproto.repo.createRecord({
    repo: did,
    collection: POSTCARD_COLLECTION,
    record: {
      $type: POSTCARD_COLLECTION,
      ...record,
    },
  });

  return { uri: response.data.uri, cid: response.data.cid };
}

/**
 * List postcard records from a user's repo.
 */
export async function listPostcardRecords(
  did: string,
  limit = 50,
  cursor?: string
): Promise<{
  records: Array<{ uri: string; value: PostcardRecord }>;
  cursor?: string;
}> {
  const a = await getAgent();

  const response = await a.com.atproto.repo.listRecords({
    repo: did,
    collection: POSTCARD_COLLECTION,
    limit,
    cursor,
  });

  return {
    records: response.data.records.map((r) => ({
      uri: r.uri,
      value: r.value as unknown as PostcardRecord,
    })),
    cursor: response.data.cursor,
  };
}

/**
 * Get a single postcard record by rkey.
 */
export async function getPostcardRecord(
  did: string,
  rkey: string
): Promise<{ uri: string; value: PostcardRecord } | null> {
  const a = await getAgent();

  try {
    const response = await a.com.atproto.repo.getRecord({
      repo: did,
      collection: POSTCARD_COLLECTION,
      rkey,
    });

    return {
      uri: response.data.uri,
      value: response.data.value as unknown as PostcardRecord,
    };
  } catch {
    return null;
  }
}

/**
 * Build the public URL for a blob stored on this user's PDS.
 * Recipients fetch images through this URL — no auth required.
 */
export function blobImageUrl(did: string, ref: string): string {
  const service = process.env.ATPROTO_SERVICE ?? "https://bsky.social";
  return `${service}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(did)}&cid=${encodeURIComponent(ref)}`;
}

// --- Label records (used by /map) ---

export type LabelRecord = {
  $type: typeof LABEL_COLLECTION;
  name: string;
  latitude: number;
  longitude: number;
  radius?: number;
  createdAt: string;
};

export async function createLabelRecord(
  record: Omit<LabelRecord, "$type">
): Promise<{ uri: string; cid: string }> {
  const a = await getAgent();
  const did = await getAuthorDid();

  const response = await a.com.atproto.repo.createRecord({
    repo: did,
    collection: LABEL_COLLECTION,
    record: {
      $type: LABEL_COLLECTION,
      ...record,
    },
  });

  return { uri: response.data.uri, cid: response.data.cid };
}

export async function listLabelRecords(
  did: string
): Promise<Array<{ uri: string; value: LabelRecord }>> {
  const a = await getAgent();

  const response = await a.com.atproto.repo.listRecords({
    repo: did,
    collection: LABEL_COLLECTION,
    limit: 100,
  });

  return response.data.records.map((r) => ({
    uri: r.uri,
    value: r.value as unknown as LabelRecord,
  }));
}

export { POSTCARD_COLLECTION, LABEL_COLLECTION };
