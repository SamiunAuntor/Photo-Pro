"use client";

import { CheckCircle2, LoaderCircle } from "lucide-react";

type ProcessingStepProps = {
  originalImage: string;
  processedImage: string | null;
  warning?: string | null;
  isLoading: boolean;
  onBack: () => void;
  onNext: () => void;
};

export function ProcessingStep({
  originalImage,
  processedImage,
  warning,
  isLoading,
  onBack,
  onNext,
}: ProcessingStepProps) {
  const hasResult = Boolean(processedImage);

  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 py-6 lg:px-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            Step 2 of 4
          </p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <h1 className="font-geist text-[32px] font-semibold tracking-tight text-slate-900 md:text-[36px]">
                Crop Preview
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Review the original upload beside the prepared passport crop before creating the print layout.
              </p>
            </div>
            <div className="hidden rounded-full border border-[#d9deef] bg-[#eef2ff] px-4 py-2 text-sm text-slate-700 md:inline-flex md:items-center md:gap-2">
              {isLoading ? (
                <LoaderCircle className="h-4 w-4 animate-spin text-brand-600" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              )}
              {isLoading ? "Preparing crop preview..." : "Ready for print layout"}
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <PhotoCard title="Original Photo" image={originalImage} />
            <PhotoCard
              title="Cropped Photo"
              image={processedImage}
              isLoading={isLoading}
              badge={hasResult && !isLoading ? "Ready" : undefined}
              highlighted
            />
          </div>
        </div>

        <aside className="flex flex-col border-l border-[#d9deef] pl-5">
          <div className="border-b border-[#e4e7f3] pb-4">
            <h3 className="font-geist text-[24px] font-semibold text-slate-900">
              Preview Details
            </h3>
            <p className="mt-2 text-sm text-slate-500">Confirm the crop before layout generation</p>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <Detail text="Original photo stays untouched as your source image." />
            <Detail text="The cropped photo is what will be repeated on the print sheet." />
            <Detail text={warning ?? "The crop is ready for layout preview and PDF export."} />
          </div>

          <div className="mt-auto flex gap-3 pt-6">
            <button
              type="button"
              onClick={onBack}
              className="h-11 flex-1 rounded-xl border border-[#d3d8ea] bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!hasResult || isLoading}
              className="h-11 flex-1 rounded-xl bg-brand-600 px-5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Next
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}

function PhotoCard({
  title,
  image,
  isLoading = false,
  highlighted = false,
  badge,
}: {
  title: string;
  image: string | null;
  isLoading?: boolean;
  highlighted?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={`border bg-white p-3 ${
        highlighted ? "border-brand-500 shadow-[0_0_0_3px_rgba(79,70,229,0.08)]" : "border-[#d9deef]"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">{title}</p>
        {badge ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex h-[260px] items-center justify-center overflow-hidden border border-[#e3e6f2] bg-[#f8f9ff] p-3 md:h-[300px]">
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 text-brand-600">
            <LoaderCircle className="h-6 w-6 animate-spin" />
            <span className="text-sm">Processing photo...</span>
          </div>
        ) : image ? (
          <img src={image} alt={title} className="h-full w-full object-contain" />
        ) : (
          <p className="text-sm text-slate-400">No image yet</p>
        )}
      </div>
    </div>
  );
}

function Detail({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      <span>{text}</span>
    </div>
  );
}
