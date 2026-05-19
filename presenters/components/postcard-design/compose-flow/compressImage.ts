type CompressedImage = {
  base64: string; // without data URI prefix
  mimeType: string;
  objectUrl: string; // for local preview
};

const MAX_SIZE = 1_000_000; // 1MB (ATProto PDS limit)

type CompressionAttempt = {
  scale: number;
  quality: number;
  format: string;
};

// Progressive compression: try WebP first, then JPEG. Lower quality and scale as we go.
const ATTEMPTS: CompressionAttempt[] = [
  { scale: 1, quality: 0.85, format: "image/webp" },
  { scale: 0.75, quality: 0.85, format: "image/webp" },
  { scale: 0.5, quality: 0.80, format: "image/webp" },
  { scale: 0.35, quality: 0.75, format: "image/webp" },
  // JPEG fallback (if browser doesn't support WebP encoding, convertToBlob
  // silently falls back to PNG which is huge — JPEG is a safe alternative)
  { scale: 1, quality: 0.85, format: "image/jpeg" },
  { scale: 0.75, quality: 0.80, format: "image/jpeg" },
  { scale: 0.5, quality: 0.75, format: "image/jpeg" },
  { scale: 0.35, quality: 0.70, format: "image/jpeg" },
  { scale: 0.25, quality: 0.65, format: "image/jpeg" },
];

export async function compressImage(file: File): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  for (const attempt of ATTEMPTS) {
    const w = Math.round(width * attempt.scale);
    const h = Math.round(height * attempt.scale);

    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas not supported");
    }

    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob = await canvas.convertToBlob({
      type: attempt.format,
      quality: attempt.quality,
    });

    // Skip if the browser silently fell back to PNG (much larger than expected)
    if (attempt.format === "image/webp" && blob.type !== "image/webp") {
      continue;
    }

    if (blob.size <= MAX_SIZE) {
      bitmap.close();
      const base64 = await blobToBase64(blob);
      const objectUrl = URL.createObjectURL(blob);
      return { base64, mimeType: blob.type, objectUrl };
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
      // Strip "data:<mime>;base64," prefix
      resolve(dataUrl.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
