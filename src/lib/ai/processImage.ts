import { ProviderProcessResult } from "./providerTypes";

export const DEFAULT_PROCESSING_WARNING =
  "Image processing request failed. Original image used as fallback.";

// Gemini image processing is kept for future optional paid AI processing.
// It is not used in the default MVP flow.
export async function processImageWithAI(
  imageDataUrl: string,
): Promise<ProviderProcessResult> {
  const response = await fetch("/api/process-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      imageDataUrl,
    }),
  });

  if (!response.ok) {
    return {
      processedImage: imageDataUrl,
      provider: "mock",
      warning: DEFAULT_PROCESSING_WARNING,
    };
  }

  const data = (await response.json()) as Partial<ProviderProcessResult>;

  return {
    processedImage:
      typeof data.processedImage === "string" && data.processedImage
        ? data.processedImage
        : imageDataUrl,
    provider: data.provider === "gemini" ? "gemini" : "mock",
    warning: typeof data.warning === "string" ? data.warning : null,
  };
}
