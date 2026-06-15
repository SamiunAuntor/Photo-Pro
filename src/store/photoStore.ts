"use client";

import { create } from "zustand";
import { defaultPaperSize, defaultPhotoSize } from "@/lib/layout/presets";
import { CropArea, CropPoint, PaperSize, PhotoSize, Step } from "@/types/photo";

type PhotoState = {
  currentStep: Step;
  originalImage: string | null;
  processedImage: string | null;
  crop: CropPoint;
  cropZoom: number;
  cropAreaPixels: CropArea | null;
  cropAreaPercent: CropArea | null;
  selectedPhotoSize: PhotoSize;
  selectedPaperSize: PaperSize;
  marginMm: number;
  gapMm: number;
  cutMarks: boolean;
  border: boolean;
  copies: "auto" | number;
  setCurrentStep: (step: Step) => void;
  setOriginalImage: (image: string | null) => void;
  setProcessedImage: (image: string | null) => void;
  setCrop: (crop: CropPoint) => void;
  setCropZoom: (zoom: number) => void;
  setCropAreaPixels: (area: CropArea | null) => void;
  setCropAreaPercent: (area: CropArea | null) => void;
  setSelectedPhotoSize: (size: PhotoSize) => void;
  setSelectedPaperSize: (size: PaperSize) => void;
  setMarginMm: (margin: number) => void;
  setGapMm: (gap: number) => void;
  setCutMarks: (value: boolean) => void;
  setBorder: (value: boolean) => void;
  setCopies: (copies: "auto" | number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  reset: () => void;
};

const stepOrder: Step[] = ["upload", "processing", "layout"];

const initialState = {
  currentStep: "upload" as Step,
  originalImage: null,
  processedImage: null,
  crop: { x: 0, y: 0 },
  cropZoom: 1,
  cropAreaPixels: null,
  cropAreaPercent: null,
  selectedPhotoSize: defaultPhotoSize,
  selectedPaperSize: defaultPaperSize,
  marginMm: 5,
  gapMm: 10,
  cutMarks: false,
  border: false,
  copies: 12 as const,
};

export const usePhotoStore = create<PhotoState>((set) => ({
  ...initialState,
  setCurrentStep: (currentStep) => set({ currentStep }),
  setOriginalImage: (originalImage) => set({ originalImage }),
  setProcessedImage: (processedImage) => set({ processedImage }),
  setCrop: (crop) => set({ crop }),
  setCropZoom: (cropZoom) => set({ cropZoom }),
  setCropAreaPixels: (cropAreaPixels) => set({ cropAreaPixels }),
  setCropAreaPercent: (cropAreaPercent) => set({ cropAreaPercent }),
  setSelectedPhotoSize: (selectedPhotoSize) => set({ selectedPhotoSize }),
  setSelectedPaperSize: (selectedPaperSize) => set({ selectedPaperSize }),
  setMarginMm: (marginMm) => set({ marginMm }),
  setGapMm: (gapMm) => set({ gapMm }),
  setCutMarks: (cutMarks) => set({ cutMarks }),
  setBorder: (border) => set({ border }),
  setCopies: (copies) => set({ copies }),
  goToNextStep: () =>
    set((state) => {
      const currentIndex = stepOrder.indexOf(state.currentStep);
      return {
        currentStep: stepOrder[Math.min(currentIndex + 1, stepOrder.length - 1)],
      };
    }),
  goToPreviousStep: () =>
    set((state) => {
      const currentIndex = stepOrder.indexOf(state.currentStep);
      return {
        currentStep: stepOrder[Math.max(currentIndex - 1, 0)],
      };
    }),
  reset: () => set(initialState),
}));
