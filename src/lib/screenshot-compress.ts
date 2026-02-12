import sharp from "sharp";

/**
 * Compress a base64 data URI screenshot to WebP format.
 * Falls back to the original on any error.
 */
export async function compressScreenshot(
  dataUri: string | null
): Promise<string | null> {
  if (!dataUri || !dataUri.startsWith("data:image/")) {
    return dataUri;
  }

  try {
    const base64Data = dataUri.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const webpBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();
    return `data:image/webp;base64,${webpBuffer.toString("base64")}`;
  } catch {
    return dataUri;
  }
}

/**
 * Upscale a data URI image by a given factor, then encode as high-quality WebP.
 * Used for mockup images where Gemini returns lower-res than requested.
 */
export async function upscaleImage(
  dataUri: string | null,
  scale: number = 2,
  quality: number = 90
): Promise<string | null> {
  if (!dataUri || !dataUri.startsWith("data:image/")) {
    return dataUri;
  }

  try {
    const base64Data = dataUri.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) return dataUri;

    const newWidth = Math.round(metadata.width * scale);
    const newHeight = Math.round(metadata.height * scale);

    const upscaled = await sharp(buffer)
      .resize(newWidth, newHeight, { kernel: sharp.kernel.lanczos3 })
      .png({ quality })
      .toBuffer();

    return `data:image/png;base64,${upscaled.toString("base64")}`;
  } catch {
    return dataUri;
  }
}

/**
 * Batch-compress an array of data URI screenshots to WebP,
 * processing in chunks to limit memory usage.
 */
export async function compressScreenshots(
  dataUris: (string | null)[],
  concurrency = 5
): Promise<(string | null)[]> {
  const results: (string | null)[] = new Array(dataUris.length);

  for (let i = 0; i < dataUris.length; i += concurrency) {
    const chunk = dataUris.slice(i, i + concurrency);
    const compressed = await Promise.all(chunk.map(compressScreenshot));
    for (let j = 0; j < compressed.length; j++) {
      results[i + j] = compressed[j];
    }
  }

  return results;
}
