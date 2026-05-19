# Create Postcard Flow — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first, swipe-based postcard creation flow as a full-screen overlay on the map.

**Architecture:** Three-panel swipe flow (Camera → Form → Share) orchestrated by a React Context that decouples panels from state/logic. Server actions split into `uploadImageBlob` (background) and `publishPostcard` (on submit). No domain or infrastructure changes needed.

**Tech Stack:** Next.js 16 server actions, React 19 Context, Canvas API for image compression, browser Geolocation API, MapLibre GL.

**Spec:** `docs/superpowers/specs/2026-03-12-create-postcard-flow-design.md`

---

## File Map

### New files

| File | Responsibility |
|------|---------------|
| `application/actions/uploadImageBlob.ts` | Server action: upload image blob to ATProto, return blob ref |
| `application/actions/publishPostcard.ts` | Server action: create ATProto record using existing blob ref |
| `presenters/components/CreatePostcard/compressImage.ts` | Client-side image compression (WebP via canvas) |
| `presenters/components/CreatePostcard/CreatePostcardContext.tsx` | React Context: draft state + actions (capturePhoto, setMessage, setLocation, publish, reset) |
| `presenters/components/CreatePostcard/CreatePostcardFlow.tsx` | Panel orchestrator: provider wrapper + swipe navigation |
| `presenters/components/CreatePostcard/CameraCapture.tsx` | Panel 1: file input with camera capture |
| `presenters/components/CreatePostcard/PostcardForm.tsx` | Panel 2: message input, location name, granularity picker |
| `presenters/components/CreatePostcard/PostcardPreview.tsx` | Preview component for draft data (used in Panel 3) |
| `presenters/components/CreatePostcard/ShareScreen.tsx` | Panel 3: preview + publish + WhatsApp share |
| `presenters/components/Map/CreatePostcardFAB.tsx` | Floating action button overlay on map |
| `presenters/components/Map/MapOverlay.tsx` | Client wrapper: FAB + overlay open/close state |

### Modified files

| File | Change |
|------|--------|
| `app/page.tsx` | Add FAB + CreatePostcardFlow overlay |

---

## Chunk 1: Server Actions

### Task 1: `uploadImageBlob` server action

**Files:**
- Create: `application/actions/uploadImageBlob.ts`

- [ ] **Step 1: Create the server action**

```typescript
// application/actions/uploadImageBlob.ts
"use server";

import { uploadImage } from "@/infrastructure/atproto/client";

type BlobRef = {
  ref: { $link: string };
  mimeType: string;
  size: number;
};

type UploadResult =
  | { success: true; blob: BlobRef }
  | { success: false; error: string };

export async function uploadImageBlob(
  imageBase64: string,
  mimeType: string
): Promise<UploadResult> {
  try {
    const imageData = Uint8Array.from(atob(imageBase64), (c) =>
      c.charCodeAt(0)
    );

    if (imageData.length === 0) {
      return { success: false, error: "Image data is empty" };
    }

    if (imageData.length > 1_000_000) {
      return { success: false, error: "Image exceeds 1MB limit" };
    }

    const blob = await uploadImage(imageData, mimeType);
    return { success: true, blob };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return { success: false, error: message };
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm build 2>&1 | tail -15`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add application/actions/uploadImageBlob.ts
git commit -m "feat: add uploadImageBlob server action"
```

### Task 2: `publishPostcard` server action

**Files:**
- Create: `application/actions/publishPostcard.ts`

- [ ] **Step 1: Create the server action**

```typescript
// application/actions/publishPostcard.ts
"use server";

import { createLocation } from "@/domain/value-objects/location";
import { validatePostcard } from "@/domain/value-objects/postcard";
import type { CreatePostcardCommand } from "@/domain/types";
import { createPostcardRecord } from "@/infrastructure/atproto/client";
import { revalidatePath } from "next/cache";

type BlobRef = {
  ref: { $link: string };
  mimeType: string;
  size: number;
};

type PublishInput = {
  blob: BlobRef;
  message: string;
  locationName: string;
  latitude?: number;
  longitude?: number;
  granularity: string;
};

type PublishResult =
  | { success: true; uri: string; rkey: string }
  | { success: false; error: string };

