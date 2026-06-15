import { calculateGrid } from "@/lib/layout/calculateGrid";
import { PaperSize, PhotoSize, PrintJob } from "@/types/photo";

export function createPrintJob({
  image,
  paperSize,
  photoSize,
  marginMm,
  gapMm,
  cutMarks,
  border,
}: {
  image: string;
  paperSize: PaperSize;
  photoSize: PhotoSize;
  marginMm: number;
  gapMm: number;
  cutMarks: boolean;
  border: boolean;
}): PrintJob {
  const grid = calculateGrid({
    paperWidthMm: paperSize.widthMm,
    paperHeightMm: paperSize.heightMm,
    photoWidthMm: photoSize.widthMm,
    photoHeightMm: photoSize.heightMm,
    marginMm,
    gapMm,
  });

  return {
    image,
    paperWidthMm: paperSize.widthMm,
    paperHeightMm: paperSize.heightMm,
    photoWidthMm: photoSize.widthMm,
    photoHeightMm: photoSize.heightMm,
    marginMm,
    gapMm,
    columns: grid.columns,
    rows: grid.rows,
    total: grid.total,
    cutMarks,
    border,
  };
}
