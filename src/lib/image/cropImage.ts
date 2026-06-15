import { CropArea } from "@/types/photo";

function loadImage(imageSrc: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image for cropping."));
    image.src = imageSrc;
  });
}

function getOutputMimeType(imageSrc: string) {
  if (imageSrc.startsWith("data:image/png") || imageSrc.startsWith("data:image/webp")) {
    return "image/png";
  }

  return "image/jpeg";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export async function getCenteredCropArea({
  imageSrc,
  aspect,
}: {
  imageSrc: string;
  aspect: number;
}): Promise<CropArea> {
  const image = await loadImage(imageSrc);
  const imageAspect = image.naturalWidth / image.naturalHeight;

  let width = image.naturalWidth;
  let height = width / aspect;

  if (imageAspect < aspect) {
    height = image.naturalHeight;
    width = height * aspect;
  }

  return {
    x: Math.round((image.naturalWidth - width) / 2),
    y: Math.round((image.naturalHeight - height) / 2),
    width: Math.round(width),
    height: Math.round(height),
  };
}

export async function getPixelCropFromStoredArea({
  imageSrc,
  storedArea,
  aspect,
}: {
  imageSrc: string;
  storedArea: CropArea;
  aspect: number;
}): Promise<CropArea> {
  const image = await loadImage(imageSrc);
  const naturalWidth = image.naturalWidth;
  const naturalHeight = image.naturalHeight;
  const centerX = naturalWidth * ((storedArea.x + storedArea.width / 2) / 100);
  const centerY = naturalHeight * ((storedArea.y + storedArea.height / 2) / 100);
  const storedWidth = naturalWidth * (storedArea.width / 100);
  const storedHeight = naturalHeight * (storedArea.height / 100);

  let width = storedWidth;
  let height = width / aspect;

  if (height > storedHeight) {
    height = storedHeight;
    width = height * aspect;
  }

  const maxWidth = Math.max(1, Math.min(centerX, naturalWidth - centerX) * 2);
  const maxHeight = Math.max(1, Math.min(centerY, naturalHeight - centerY) * 2);

  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspect;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspect;
  }

  const x = clamp(centerX - width / 2, 0, naturalWidth - width);
  const y = clamp(centerY - height / 2, 0, naturalHeight - height);

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  };
}

export async function getCroppedImageDataUrl({
  imageSrc,
  pixelCrop,
  outputWidth,
  outputHeight,
}: {
  imageSrc: string;
  pixelCrop: CropArea;
  outputWidth: number;
  outputHeight: number;
}): Promise<string> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not available.");
  }

  canvas.width = Math.max(1, Math.round(outputWidth));
  canvas.height = Math.max(1, Math.round(outputHeight));

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const mimeType = getOutputMimeType(imageSrc);
  return mimeType === "image/png" ? canvas.toDataURL(mimeType) : canvas.toDataURL(mimeType, 0.95);
}
