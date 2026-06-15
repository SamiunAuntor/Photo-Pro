"use client";

import { PrintSheet } from "@/components/PrintSheet";
import { SettingsPanel } from "@/components/SettingsPanel";
import { calculateGrid } from "@/lib/layout/calculateGrid";
import { PaperSize, PhotoSize, PrintJob } from "@/types/photo";

type LayoutStepProps = {
  image: string;
  selectedPhotoSize: PhotoSize;
  selectedPaperSize: PaperSize;
  marginMm: number;
  gapMm: number;
  cutMarks: boolean;
  border: boolean;
  copies: "auto" | number;
  onPhotoSizeChange: (size: PhotoSize) => void;
  onPaperSizeChange: (size: PaperSize) => void;
  onMarginChange: (value: number) => void;
  onGapChange: (value: number) => void;
  onCutMarksChange: (value: boolean) => void;
  onBorderChange: (value: boolean) => void;
  onCopiesChange: (value: "auto" | number) => void;
  onBack: () => void;
  onPrint: (job: PrintJob, copies: number) => void;
  onDownloadPdf: (job: PrintJob, copies: number) => void;
};

export function LayoutStep(props: LayoutStepProps) {
  const {
    image,
    selectedPhotoSize,
    selectedPaperSize,
    marginMm,
    gapMm,
    cutMarks,
    border,
    copies,
    onPhotoSizeChange,
    onPaperSizeChange,
    onMarginChange,
    onGapChange,
    onCutMarksChange,
    onBorderChange,
    onCopiesChange,
    onBack,
    onPrint,
    onDownloadPdf,
  } = props;

  const grid = calculateGrid({
    paperWidthMm: selectedPaperSize.widthMm,
    paperHeightMm: selectedPaperSize.heightMm,
    photoWidthMm: selectedPhotoSize.widthMm,
    photoHeightMm: selectedPhotoSize.heightMm,
    marginMm,
    gapMm,
  });

  const appliedCopies = copies === "auto" ? grid.total : Math.min(copies, grid.total);
  const hasSlots = grid.total > 0;
  const job: PrintJob = {
    image,
    paperWidthMm: selectedPaperSize.widthMm,
    paperHeightMm: selectedPaperSize.heightMm,
    photoWidthMm: selectedPhotoSize.widthMm,
    photoHeightMm: selectedPhotoSize.heightMm,
    marginMm,
    gapMm,
    columns: grid.columns,
    rows: grid.rows,
    total: grid.total,
    cutMarks,
    border,
  };

  return (
    <section className="mx-auto grid w-full max-w-[1500px] xl:items-start xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="bg-[#edf1ff] px-4 py-5 md:px-6">
        <div className="flex justify-center">
          <div className="relative overflow-hidden">
            <PrintSheet job={job} copies={appliedCopies} previewScale={0.6} />
            {!hasSlots ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 text-center">
                <div className="max-w-xs">
                  <p className="font-geist text-xl font-semibold text-slate-900">
                    No copies fit with these settings
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Reduce the margin or choose a smaller photo size to continue.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <SettingsPanel
        selectedPhotoSize={selectedPhotoSize}
        selectedPaperSize={selectedPaperSize}
        marginMm={marginMm}
        gapMm={gapMm}
        cutMarks={cutMarks}
        border={border}
        copies={copies}
        onPhotoSizeChange={onPhotoSizeChange}
        onPaperSizeChange={onPaperSizeChange}
        onMarginChange={onMarginChange}
        onGapChange={onGapChange}
        onCutMarksChange={onCutMarksChange}
        onBorderChange={onBorderChange}
        onCopiesChange={onCopiesChange}
        onBack={onBack}
        onPrint={() => onPrint(job, appliedCopies)}
        onDownloadPdf={() => onDownloadPdf(job, appliedCopies)}
        canContinue={hasSlots}
      />
    </section>
  );
}
