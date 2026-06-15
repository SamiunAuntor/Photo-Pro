import { PaperSize, PhotoSize } from "@/types/photo";

export const photoSizePresets: PhotoSize[] = [
  { label: "Passport 35 x 45 mm", widthMm: 35, heightMm: 45 },
  { label: "Passport 45 x 55 mm", widthMm: 45, heightMm: 55 },
  { label: "US 2 x 2 inch", widthMm: 50.8, heightMm: 50.8 },
  { label: "Stamp 25 x 30 mm", widthMm: 25, heightMm: 30 },
];

export const paperSizePresets: PaperSize[] = [
  { label: "A4", widthMm: 210, heightMm: 297 },
  { label: "4R", widthMm: 102, heightMm: 152 },
  { label: "Letter", widthMm: 216, heightMm: 279 },
];

export const defaultPhotoSize = photoSizePresets[0];
export const defaultPaperSize = paperSizePresets[0];