export async function publishPostcard(
  input: PublishInput
): Promise<PublishResult> {
  try {
    // Validate location via domain
    const location = createLocation({
      name: input.locationName,
      latitude: input.latitude,
      longitude: input.longitude,
      granularity: input.granularity,
    });

    // Validate postcard via domain (image already uploaded, use blob size for validation)
    const command: CreatePostcardCommand = {
      imageData: new Uint8Array(input.blob.size),
      imageMimeType: input.blob.mimeType,
      message: input.message,
      location,
    };
    const validation = validatePostcard(command);
    if (validation.valid === false) {
      return { success: false, error: validation.error };
    }

    const record = await createPostcardRecord({
      image: { $type: "blob", ref: input.blob.ref, mimeType: input.blob.mimeType, size: input.blob.size },
      message: input.message.trim(),
      location: {
        name: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
        granularity: location.granularity,
      },
      createdAt: new Date().toISOString(),
    });

    // Extract rkey from AT URI (at://did:plc:xxx/collection/rkey)
    const rkey = record.uri.replace("at://", "").split("/")[2];

    revalidatePath("/");

    return { success: true, uri: record.uri, rkey };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publish failed";
    return { success: false, error: message };
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm build 2>&1 | tail -15`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add application/actions/publishPostcard.ts
git commit -m "feat: add publishPostcard server action"
```

---

## Chunk 2: Image Compression

### Task 3: Client-side image compression utility

**Files:**
- Create: `presenters/components/CreatePostcard/compressImage.ts`

- [ ] **Step 1: Create the compression utility**

This runs client-side only. Encodes as WebP 0.85 at original resolution, then progressively downscales if the result exceeds 1MB.

```typescript
// presenters/components/CreatePostcard/compressImage.ts

type CompressedImage = {
  base64: string; // without data URI prefix
  mimeType: string;
  objectUrl: string; // for local preview
};

const MAX_SIZE = 1_000_000; // 1MB
const QUALITY = 0.85;
const SCALE_STEPS = [1, 0.75, 0.5, 0.35];

export async function compressImage(file: File): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  for (const scale of SCALE_STEPS) {
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);

    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob = await canvas.convertToBlob({ type: "image/webp", quality: QUALITY });

    if (blob.size <= MAX_SIZE) {
      bitmap.close();
      const base64 = await blobToBase64(blob);
      const objectUrl = URL.createObjectURL(blob);
      return { base64, mimeType: "image/webp", objectUrl };
    }
  }

  bitmap.close();
  throw new Error("Image too large even at minimum resolution");
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Strip "data:image/webp;base64," prefix
      resolve(dataUrl.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm build 2>&1 | tail -15`
Expected: Build succeeds (this is a client-side module, not imported by any server code yet)

- [ ] **Step 3: Commit**

```bash
git add presenters/components/CreatePostcard/compressImage.ts
git commit -m "feat: add client-side image compression utility"
```

---

## Chunk 3: Context

### Task 4: `CreatePostcardContext`

**Files:**
- Create: `presenters/components/CreatePostcard/CreatePostcardContext.tsx`

- [ ] **Step 1: Create the context**

```tsx
// presenters/components/CreatePostcard/CreatePostcardContext.tsx
"use client";

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import { compressImage } from "./compressImage";
import { uploadImageBlob } from "@/application/actions/uploadImageBlob";
import { publishPostcard } from "@/application/actions/publishPostcard";

type BlobRef = {
  ref: { $link: string };
  mimeType: string;
  size: number;
};

type UploadStatus = "idle" | "compressing" | "uploading" | "ready" | "error";
type PublishStatus = "idle" | "publishing" | "published" | "error";

type DraftState = {
  imageObjectUrl: string | null;
  message: string;
  locationName: string;
  granularity: string;
  latitude: number | undefined;
  longitude: number | undefined;
  uploadStatus: UploadStatus;
  publishStatus: PublishStatus;
  rkey: string | null;
  error: string | null;
};

type CreatePostcardActions = {
  capturePhoto: (file: File) => void;
  setMessage: (message: string) => void;
  setLocationName: (name: string) => void;
  setGranularity: (granularity: string) => void;
  setCoordinates: (lat: number, lng: number) => void;
  publish: () => Promise<void>;
  reset: () => void;
};

type CreatePostcardContextValue = DraftState & CreatePostcardActions;

const CreatePostcardCtx = createContext<CreatePostcardContextValue | null>(null);

export function useCreatePostcard(): CreatePostcardContextValue {
  const ctx = useContext(CreatePostcardCtx);
  if (!ctx) throw new Error("useCreatePostcard must be used within CreatePostcardProvider");
  return ctx;
}

const INITIAL_STATE: DraftState = {
  imageObjectUrl: null,
  message: "",
  locationName: "",
  granularity: "neighborhood",
  latitude: undefined,
  longitude: undefined,
  uploadStatus: "idle",
  publishStatus: "idle",
  rkey: null,
  error: null,
};

export function CreatePostcardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DraftState>(INITIAL_STATE);
  const blobRefPromise = useRef<Promise<BlobRef | null>>(Promise.resolve(null));
  const imageBase64Ref = useRef<string>("");

  const capturePhoto = useCallback((file: File) => {
    setState((s) => ({ ...s, uploadStatus: "compressing", error: null }));

    blobRefPromise.current = (async () => {
      try {
        const compressed = await compressImage(file);
        imageBase64Ref.current = compressed.base64;
        setState((s) => ({ ...s, imageObjectUrl: compressed.objectUrl, uploadStatus: "uploading" }));

        const result = await uploadImageBlob(compressed.base64, compressed.mimeType);
        if (result.success === false) {
          setState((s) => ({ ...s, uploadStatus: "error", error: result.error }));
          return null;
        }

        setState((s) => ({ ...s, uploadStatus: "ready" }));
        return result.blob;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Compression failed";
        setState((s) => ({ ...s, uploadStatus: "error", error: message }));
        return null;
      }
    })();
  }, []);

  const setMessage = useCallback((message: string) => {
    setState((s) => ({ ...s, message }));
  }, []);

  const setLocationName = useCallback((name: string) => {
    setState((s) => ({ ...s, locationName: name }));
  }, []);

  const setGranularity = useCallback((granularity: string) => {
    setState((s) => ({ ...s, granularity }));
  }, []);

  const setCoordinates = useCallback((lat: number, lng: number) => {
    setState((s) => ({ ...s, latitude: lat, longitude: lng }));
  }, []);

  const publish = useCallback(async () => {
    setState((s) => ({ ...s, publishStatus: "publishing", error: null }));

    try {
      const blob = await blobRefPromise.current;
      if (!blob) {
        setState((s) => ({ ...s, publishStatus: "error", error: "Image upload failed" }));
        return;
      }

      const result = await publishPostcard({
        blob,
        message: state.message,
        locationName: state.locationName,
        latitude: state.latitude,
        longitude: state.longitude,
        granularity: state.granularity,
      });

      if (result.success === false) {
        setState((s) => ({ ...s, publishStatus: "error", error: result.error }));
        return;
      }

      setState((s) => ({ ...s, publishStatus: "published", rkey: result.rkey }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Publish failed";
      setState((s) => ({ ...s, publishStatus: "error", error: message }));
    }
  }, [state.message, state.locationName, state.latitude, state.longitude, state.granularity]);

  const reset = useCallback(() => {
    if (state.imageObjectUrl) {
      URL.revokeObjectURL(state.imageObjectUrl);
    }
    setState(INITIAL_STATE);
    blobRefPromise.current = Promise.resolve(null);
    imageBase64Ref.current = "";
  }, [state.imageObjectUrl]);

  return (
    <CreatePostcardCtx.Provider value={{ ...state, capturePhoto, setMessage, setLocationName, setGranularity, setCoordinates, publish, reset }}>
      {children}
    </CreatePostcardCtx.Provider>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm build 2>&1 | tail -15`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add presenters/components/CreatePostcard/CreatePostcardContext.tsx
git commit -m "feat: add CreatePostcardContext for draft state orchestration"
```

---

## Chunk 4: Panel Components

### Task 5: `CameraCapture` (Panel 1)

**Files:**
- Create: `presenters/components/CreatePostcard/CameraCapture.tsx`

- [ ] **Step 1: Create the component**

```tsx
// presenters/components/CreatePostcard/CameraCapture.tsx
"use client";

import { useRef } from "react";
import { useCreatePostcard } from "./CreatePostcardContext";

type CameraCaptureProps = {
  onCaptured: () => void;
};

export function CameraCapture({ onCaptured }: CameraCaptureProps) {
  const { capturePhoto } = useCreatePostcard();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    capturePhoto(file);
    onCaptured();
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 bg-stone-900">
      <p className="text-white text-lg">Take a photo for your postcard</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />

      <button
        onClick={() => inputRef.current?.click()}
        className="w-20 h-20 rounded-full bg-white border-4 border-stone-300 active:scale-95 transition-transform"
        aria-label="Take photo"
      />

      <p className="text-stone-400 text-sm">Tap to open camera</p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add presenters/components/CreatePostcard/CameraCapture.tsx
git commit -m "feat: add CameraCapture panel"
```

### Task 6: `PostcardForm` (Panel 2)

**Files:**
- Create: `presenters/components/CreatePostcard/PostcardForm.tsx`

- [ ] **Step 1: Create the component**

```tsx
// presenters/components/CreatePostcard/PostcardForm.tsx
"use client";

import { useEffect } from "react";
import { useCreatePostcard } from "./CreatePostcardContext";
import { GRANULARITY_LEVELS } from "@/domain/types";

type PostcardFormProps = {
  onNext: () => void;
  onBack: () => void;
};

const MAX_MESSAGE = 300;

export function PostcardForm({ onNext, onBack }: PostcardFormProps) {
  const {
    imageObjectUrl,
    message,
    locationName,
    granularity,
    latitude,
    setMessage,
    setLocationName,
    setGranularity,
    setCoordinates,
    uploadStatus,
  } = useCreatePostcard();

  const hasCoordinates = latitude !== undefined;
  const needsCoordinates = ["establishment", "neighborhood", "city"].includes(granularity);
  const canAdvance = message.trim().length > 0 && locationName.trim().length > 0
    && (!needsCoordinates || hasCoordinates);

  // Request GPS on mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoordinates(pos.coords.latitude, pos.coords.longitude),
      () => {
        // GPS denied — default to region granularity
        setGranularity("region");
      },
      { enableHighAccuracy: true }
    );
  }, [setCoordinates, setGranularity]);

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
      {/* Photo thumbnail */}
      {imageObjectUrl && (
        <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-stone-200">
          <img src={imageObjectUrl} alt="Captured" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Upload status indicator */}
      {uploadStatus === "compressing" && <p className="text-sm text-stone-400">Compressing...</p>}
      {uploadStatus === "uploading" && <p className="text-sm text-stone-400">Uploading in background...</p>}
      {uploadStatus === "ready" && <p className="text-sm text-green-600">Image ready</p>}
      {uploadStatus === "error" && <p className="text-sm text-red-600">Upload failed — will retry on publish</p>}

      {/* Message */}
      <div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={MAX_MESSAGE}
          placeholder="Write your postcard message..."
          rows={3}
          className="w-full p-3 border border-stone-300 rounded-lg resize-none text-stone-900 placeholder:text-stone-400"
        />
        <p className="text-right text-sm text-stone-400">
          {message.length}/{MAX_MESSAGE}
        </p>
      </div>

      {/* Location name */}
      <input
        type="text"
        value={locationName}
        onChange={(e) => setLocationName(e.target.value)}
        maxLength={200}
        placeholder="Where are you? (e.g. 'home', 'Lisboa')"
        className="w-full p-3 border border-stone-300 rounded-lg text-stone-900 placeholder:text-stone-400"
      />

      {/* Granularity picker */}
      <div className="flex flex-wrap gap-2">
        {GRANULARITY_LEVELS.map((level) => {
          const disabled = !hasCoordinates && ["establishment", "neighborhood", "city"].includes(level);
          return (
            <button
              key={level}
              onClick={() => setGranularity(level)}
              disabled={disabled}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                granularity === level
                  ? "bg-stone-900 text-white border-stone-900"
                  : disabled
                    ? "text-stone-300 border-stone-200 cursor-not-allowed"
                    : "text-stone-600 border-stone-300 hover:border-stone-500"
              }`}
            >
              {level}
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="mt-auto flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-lg border border-stone-300 text-stone-600"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canAdvance}
          className={`flex-1 py-3 rounded-lg text-white ${
            canAdvance ? "bg-stone-900" : "bg-stone-300 cursor-not-allowed"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add presenters/components/CreatePostcard/PostcardForm.tsx
git commit -m "feat: add PostcardForm panel with message, location, granularity"
```

### Task 7: `PostcardPreview`

**Files:**
- Create: `presenters/components/CreatePostcard/PostcardPreview.tsx`

- [ ] **Step 1: Create the component**

Mirrors `PostcardView` layout but works with draft data instead of a persisted `Postcard`.

```tsx
// presenters/components/CreatePostcard/PostcardPreview.tsx

type PostcardPreviewProps = {
  imageUrl: string;
  message: string;
  locationName: string;
  granularity: string;
};

export function PostcardPreview({ imageUrl, message, locationName, granularity }: PostcardPreviewProps) {
  return (
    <article className="max-w-2xl w-full bg-white rounded-lg shadow-md overflow-hidden">
      <div className="aspect-[4/3] bg-stone-200">
        <img src={imageUrl} alt="Postcard" className="w-full h-full object-cover" />
      </div>

      <div className="p-6">
        <h1 className="text-xl font-semibold text-stone-900">{locationName}</h1>

        <p className="mt-3 text-stone-800 text-lg leading-relaxed font-serif">
          {message}
        </p>

        <time className="mt-4 block text-sm text-stone-400 text-right">
          {new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </time>
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add presenters/components/CreatePostcard/PostcardPreview.tsx
git commit -m "feat: add PostcardPreview component for draft data"
```

### Task 8: `ShareScreen` (Panel 3)

**Files:**
- Create: `presenters/components/CreatePostcard/ShareScreen.tsx`

- [ ] **Step 1: Create the component**

```tsx
// presenters/components/CreatePostcard/ShareScreen.tsx
"use client";

import { useCreatePostcard } from "./CreatePostcardContext";
import { PostcardPreview } from "./PostcardPreview";

type ShareScreenProps = {
  onBack: () => void;
  onDone: () => void;
};

export function ShareScreen({ onBack, onDone }: ShareScreenProps) {
  const {
    imageObjectUrl,
    message,
    locationName,
    granularity,
    uploadStatus,
    publishStatus,
    rkey,
    error,
    publish,
  } = useCreatePostcard();

  const isPublishing = publishStatus === "publishing" || (publishStatus === "idle" && uploadStatus === "uploading");
  const isPublished = publishStatus === "published";

  function handlePublish() {
    publish();
  }

  function shareUrl(): string {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/p/${rkey}`;
  }

  function whatsappUrl(): string {
    const text = `Postcard from ${locationName}: ${shareUrl()}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
      <h2 className="text-lg font-semibold text-stone-900">
        {isPublished ? "Postcard sent!" : "Preview"}
      </h2>

      {imageObjectUrl && (
        <PostcardPreview
          imageUrl={imageObjectUrl}
          message={message}
          locationName={locationName}
          granularity={granularity}
        />
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-4">
        {!isPublished && (
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 py-3 rounded-lg border border-stone-300 text-stone-600"
            >
              Back
            </button>
            <button
              onClick={handlePublish}
              disabled={isPublishing || uploadStatus === "compressing"}
              className={`flex-1 py-3 rounded-lg text-white ${
                isPublishing || uploadStatus === "compressing"
                  ? "bg-stone-300 cursor-not-allowed"
                  : "bg-stone-900 active:bg-stone-700"
              }`}
            >
              {isPublishing ? "Publishing..." : "Publish"}
            </button>
          </div>
        )}

        {isPublished && rkey && (
          <>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-lg bg-green-600 text-white text-center active:bg-green-700"
            >
              Share on WhatsApp
            </a>
            <button
              onClick={onDone}
              className="w-full py-3 rounded-lg border border-stone-300 text-stone-600"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add presenters/components/CreatePostcard/ShareScreen.tsx
git commit -m "feat: add ShareScreen panel with publish and WhatsApp share"
```

---

## Chunk 5: Flow Orchestrator

### Task 9: `CreatePostcardFlow` (panel orchestrator)

**Files:**
- Create: `presenters/components/CreatePostcard/CreatePostcardFlow.tsx`

- [ ] **Step 1: Create the flow component**

Manages active panel index and swipe/button navigation. Wraps everything in the context provider.

```tsx
// presenters/components/CreatePostcard/CreatePostcardFlow.tsx
"use client";

import { useState, useRef, type TouchEvent } from "react";
import { CreatePostcardProvider, useCreatePostcard } from "./CreatePostcardContext";
import { CameraCapture } from "./CameraCapture";
import { PostcardForm } from "./PostcardForm";
import { ShareScreen } from "./ShareScreen";

type CreatePostcardFlowProps = {
  onClose: () => void;
};

export function CreatePostcardFlow({ onClose }: CreatePostcardFlowProps) {
  return (
    <CreatePostcardProvider>
      <FlowPanels onClose={onClose} />
    </CreatePostcardProvider>
  );
}

function FlowPanels({ onClose }: { onClose: () => void }) {
  const [panel, setPanel] = useState(0);
  const { reset, imageObjectUrl } = useCreatePostcard();
  const touchStartX = useRef<number | null>(null);

  function handleClose() {
    reset();
    onClose();
  }

  function handleTouchStart(e: TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    const THRESHOLD = 80;
    if (delta > THRESHOLD && panel > 0) {
      setPanel(panel - 1);
    } else if (delta < -THRESHOLD && panel < 2) {
      if (panel === 0 && imageObjectUrl) setPanel(1);
      if (panel === 1) setPanel(2);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-white flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/20 text-white text-xl"
        aria-label="Close"
      >
        ×
      </button>

      {panel === 0 && (
        <CameraCapture onCaptured={() => setPanel(1)} />
      )}
      {panel === 1 && (
        <PostcardForm onNext={() => setPanel(2)} onBack={() => setPanel(0)} />
      )}
      {panel === 2 && (
        <ShareScreen onBack={() => setPanel(1)} onDone={handleClose} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm build 2>&1 | tail -15`
Expected: Build succeeds (all panels exist now)

- [ ] **Step 3: Commit**

```bash
git add presenters/components/CreatePostcard/CreatePostcardFlow.tsx
git commit -m "feat: add CreatePostcardFlow panel orchestrator"
```

---

## Chunk 6: Map Integration

### Task 10: FAB + overlay on map page

**Files:**
- Create: `presenters/components/Map/CreatePostcardFAB.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create the FAB component**

```tsx
// presenters/components/Map/CreatePostcardFAB.tsx
"use client";

type CreatePostcardFABProps = {
  onClick: () => void;
};

export function CreatePostcardFAB({ onClick }: CreatePostcardFABProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-14 h-14 rounded-full bg-stone-900 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      aria-label="Create postcard"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
    </button>
  );
}
```

- [ ] **Step 2: Create a client wrapper for the map page overlay**

We need a "use client" component that manages the overlay state (open/close), since `app/page.tsx` is a server component.

```tsx
// presenters/components/Map/MapOverlay.tsx
"use client";

import { useState } from "react";
import { CreatePostcardFAB } from "./CreatePostcardFAB";
import { CreatePostcardFlow } from "@/presenters/components/CreatePostcard/CreatePostcardFlow";

export function MapOverlay() {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <>
      {!isCreating && <CreatePostcardFAB onClick={() => setIsCreating(true)} />}
      {isCreating && <CreatePostcardFlow onClose={() => setIsCreating(false)} />}
    </>
  );
}
```

- [ ] **Step 3: Update `app/page.tsx`**

Add the `MapOverlay` component alongside the map.

Current `app/page.tsx`:
```tsx
import { getPostcardMarkers } from "@/application/queries/getPostcards";
import { PostcardMap } from "@/presenters/components/Map/PostcardMap";

export const dynamic = "force-dynamic";

export default async function Home() {
  let markers: Awaited<ReturnType<typeof getPostcardMarkers>> = [];

  try {
    markers = await getPostcardMarkers();
  } catch {
    // ATProto not configured yet — show empty map
  }

  return (
    <main className="h-screen w-screen relative">
      <PostcardMap markers={markers} />
    </main>
  );
}
```

Change to:
```tsx
import { getPostcardMarkers } from "@/application/queries/getPostcards";
import { PostcardMap } from "@/presenters/components/Map/PostcardMap";
import { MapOverlay } from "@/presenters/components/Map/MapOverlay";

export const dynamic = "force-dynamic";

export default async function Home() {
  let markers: Awaited<ReturnType<typeof getPostcardMarkers>> = [];

  try {
    markers = await getPostcardMarkers();
  } catch {
    // ATProto not configured yet — show empty map
  }

  return (
    <main className="h-screen w-screen relative">
      <PostcardMap markers={markers} />
      <MapOverlay />
    </main>
  );
}
```

- [ ] **Step 4: Verify full build**

Run: `pnpm build 2>&1 | tail -20`
Expected: Build succeeds with all components wired together

- [ ] **Step 5: Manual smoke test**

Run: `pnpm dev`

Test on mobile (or mobile emulator):
1. Map loads with FAB visible at bottom center
2. Tap FAB → full-screen overlay opens with camera panel
3. Capture photo → advances to form panel, upload starts in background
4. Fill message + location → tap Next → preview panel
5. Publish → success → WhatsApp share link appears
6. Done → returns to map
7. Swipe gestures work: left to advance, right to go back

- [ ] **Step 6: Commit**

```bash
git add presenters/components/Map/CreatePostcardFAB.tsx presenters/components/Map/MapOverlay.tsx app/page.tsx
git commit -m "feat: add FAB and creation overlay to map page"
```
