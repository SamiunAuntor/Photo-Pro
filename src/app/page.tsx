"use client";

import { jsPDF } from "jspdf";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutStep } from "@/components/LayoutStep";
import { OptimizeStep } from "@/components/OptimizeStep";
import { ProcessingStep } from "@/components/ProcessingStep";
import { UploadStep } from "@/components/UploadStep";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { getOptimizationValues } from "@/lib/ai/getOptimizationValues";
import {
  applyOptimizationToImage,
  neutralOptimizationValues,
  normalizeOptimizationValues,
} from "@/lib/image/applyOptimization";
import {
  composeBackground,
  DEFAULT_ID_BACKGROUND_COLOR,
  TRANSPARENT_BACKGROUND_VALUE,
} from "@/lib/image/composeBackground";
import {
  getCenteredCropArea,
  getCroppedImageDataUrl,
  getPixelCropFromStoredArea,
} from "@/lib/image/cropImage";
import { fileToDataUrl } from "@/lib/image/fileToDataUrl";
import { warmBackgroundRemover } from "@/lib/image/backgroundRemovalRuntime";
import { removeBackgroundInBrowser } from "@/lib/image/removeBackgroundBrowser";
import { createPrintJob } from "@/lib/print/createPrintJob";
import { savePrintJob } from "@/lib/print/printJobStorage";
import { usePhotoStore } from "@/store/photoStore";
import { PhotoSize, PrintJob, Step } from "@/types/photo";

const OUTPUT_PIXELS_PER_MM = 20;

function normalizeRotation(rotation: number) {
  const normalized = ((rotation + 180) % 360 + 360) % 360 - 180;
  return normalized === -180 ? 180 : normalized;
}

function scheduleBackgroundRemoverWarmup(task: () => void) {
  if (typeof window === "undefined") {
    return;
  }

  const requestIdleCallback = (
    window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    }
  ).requestIdleCallback;

  if (requestIdleCallback) {
    requestIdleCallback(() => task(), { timeout: 1200 });
    return;
  }

  window.setTimeout(task, 200);
}

async function waitForNextPaint() {
  if (typeof window === "undefined") {
    return;
  }

  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

  await new Promise<void>((resolve) => {
    window.setTimeout(() => resolve(), 0);
  });
}

