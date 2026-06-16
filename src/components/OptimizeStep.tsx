"use client";

import { CheckCircle2, LoaderCircle, Sparkles } from "lucide-react";
import { optimizationValuesToCssFilter } from "@/lib/image/applyOptimization";
import { OptimizationValues } from "@/types/photo";

type OptimizeStepProps = {
  image: string;
  values: OptimizationValues;
  warning?: string | null;
  isAutoOptimizing: boolean;
  isApplying: boolean;
  onValueChange: (key: keyof Omit<OptimizationValues, "reason">, value: number) => void;
  onAutoOptimize: () => void;
  onReset: () => void;
  onBack: () => void;
  onApply: () => void;
};

const sliderConfig: Array<{
  key: keyof Omit<OptimizationValues, "reason">;
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: "brightness", label: "Brightness", min: 80, max: 120, step: 1 },
  { key: "contrast", label: "Contrast", min: 80, max: 125, step: 1 },
  { key: "saturation", label: "Saturation", min: 75, max: 125, step: 1 },
  { key: "hue", label: "Hue", min: -10, max: 10, step: 1 },
  { key: "warmth", label: "Warmth", min: -30, max: 30, step: 1 },
];

export function OptimizeStep({
  image,
  values,
  warning,
  isAutoOptimizing,
  isApplying,
  onValueChange,
  onAutoOptimize,
  onReset,
  onBack,
  onApply,
}: OptimizeStepProps) {
  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 py-6 lg:px-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            Step 3 of 4
          </p>
          <h1 className="mt-2 font-geist text-[32px] font-semibold tracking-tight text-slate-900 md:text-[36px]">
            Optimize Photo
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Fine-tune the cropped photo before printing.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Use Auto Optimize for suggested values, or adjust manually.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Gemini only suggests values. It does not edit or regenerate the face.
          </p>

          {warning ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {warning}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <PreviewCard title="Cropped Photo" image={image} />
            <PreviewCard
              title="Optimized Preview"
              image={image}
              filter={optimizationValuesToCssFilter(values)}
              badge={values.reason}
              highlighted
            />
          </div>
        </div>

        <aside className="flex flex-col border-l border-[#d9deef] pl-5">
          <div className="border-b border-[#e4e7f3] pb-4">
            <h3 className="font-geist text-[24px] font-semibold text-slate-900">
              Optimization Controls
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Small print-safe corrections only
            </p>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={onAutoOptimize}
              disabled={isAutoOptimizing || isApplying}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isAutoOptimizing ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Auto Optimize
            </button>
            <button
              type="button"
              onClick={onReset}
              disabled={isAutoOptimizing || isApplying}
              className="h-11 flex-1 rounded-xl border border-[#d3d8ea] bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {sliderConfig.map((slider) => (
              <label key={slider.key} className="block">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-700">{slider.label}</span>
                  <span className="text-xs text-slate-500">{values[slider.key]}</span>
                </div>
                <input
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  value={values[slider.key]}
                  onChange={(event) => onValueChange(slider.key, Number(event.target.value))}
                  className="w-full accent-brand-600"
                />
              </label>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-[#d9deef] bg-white px-4 py-3 text-sm text-slate-600">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{values.reason ?? "Neutral values are ready."}</span>
            </div>
          </div>

          <div className="mt-auto flex gap-3 pt-6">
            <button
              type="button"
              onClick={onBack}
              disabled={isApplying}
              className="h-11 flex-1 rounded-xl border border-[#d3d8ea] bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={onApply}
              disabled={isApplying || isAutoOptimizing}
              className="h-11 flex-1 rounded-xl bg-brand-600 px-5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isApplying ? "Applying..." : "Apply & Continue"}
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}

function PreviewCard({
  title,
  image,
  filter,
  badge,
  highlighted = false,
}: {
  title: string;
  image: string;
  filter?: string;
  badge?: string;
  highlighted?: boolean;
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
          <span className="rounded-full bg-[#eef2ff] px-2 py-0.5 text-[10px] font-semibold text-brand-700">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex h-[260px] items-center justify-center overflow-hidden border border-[#e3e6f2] bg-[#f8f9ff] p-3 md:h-[300px]">
        <img src={image} alt={title} className="h-full w-full object-contain" style={{ filter }} />
      </div>
    </div>
  );
}
