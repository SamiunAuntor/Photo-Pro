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
  getCenteredCropArea,
  getCroppedImageDataUrl,
  getPixelCropFromStoredArea,
} from "@/lib/image/cropImage";
import { createPrintJob } from "@/lib/print/createPrintJob";
import { savePrintJob } from "@/lib/print/printJobStorage";
import { usePhotoStore } from "@/store/photoStore";
import { PhotoSize, PrintJob, Step } from "@/types/photo";

const OUTPUT_PIXELS_PER_MM = 20;

function normalizeRotation(rotation: number) {
  const normalized = ((rotation + 180) % 360 + 360) % 360 - 180;
  return normalized === -180 ? 180 : normalized;
}

export default function HomePage() {
  const router = useRouter();
  const store = usePhotoStore();
  const [isPreparingCrop, setIsPreparingCrop] = useState(false);
  const [isAutoOptimizing, setIsAutoOptimizing] = useState(false);
  const [isApplyingOptimization, setIsApplyingOptimization] = useState(false);
  const [cropWarning, setCropWarning] = useState<string | null>(null);
  const [optimizeWarning, setOptimizeWarning] = useState<string | null>(null);

  const generateCrop = useCallback(
    async (photoSizeOverride?: PhotoSize) => {
      if (!store.originalImage) {
        return false;
      }

      const activePhotoSize = photoSizeOverride ?? store.selectedPhotoSize;
      const aspect = activePhotoSize.widthMm / activePhotoSize.heightMm;
      const rotation = store.cropRotation;

      setIsPreparingCrop(true);

      try {
        const pixelCrop = store.cropAreaPercent
          ? await getPixelCropFromStoredArea({
              imageSrc: store.originalImage,
              storedArea: store.cropAreaPercent,
              aspect,
              rotation,
            })
          : await getCenteredCropArea({
              imageSrc: store.originalImage,
              aspect,
              rotation,
            });

        const croppedImage = await getCroppedImageDataUrl({
          imageSrc: store.originalImage,
          pixelCrop,
          outputWidth: Math.round(activePhotoSize.widthMm * OUTPUT_PIXELS_PER_MM),
          outputHeight: Math.round(activePhotoSize.heightMm * OUTPUT_PIXELS_PER_MM),
          rotation,
        });

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
          crop={store.crop}
          cropZoom={store.cropZoom}
          cropRotation={store.cropRotation}
          selectedPhotoSize={store.selectedPhotoSize}
          selectedPaperSize={store.selectedPaperSize}
          warning={cropWarning}
          isGenerating={isPreparingCrop}
          onUpload={(image) => {
            store.setOriginalImage(image);
            store.setProcessedImage(null);
            store.setCrop({ x: 0, y: 0 });
            store.setCropZoom(1);
            store.setCropRotation(0);
            store.setCropAreaPixels(null);
            store.setCropAreaPercent(null);
            store.resetOptimization();
            setCropWarning(null);
            setOptimizeWarning(null);
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
