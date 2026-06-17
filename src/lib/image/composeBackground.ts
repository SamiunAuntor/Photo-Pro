export const DEFAULT_ID_BACKGROUND_COLOR = "#5B9BD5";
export const TRANSPARENT_BACKGROUND_VALUE = "transparent";

function loadImage(imageSrc: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image for background composition."));
    image.src = imageSrc;
  });
}

export async function composeBackground(
  imageSrc: string,
  backgroundColor: string,
): Promise<string> {
  if (backgroundColor === TRANSPARENT_BACKGROUND_VALUE) {
    return imageSrc;
  }

  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not available for background composition.");
  }

  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png");
}
