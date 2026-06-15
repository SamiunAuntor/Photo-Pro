"use client";

import { jsPDF } from "jspdf";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutStep } from "@/components/LayoutStep";
import { ProcessingStep } from "@/components/ProcessingStep";
import { UploadStep } from "@/components/UploadStep";
import { WorkspaceShell } from "@/components/WorkspaceShell";
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

export default function HomePage() {
  const router = useRouter();
  const store = usePhotoStore();
  const [isPreparingCrop, setIsPreparingCrop] = useState(false);
  const [cropWarning, setCropWarning] = useState<string | null>(null);

  const generateCrop = useCallback(
    async (photoSizeOverride?: PhotoSize) => {
      if (!store.originalImage) {
        return false;
      }

      const activePhotoSize = photoSizeOverride ?? store.selectedPhotoSize;
      const aspect = activePhotoSize.widthMm / activePhotoSize.heightMm;

      setIsPreparingCrop(true);

      try {
        const pixelCrop = store.cropAreaPercent
          ? await getPixelCropFromStoredArea({
              imageSrc: store.originalImage,
              storedArea: store.cropAreaPercent,
              aspect,
            })
          : await getCenteredCropArea({
              imageSrc: store.originalImage,
              aspect,
            });

        const croppedImage = await getCroppedImageDataUrl({
          imageSrc: store.originalImage,
          pixelCrop,
          outputWidth: Math.round(activePhotoSize.widthMm * OUTPUT_PIXELS_PER_MM),
          outputHeight: Math.round(activePhotoSize.heightMm * OUTPUT_PIXELS_PER_MM),
        });

        store.setCropAreaPixels(pixelCrop);
        store.setProcessedImage(croppedImage);
        setCropWarning(null);
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
    if (!store.processedImage) {
      return null;
    }

    return createPrintJob({
      image: store.processedImage,
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
          selectedPhotoSize={store.selectedPhotoSize}
          selectedPaperSize={store.selectedPaperSize}
          warning={cropWarning}
          isGenerating={isPreparingCrop}
          onUpload={(image) => {
            store.setOriginalImage(image);
            store.setProcessedImage(null);
            store.setCrop({ x: 0, y: 0 });
            store.setCropZoom(1);
            store.setCropAreaPixels(null);
            store.setCropAreaPercent(null);
            setCropWarning(null);
          }}
          onCropChange={(crop) => {
            store.setCrop(crop);
            store.setProcessedImage(null);
          }}
          onCropZoomChange={(zoom) => {
            store.setCropZoom(zoom);
            store.setProcessedImage(null);
          }}
          onCropComplete={(areaPercent, areaPixels) => {
            store.setCropAreaPercent(areaPercent);
            store.setCropAreaPixels(areaPixels);
          }}
          onPhotoSizeChange={(size) => {
            store.setSelectedPhotoSize(size);
            store.setProcessedImage(null);
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
          onNext={() => safeStepChange("layout")}
        />
      ) : null}

      {store.currentStep === "layout" && store.processedImage ? (
        <LayoutStep
          image={store.processedImage}
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
          onBack={() => safeStepChange("processing")}
          onPrint={handlePrint}
          onDownloadPdf={handleDownloadPdf}
        />
      ) : null}
    </WorkspaceShell>
  );
}
