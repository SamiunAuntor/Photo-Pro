"use client";

import "react-easy-crop/react-easy-crop.css";

import Cropper from "react-easy-crop";
import {
  CircleAlert,
  FileBadge2,
  FileImage,
  ImagePlus,
  LoaderCircle,
  PaintBucket,
  RefreshCcw,
  Replace,
  RotateCcw,
  RotateCw,
  Scissors,
  ZoomIn,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  DEFAULT_ID_BACKGROUND_COLOR,
  TRANSPARENT_BACKGROUND_VALUE,
} from "@/lib/image/composeBackground";
import { fileToDataUrl } from "@/lib/image/fileToDataUrl";
import { photoSizePresets } from "@/lib/layout/presets";
import {
  BackgroundRemovalStatus,
  CropArea,
  CropPoint,
  PaperSize,
  PhotoSize,
} from "@/types/photo";

type UploadStepProps = {
  image: string | null;
  cropperImage: string | null;
  originalFile: File | null;
  backgroundRemovedImage: string | null;
  backgroundRemovalStatus: BackgroundRemovalStatus;
  backgroundRemovalProgress: number | null;
  backgroundRemovalMessage: string | null;
  backgroundRemovalError: string | null;
  selectedBackgroundColor: string;
  crop: CropPoint;
  cropZoom: number;
  cropRotation: number;
  selectedPhotoSize: PhotoSize;
  selectedPaperSize: PaperSize;
  warning?: string | null;
  isGenerating: boolean;
  onUpload: (file: File, image: string) => void;
  onRemoveBackground: () => void;
  onBackgroundColorChange: (color: string) => void;
  onCropChange: (crop: CropPoint) => void;
  onCropZoomChange: (zoom: number) => void;
  onCropRotationChange: (rotation: number) => void;
  onCropComplete: (areaPercent: CropArea, areaPixels: CropArea) => void;
  onPhotoSizeChange: (size: PhotoSize) => void;
  onNext: () => void;
  onReset: () => void;
};

