import { OptimizationValues } from "@/types/photo";

export const neutralOptimizationValues: OptimizationValues = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  warmth: 0,
  reason: "Neutral values applied.",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeOptimizationValues(
  values: Partial<OptimizationValues> | OptimizationValues,
): OptimizationValues {
  return {
    brightness: clamp(Number(values.brightness ?? 100), 85, 115),
    contrast: clamp(Number(values.contrast ?? 100), 85, 125),
    saturation: clamp(Number(values.saturation ?? 100), 80, 120),
    hue: clamp(Number(values.hue ?? 0), -8, 8),
    warmth: clamp(Number(values.warmth ?? 0), -25, 25),
    reason:
      typeof values.reason === "string" && values.reason.trim()
        ? values.reason.trim()
        : neutralOptimizationValues.reason,
  };
}

export function optimizationValuesToCssFilter(values: OptimizationValues) {
  const normalized = normalizeOptimizationValues(values);
  return [
    `brightness(${normalized.brightness}%)`,
    `contrast(${normalized.contrast}%)`,
    `saturate(${normalized.saturation}%)`,
    `hue-rotate(${normalized.hue}deg)`,
  ].join(" ");
}

function loadImage(imageDataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image for optimization."));
    image.src = imageDataUrl;
  });
}

function applyWarmthToPixels(data: Uint8ClampedArray, warmth: number) {
  if (warmth === 0) {
    return;
  }

  const warmthFactor = warmth / 100;

  for (let index = 0; index < data.length; index += 4) {
    const redBoost = 32 * warmthFactor;
    const greenBoost = 10 * warmthFactor;
    const blueDrop = 36 * warmthFactor;

    data[index] = clamp(data[index] + redBoost, 0, 255);
    data[index + 1] = clamp(data[index + 1] + greenBoost, 0, 255);
    data[index + 2] = clamp(data[index + 2] - blueDrop, 0, 255);
  }
}

export async function applyOptimizationToImage(
  imageDataUrl: string,
  values: OptimizationValues,
): Promise<string> {
  const image = await loadImage(imageDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context is unavailable.");
  }

  const normalized = normalizeOptimizationValues(values);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.filter = optimizationValuesToCssFilter(normalized);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  context.filter = "none";

  if (normalized.warmth !== 0) {
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    applyWarmthToPixels(imageData.data, normalized.warmth);
    context.putImageData(imageData, 0, 0);
  }

  return canvas.toDataURL("image/png");
}
