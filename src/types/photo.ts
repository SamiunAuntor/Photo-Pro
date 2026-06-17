export type Step = "upload" | "processing" | "optimize" | "layout";

export type BackgroundRemovalStatus =
  | "idle"
  | "loading"
  | "ready"
  | "applied"
  | "skipped"
  | "error";

export type CropPoint = {
  x: number;
  y: number;
};

export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PhotoSize = {
  label: string;
  widthMm: number;
  heightMm: number;
};

export type PaperSize = {
  label: string;
  widthMm: number;
  heightMm: number;
};

export type PrintJob = {
  image: string;
  paperWidthMm: number;
  paperHeightMm: number;
  photoWidthMm: number;
  photoHeightMm: number;
  marginMm: number;
  gapMm: number;
  columns: number;
  rows: number;
  total: number;
  cutMarks: boolean;
  border: boolean;
};

export type OptimizationValues = {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  warmth: number;
  reason?: string;
};