export function UploadStep({
  image,
  cropperImage,
  originalFile,
  backgroundRemovedImage,
  backgroundRemovalStatus,
  backgroundRemovalProgress,
  backgroundRemovalMessage,
  backgroundRemovalError,
  selectedBackgroundColor,
  crop,
  cropZoom,
  cropRotation,
  selectedPhotoSize,
  selectedPaperSize,
  warning,
  isGenerating,
  onUpload,
  onRemoveBackground,
  onBackgroundColorChange,
  onCropChange,
  onCropZoomChange,
  onCropRotationChange,
  onCropComplete,
  onPhotoSizeChange,
  onNext,
  onReset,
}: UploadStepProps) {
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setSelectionError("Please choose a JPEG, PNG, or WEBP image.");
        return;
      }
      setSelectionError(null);
      const dataUrl = await fileToDataUrl(file);
      onUpload(file, dataUrl);
    },
    [onUpload],
  );

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    noClick: true,
    onDrop,
    onDropRejected: () => {
      setSelectionError("Please choose a JPEG, PNG, or WEBP image.");
    },
  });

  const aspect = selectedPhotoSize.widthMm / selectedPhotoSize.heightMm;
  const canShowCropper = Boolean(image);
  const isRemovingBackground = backgroundRemovalStatus === "loading";
  const backgroundLabel =
    backgroundRemovalStatus !== "applied"
      ? "Original"
      : selectedBackgroundColor === TRANSPARENT_BACKGROUND_VALUE
      ? "Transparent"
      : selectedBackgroundColor === DEFAULT_ID_BACKGROUND_COLOR
          ? "Blue"
          : selectedBackgroundColor === "#FFFFFF"
            ? "White"
            : "Custom";

  return (
    <section className="mx-auto grid w-full max-w-[1500px] gap-8 px-4 py-6 lg:grid-cols-[1fr_280px] lg:px-6">
      <div>
        <h1 className="font-geist text-[44px] font-semibold tracking-tight text-slate-900">
          Upload Photo
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Upload and position your photo first. If needed, remove the background from this same screen before continuing.
        </p>

        <div
          {...getRootProps()}
          className={`mt-8 flex min-h-[420px] flex-col border border-dashed px-6 py-6 text-center transition ${
            isDragActive ? "border-brand-500 bg-brand-50" : "border-[#cfd6ec] bg-[#f5f7ff]"
          }`}
        >
          <input {...getInputProps()} />

          {image && canShowCropper ? (
            <div className="flex h-full w-full flex-col">
              <div className="relative flex min-h-[420px] flex-1 items-center justify-center overflow-hidden">
                <Cropper
                  image={cropperImage ?? backgroundRemovedImage ?? image}
                  crop={crop}
                  zoom={cropZoom}
                  rotation={cropRotation}
                  aspect={aspect}
                  showGrid={false}
                  cropShape="rect"
                  objectFit="contain"
                  restrictPosition={false}
                  style={{
                    containerStyle: {
                      background:
                        backgroundRemovalStatus === "applied" &&
                        selectedBackgroundColor === TRANSPARENT_BACKGROUND_VALUE
                          ? "linear-gradient(45deg, #d6dcec 25%, transparent 25%), linear-gradient(-45deg, #d6dcec 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d6dcec 75%), linear-gradient(-45deg, transparent 75%, #d6dcec 75%), #f8f9ff"
                          : "#f5f7ff",
                      backgroundSize:
                        backgroundRemovalStatus === "applied" &&
                        selectedBackgroundColor === TRANSPARENT_BACKGROUND_VALUE
                          ? "16px 16px"
                          : undefined,
                      backgroundPosition:
                        backgroundRemovalStatus === "applied" &&
                        selectedBackgroundColor === TRANSPARENT_BACKGROUND_VALUE
                          ? "0 0, 0 8px, 8px -8px, -8px 0"
                          : undefined,
                    },
                    cropAreaStyle: {
                      border: "2px dashed rgba(15,23,42,0.95)",
                      boxShadow: "0 0 0 9999px rgba(15,23,42,0.12)",
                      borderRadius: "4px",
                    },
                  }}
                  onCropChange={onCropChange}
                  onZoomChange={onCropZoomChange}
                  onRotationChange={onCropRotationChange}
                  onCropComplete={(areaPercent, areaPixels) =>
                    onCropComplete(areaPercent as CropArea, areaPixels as CropArea)
                  }
                />
              </div>

              <div className="mt-5 flex flex-col items-center gap-4">
                <div className="w-full max-w-[520px]">
                  <span className="mb-2 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
                    <ZoomIn className="h-4 w-4 text-brand-600" />
                    Zoom
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={cropZoom}
                    onChange={(event) => onCropZoomChange(Number(event.target.value))}
                    className="w-full accent-brand-600"
                  />
                </div>

                <div className="w-full max-w-[520px]">
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <RotateCw className="h-4 w-4 text-brand-600" />
                      Rotate
                    </span>
                    <span>{cropRotation}&deg;</span>
                  </div>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    step={1}
                    value={cropRotation}
                    onChange={(event) => onCropRotationChange(Number(event.target.value))}
                    className="w-full accent-brand-600"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => onCropRotationChange(cropRotation - 90)}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#d3d8ea] bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Rotate Left
                  </button>
                  <button
                    type="button"
                    onClick={() => onCropRotationChange(cropRotation + 90)}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#d3d8ea] bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <RotateCw className="h-4 w-4" />
                    Rotate Right
                  </button>
                  <button
                    type="button"
                    onClick={open}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#d3d8ea] bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Replace className="h-4 w-4" />
                    Replace Photo
                  </button>
                  <button
                    type="button"
                    onClick={onRemoveBackground}
                    disabled={isRemovingBackground || !originalFile}
                    className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium transition disabled:cursor-not-allowed ${
                      isRemovingBackground
                        ? "border border-brand-600 bg-brand-600 text-white shadow-[0_8px_24px_rgba(83,75,221,0.22)]"
                        : "border border-[#d3d8ea] bg-white text-slate-700 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400"
                    }`}
                  >
                    {isRemovingBackground ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Scissors className="h-4 w-4" />
                    )}
                    {isRemovingBackground ? "Removing Background..." : "Remove Background"}
                  </button>
                  <button
                    type="button"
                    onClick={onReset}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#d3d8ea] bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Reset
                  </button>
                </div>
              </div>

              {isRemovingBackground || backgroundRemovalStatus === "applied" ? (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-xl border border-[#d9deef] bg-white px-3 py-2 text-sm text-slate-600">
                    <PaintBucket className="h-4 w-4 text-brand-600" />
                    {isRemovingBackground
                      ? backgroundRemovalMessage ?? "Removing background..."
                      : "Background color"}
                    {isRemovingBackground && typeof backgroundRemovalProgress === "number" ? (
                      <span className="font-medium text-brand-700">
                        {backgroundRemovalProgress}%
                      </span>
                    ) : null}
                  </div>

                  {backgroundRemovalStatus === "applied" ? (
                    <>
                      <ColorChoice
                        label="Blue"
                        value={DEFAULT_ID_BACKGROUND_COLOR}
                        selected={selectedBackgroundColor === DEFAULT_ID_BACKGROUND_COLOR}
                        swatch={DEFAULT_ID_BACKGROUND_COLOR}
                        onClick={onBackgroundColorChange}
                      />
                      <ColorChoice
                        label="White"
                        value="#FFFFFF"
                        selected={selectedBackgroundColor === "#FFFFFF"}
                        swatch="#FFFFFF"
                        onClick={onBackgroundColorChange}
                      />
                      <ColorChoice
                        label="Transparent"
                        value={TRANSPARENT_BACKGROUND_VALUE}
                        selected={selectedBackgroundColor === TRANSPARENT_BACKGROUND_VALUE}
                        swatch="checkerboard"
                        onClick={onBackgroundColorChange}
                      />
                      <label className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#d3d8ea] bg-white px-3 text-sm text-slate-700">
                        <span>Custom</span>
                        <input
                          type="color"
                          value={
                            selectedBackgroundColor === TRANSPARENT_BACKGROUND_VALUE
                              ? DEFAULT_ID_BACKGROUND_COLOR
                              : selectedBackgroundColor
                          }
                          onChange={(event) => onBackgroundColorChange(event.target.value)}
                          className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
                        />
                      </label>
                    </>
                  ) : null}
                </div>
              ) : null}

              {warning ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-800">
                  {warning}
                </div>
              ) : null}

              {backgroundRemovalError ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-800">
                  {backgroundRemovalError}
                </div>
              ) : null}

              {backgroundRemovalStatus === "applied" ? (
                <div className="mt-4 text-center text-sm text-slate-500">
                  Background removed and applied to the current crop view.
                </div>
              ) : null}
            </div>
          ) : (
            <div className="m-auto">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                <ImagePlus className="h-7 w-7" />
              </div>
              <h2 className="mt-6 font-geist text-[38px] font-semibold tracking-tight text-slate-900">
                Drag &amp; drop image here
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                or click to browse from your computer
              </p>
              <button
                type="button"
                onClick={open}
                className="mt-6 rounded-xl bg-brand-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-700"
              >
                Choose Photo
              </button>
              {selectionError ? (
                <p className="mt-4 text-sm text-amber-700">{selectionError}</p>
              ) : null}
            </div>
          )}
        </div>
        {image && selectionError ? (
          <p className="mt-4 text-sm text-amber-700">{selectionError}</p>
        ) : null}
      </div>

      <aside className="border-l border-[#d9deef] pl-6 md:flex md:flex-col">
        <div className="flex items-center gap-2 border-b border-[#e4e7f3] pb-4">
          <FileBadge2 className="h-5 w-5 text-brand-600" />
          <h3 className="font-geist text-2xl font-semibold text-slate-900">Image Details</h3>
        </div>

        <div className="mt-5 space-y-5">
          <SummaryItem
            icon={<FileImage className="h-4 w-4 text-brand-600" />}
            label="Photo Size"
            value={`${selectedPhotoSize.widthMm}x${selectedPhotoSize.heightMm}mm`}
          />
          <SummaryItem
            icon={<FileBadge2 className="h-4 w-4 text-brand-600" />}
            label="Paper Format"
            value={selectedPaperSize.label}
          />
          <SummaryItem
            icon={<CircleAlert className="h-4 w-4 text-brand-600" />}
            label="Background"
            value={backgroundLabel}
          />
        </div>

        <label className="mt-6 block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
            Photo Size
          </span>
          <select
            value={selectedPhotoSize.label}
            onChange={(event) => {
              const next = photoSizePresets.find((item) => item.label === event.target.value);
              if (next) {
                onPhotoSizeChange(next);
              }
            }}
            className="h-11 w-full rounded-xl border border-[#cfd6ec] bg-white px-3 text-sm text-slate-900 outline-none ring-brand-500 transition focus:ring-2"
          >
            {photoSizePresets.map((size) => (
              <option key={size.label} value={size.label}>
                {size.label}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-8 md:mt-auto md:pb-2">
          <button
            type="button"
            onClick={onNext}
            disabled={!image || isGenerating}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#eef1fb] text-sm font-medium text-slate-500 transition hover:bg-[#e4e9fb] disabled:cursor-not-allowed disabled:opacity-100 enabled:bg-brand-600 enabled:text-white"
          >
            {isGenerating ? "Preparing crop..." : "Next"}
          </button>
        </div>
      </aside>
    </section>
  );
}

function ColorChoice({
  label,
  value,
  selected,
  swatch,
  onClick,
}: {
  label: string;
  value: string;
  selected: boolean;
  swatch: string;
  onClick: (value: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`inline-flex h-11 items-center gap-2 rounded-xl border px-3 text-sm transition ${
        selected
          ? "border-brand-600 bg-brand-50 text-brand-700"
          : "border-[#d3d8ea] bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      <span
        className={`h-4 w-4 rounded-full border border-slate-200 ${
          swatch === "checkerboard" ? "checkerboard-bg" : ""
        }`}
        style={swatch === "checkerboard" ? undefined : { backgroundColor: swatch }}
      />
      {label}
    </button>
  );
}

function SummaryItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-1 font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}