export default function HomePage() {
  const router = useRouter();
  const store = usePhotoStore();
  const [isPreparingCrop, setIsPreparingCrop] = useState(false);
  const [isAutoOptimizing, setIsAutoOptimizing] = useState(false);
  const [isApplyingOptimization, setIsApplyingOptimization] = useState(false);
  const [cropperPreviewImage, setCropperPreviewImage] = useState<string | null>(null);
  const [cropWarning, setCropWarning] = useState<string | null>(null);
  const [optimizeWarning, setOptimizeWarning] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function syncCropPreview() {
      if (store.backgroundRemovalStatus === "applied" && store.backgroundRemovedImage) {
        if (store.selectedBackgroundColor === TRANSPARENT_BACKGROUND_VALUE) {
          setCropperPreviewImage(store.backgroundRemovedImage);
          return;
        }

        try {
          const composed = await composeBackground(
            store.backgroundRemovedImage,
            store.selectedBackgroundColor,
          );

          if (!isCancelled) {
            setCropperPreviewImage(composed);
          }
        } catch {
          if (!isCancelled) {
            setCropperPreviewImage(store.backgroundRemovedImage);
          }
        }

        return;
      }

      setCropperPreviewImage(store.originalImage);
    }

    void syncCropPreview();

    return () => {
      isCancelled = true;
    };
  }, [
    store.backgroundRemovedImage,
    store.backgroundRemovalStatus,
    store.originalImage,
    store.selectedBackgroundColor,
  ]);

  const generateCrop = useCallback(
    async (photoSizeOverride?: PhotoSize) => {
      const cropSourceImage =
        store.backgroundRemovalStatus === "applied" && store.backgroundRemovedImage
          ? store.backgroundRemovedImage
          : store.originalImage;

      if (!cropSourceImage) {
        return false;
      }

      const activePhotoSize = photoSizeOverride ?? store.selectedPhotoSize;
      const aspect = activePhotoSize.widthMm / activePhotoSize.heightMm;
      const rotation = store.cropRotation;

      setIsPreparingCrop(true);

      try {
        const pixelCrop = store.cropAreaPercent
          ? await getPixelCropFromStoredArea({
              imageSrc: cropSourceImage,
              storedArea: store.cropAreaPercent,
              aspect,
              rotation,
            })
          : await getCenteredCropArea({
              imageSrc: cropSourceImage,
              aspect,
              rotation,
            });

        let croppedImage = await getCroppedImageDataUrl({
          imageSrc: cropSourceImage,
          pixelCrop,
          outputWidth: Math.round(activePhotoSize.widthMm * OUTPUT_PIXELS_PER_MM),
          outputHeight: Math.round(activePhotoSize.heightMm * OUTPUT_PIXELS_PER_MM),
          rotation,
        });

        if (
          store.backgroundRemovalStatus === "applied" &&
          store.backgroundRemovedImage &&
          store.selectedBackgroundColor !== TRANSPARENT_BACKGROUND_VALUE
        ) {
          croppedImage = await composeBackground(croppedImage, store.selectedBackgroundColor);
        }

        store.setCropAreaPixels(pixelCrop);
        store.setProcessedImage(croppedImage);
        store.resetOptimization();
        setCropWarning(null);
        setOptimizeWarning(null);
        return true;
      } catch {
        store.setProcessedImage(null);
        setCropWarning("Could not crop the image. Please try another photo.");
        return false;
      } finally {
        setIsPreparingCrop(false);
      }
    },
    [store],
  );

  useEffect(() => {
    if (store.currentStep !== "processing" || !store.originalImage || store.processedImage) {
      return;
    }

    void generateCrop();
  }, [generateCrop, store.currentStep, store.originalImage, store.processedImage]);

  const currentJob = useMemo(() => {
    const outputImage = store.optimizedImage ?? store.processedImage;

    if (!outputImage) {
      return null;
    }

    return createPrintJob({
      image: outputImage,
      paperSize: store.selectedPaperSize,
      photoSize: store.selectedPhotoSize,
      marginMm: store.marginMm,
      gapMm: store.gapMm,
      cutMarks: store.cutMarks,
      border: store.border,
    });
  }, [
    store.border,
    store.cutMarks,
    store.gapMm,
    store.marginMm,
    store.optimizedImage,
    store.processedImage,
    store.selectedPaperSize,
    store.selectedPhotoSize,
  ]);

  const appliedCopies = useMemo(() => {
    if (!currentJob) {
      return 0;
    }

    return store.copies === "auto"
      ? currentJob.total
      : Math.min(store.copies, currentJob.total);
  }, [currentJob, store.copies]);

  async function handleDownloadPdf(job: PrintJob, copies: number) {
    const orientation =
      job.paperWidthMm > job.paperHeightMm ? "landscape" : "portrait";
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format: [job.paperWidthMm, job.paperHeightMm],
    });

    const imageFormat = job.image.startsWith("data:image/png") ? "PNG" : "JPEG";

    for (let index = 0; index < copies; index += 1) {
      const column = index % job.columns;
      const row = Math.floor(index / job.columns);
      const x = job.marginMm + column * (job.photoWidthMm + job.gapMm);
      const y = job.marginMm + row * (job.photoHeightMm + job.gapMm);

      pdf.addImage(job.image, imageFormat, x, y, job.photoWidthMm, job.photoHeightMm);

      if (job.border) {
        pdf.setDrawColor(120);
        pdf.rect(x, y, job.photoWidthMm, job.photoHeightMm);
      }
    }

    pdf.save("photopro-print-sheet.pdf");
  }

  function handlePrint(job: PrintJob, copies: number) {
    savePrintJob({
      ...job,
      total: copies,
    });
    router.push("/print");
  }

  function canVisitStep(step: Step) {
    switch (step) {
      case "upload":
        return true;
      case "processing":
        return Boolean(store.originalImage);
      case "optimize":
        return Boolean(store.processedImage);
      case "layout":
        return Boolean(store.processedImage);
      default:
        return false;
    }
  }

  function safeStepChange(step: Step) {
    if (!canVisitStep(step)) {
      return;
    }

    store.setCurrentStep(step);
  }

  return (
    <WorkspaceShell
      currentStep={store.currentStep}
      onStepChange={safeStepChange}
      canVisitStep={canVisitStep}
    >
      {store.currentStep === "upload" ? (
        <UploadStep
          image={store.originalImage}
          cropperImage={cropperPreviewImage}
          originalFile={store.originalFile}
          backgroundRemovedImage={store.backgroundRemovedImage}
          backgroundRemovalStatus={store.backgroundRemovalStatus}
          backgroundRemovalProgress={store.backgroundRemovalProgress}
          backgroundRemovalMessage={store.backgroundRemovalMessage}
          backgroundRemovalError={store.backgroundRemovalError}
          selectedBackgroundColor={store.selectedBackgroundColor}
          crop={store.crop}
          cropZoom={store.cropZoom}
          cropRotation={store.cropRotation}
          selectedPhotoSize={store.selectedPhotoSize}
          selectedPaperSize={store.selectedPaperSize}
          warning={cropWarning}
          isGenerating={isPreparingCrop}
          onUpload={(file, image) => {
            store.setOriginalFile(file);
            store.setOriginalImage(image);
            store.setBackgroundRemovedImage(null);
            store.setBackgroundRemovalStatus("idle");
            store.setBackgroundRemovalProgress(null);
            store.setBackgroundRemovalMessage(null);
            store.setBackgroundRemovalError(null);
            store.setSelectedBackgroundColor(DEFAULT_ID_BACKGROUND_COLOR);
            store.setProcessedImage(null);
            store.setCrop({ x: 0, y: 0 });
            store.setCropZoom(1);
            store.setCropRotation(0);
            store.setCropAreaPixels(null);
            store.setCropAreaPercent(null);
            store.resetOptimization();
            setCropperPreviewImage(image);
            setCropWarning(null);
            setOptimizeWarning(null);

            scheduleBackgroundRemoverWarmup(() => {
              void warmBackgroundRemover((progress) => {
                store.setBackgroundRemovalProgress(progress.percentage ?? null);
                store.setBackgroundRemovalMessage(progress.message ?? null);
              }).catch(() => {
                store.setBackgroundRemovalProgress(null);
                store.setBackgroundRemovalMessage(null);
              });
            });
          }}
          onRemoveBackground={async () => {
            if (!store.originalFile) {
              return;
            }

            store.setBackgroundRemovalStatus("loading");
            store.setBackgroundRemovalProgress(0);
            store.setBackgroundRemovalMessage("Preparing background remover...");
            store.setBackgroundRemovalError(null);
            store.setProcessedImage(null);
            store.resetOptimization();
            setCropWarning(null);

            await waitForNextPaint();

            try {
              const resultBlob = await removeBackgroundInBrowser(
                store.originalFile,
                (progress) => {
                  store.setBackgroundRemovalProgress(progress.percentage ?? null);
                  store.setBackgroundRemovalMessage(progress.message ?? null);
                },
              );
              const resultDataUrl = await fileToDataUrl(resultBlob);
              store.setBackgroundRemovedImage(resultDataUrl);
              store.setBackgroundRemovalStatus("applied");
              store.setBackgroundRemovalProgress(null);
              store.setBackgroundRemovalMessage(null);
              store.setBackgroundRemovalError(null);
            } catch {
              store.setBackgroundRemovedImage(null);
              store.setBackgroundRemovalStatus("error");
              store.setBackgroundRemovalProgress(null);
              store.setBackgroundRemovalMessage(null);
              store.setBackgroundRemovalError(
                "Background removal could not be completed on this device. You can retry or continue with the original photo.",
              );
            }
          }}
          onBackgroundColorChange={(color) => {
            store.setSelectedBackgroundColor(color);
            store.setProcessedImage(null);
            store.resetOptimization();
          }}
          onCropChange={(crop) => {
            store.setCrop(crop);
            store.setProcessedImage(null);
            store.resetOptimization();
          }}
          onCropZoomChange={(zoom) => {
            store.setCropZoom(zoom);
            store.setProcessedImage(null);
            store.resetOptimization();
          }}
          onCropRotationChange={(rotation) => {
            store.setCropRotation(normalizeRotation(rotation));
            store.setProcessedImage(null);
            store.resetOptimization();
          }}
          onCropComplete={(areaPercent, areaPixels) => {
            store.setCropAreaPercent(areaPercent);
            store.setCropAreaPixels(areaPixels);
          }}
          onPhotoSizeChange={(size) => {
            store.setSelectedPhotoSize(size);
            store.setProcessedImage(null);
            store.resetOptimization();
          }}
          onNext={async () => {
            const success = await generateCrop();

            if (success) {
              safeStepChange("processing");
            }
          }}
          onReset={() => {
            store.reset();
            setCropperPreviewImage(null);
            setCropWarning(null);
          }}
        />
      ) : null}

      {store.currentStep === "processing" && store.originalImage ? (
        <ProcessingStep
          originalImage={store.originalImage}
          processedImage={store.processedImage}
          warning={cropWarning}
          isLoading={isPreparingCrop}
          onBack={() => safeStepChange("upload")}
          onNext={() => safeStepChange("optimize")}
        />
      ) : null}

      {store.currentStep === "optimize" && store.processedImage ? (
        <OptimizeStep
          image={store.processedImage}
          values={store.optimizationValues}
          warning={optimizeWarning}
          isAutoOptimizing={isAutoOptimizing}
          isApplying={isApplyingOptimization}
          onValueChange={(key, value) => {
            store.setOptimizationValues(
              normalizeOptimizationValues({
                ...store.optimizationValues,
                [key]: value,
                reason: "Manual adjustments ready for print preview.",
              }),
            );
            setOptimizeWarning(null);
          }}
          onAutoOptimize={async () => {
            const imageToOptimize = store.processedImage;

            if (!imageToOptimize) {
              return;
            }

            setIsAutoOptimizing(true);

            try {
              const result = await getOptimizationValues(imageToOptimize);
              store.setOptimizationValues(result.values);
              setOptimizeWarning(result.warning);
            } finally {
              setIsAutoOptimizing(false);
            }
          }}
          onReset={() => {
            store.setOptimizationValues(neutralOptimizationValues);
            store.setOptimizedImage(null);
            setOptimizeWarning(null);
          }}
          onBack={() => safeStepChange("processing")}
          onApply={async () => {
            const imageToOptimize = store.processedImage;

            if (!imageToOptimize) {
              return;
            }

            setIsApplyingOptimization(true);

            try {
              const optimizedImage = await applyOptimizationToImage(
                imageToOptimize,
                store.optimizationValues,
              );
              store.setOptimizedImage(optimizedImage);
              safeStepChange("layout");
            } catch {
              store.setOptimizedImage(imageToOptimize);
              setOptimizeWarning("Auto optimization unavailable. You can adjust manually.");
              safeStepChange("layout");
            } finally {
              setIsApplyingOptimization(false);
            }
          }}
        />
      ) : null}

      {store.currentStep === "layout" && store.processedImage ? (
        <LayoutStep
          image={store.optimizedImage ?? store.processedImage}
          selectedPhotoSize={store.selectedPhotoSize}
          selectedPaperSize={store.selectedPaperSize}
          marginMm={store.marginMm}
          gapMm={store.gapMm}
          cutMarks={store.cutMarks}
          border={store.border}
          copies={store.copies}
          onPhotoSizeChange={(size) => {
            store.setSelectedPhotoSize(size);
            void generateCrop(size);
          }}
          onPaperSizeChange={store.setSelectedPaperSize}
          onMarginChange={store.setMarginMm}
          onGapChange={store.setGapMm}
          onCutMarksChange={store.setCutMarks}
          onBorderChange={store.setBorder}
          onCopiesChange={store.setCopies}
          onBack={() => safeStepChange("optimize")}
          onPrint={handlePrint}
          onDownloadPdf={handleDownloadPdf}
        />
      ) : null}
    </WorkspaceShell>
  );
}
