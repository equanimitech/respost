"use server";

import { uploadImage } from "@/infrastructure/atproto/client";
import type { BlobRef } from "@/domain/types";

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
