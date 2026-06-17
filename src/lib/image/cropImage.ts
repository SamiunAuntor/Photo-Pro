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

function degreeToRadian(degree: number) {
  return (degree * Math.PI) / 180;
}

function getRotatedSize(width: number, height: number, rotation: number) {
  const radians = degreeToRadian(rotation);

  return {
    width:
      Math.abs(Math.cos(radians) * width) + Math.abs(Math.sin(radians) * height),
    height:
      Math.abs(Math.sin(radians) * width) + Math.abs(Math.cos(radians) * height),
  };
}

export async function getCenteredCropArea({
  imageSrc,
  aspect,
  rotation = 0,
}: {
  imageSrc: string;
  aspect: number;
  rotation?: number;
}): Promise<CropArea> {
  const image = await loadImage(imageSrc);
  const rotated = getRotatedSize(image.naturalWidth, image.naturalHeight, rotation);
  const imageAspect = rotated.width / rotated.height;

  let width = rotated.width;
  let height = width / aspect;

  if (imageAspect < aspect) {
    height = rotated.height;
    width = height * aspect;
  }

  return {
    x: Math.round((rotated.width - width) / 2),
    y: Math.round((rotated.height - height) / 2),
    width: Math.round(width),
    height: Math.round(height),
  };
}

export async function getPixelCropFromStoredArea({
  imageSrc,
  storedArea,
  aspect,
  rotation = 0,
}: {
  imageSrc: string;
  storedArea: CropArea;
  aspect: number;
  rotation?: number;
}): Promise<CropArea> {
  const image = await loadImage(imageSrc);
  const rotated = getRotatedSize(image.naturalWidth, image.naturalHeight, rotation);
  const naturalWidth = rotated.width;
  const naturalHeight = rotated.height;
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
  rotation = 0,
}: {
  imageSrc: string;
  pixelCrop: CropArea;
  outputWidth: number;
  outputHeight: number;
  rotation?: number;
}): Promise<string> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not available.");
  }

  canvas.width = Math.max(1, Math.round(outputWidth));
  canvas.height = Math.max(1, Math.round(outputHeight));

  const safeRotation = rotation % 360;
  const rotatedBounds = getRotatedSize(
    image.naturalWidth,
    image.naturalHeight,
    safeRotation,
  );
  const tempCanvas = document.createElement("canvas");
  const tempContext = tempCanvas.getContext("2d");

  if (!tempContext) {
    throw new Error("Temporary canvas is not available.");
  }

  tempCanvas.width = Math.max(1, Math.round(rotatedBounds.width));
  tempCanvas.height = Math.max(1, Math.round(rotatedBounds.height));

  tempContext.translate(tempCanvas.width / 2, tempCanvas.height / 2);
  tempContext.rotate(degreeToRadian(safeRotation));
  tempContext.drawImage(
    image,
    -image.naturalWidth / 2,
    -image.naturalHeight / 2,
    image.naturalWidth,
    image.naturalHeight,
  );

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    tempCanvas,
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
