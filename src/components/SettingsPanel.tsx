"use client";

import { paperSizePresets, photoSizePresets } from "@/lib/layout/presets";
import { PaperSize, PhotoSize } from "@/types/photo";

type SettingsPanelProps = {
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
  onPrint: () => void;
  onDownloadPdf: () => void;
  canContinue: boolean;
};

export function SettingsPanel(props: SettingsPanelProps) {
  const {
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
    canContinue,
  } = props;

  const presetCopyValues = [4, 8, 12];
  const usesCustomCopies = copies !== "auto" && !presetCopyValues.includes(copies);
  const copySelectValue =
    copies === "auto" ? "auto" : usesCustomCopies ? "custom" : String(copies);

  return (
    <aside className="flex flex-col border-l border-[#d9deef] bg-white">
      <div className="border-b border-[#d9deef] px-5 py-4">
        <h3 className="font-geist text-[24px] font-semibold leading-none text-slate-900">
          Layout Settings
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Configure grid and paper dimensions
        </p>
      </div>

      <div className="px-5 py-4">
        <Section title="Paper">
          <Field label="Paper Size">
            <select
              value={selectedPaperSize.label}
              onChange={(event) => {
                const next = paperSizePresets.find((item) => item.label === event.target.value);
                if (next) {
                  onPaperSizeChange(next);
                }
              }}
              className="h-11 w-full rounded-md border border-[#cfd6ec] bg-white px-3 text-sm text-slate-900 outline-none ring-brand-500 transition focus:ring-2"
            >
              {paperSizePresets.map((size) => (
                <option key={size.label} value={size.label}>
                  {size.label} ({size.widthMm} x {size.heightMm} mm)
                </option>
              ))}
            </select>
          </Field>
        </Section>

        <Section title="Photo Template">
          <Field label="Photo Size">
            <select
              value={selectedPhotoSize.label}
              onChange={(event) => {
                const next = photoSizePresets.find((item) => item.label === event.target.value);
                if (next) {
                  onPhotoSizeChange(next);
                }
              }}
              className="h-11 w-full rounded-md border border-[#cfd6ec] bg-white px-3 text-sm text-slate-900 outline-none ring-brand-500 transition focus:ring-2"
            >
              {photoSizePresets.map((size) => (
                <option key={size.label} value={size.label}>
                  {size.label}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        <Section title="Spacing & Guides">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Page Margin (mm)">
              <input
                type="number"
                min={0}
                value={marginMm}
                onChange={(event) => onMarginChange(Number(event.target.value))}
                className="h-11 w-full rounded-md border border-[#cfd6ec] bg-white px-3 text-sm text-slate-900 outline-none ring-brand-500 transition focus:ring-2"
              />
            </Field>
            <Field label="Grid Gap (mm)">
              <input
                type="number"
                min={0}
                value={gapMm}
                onChange={(event) => onGapChange(Number(event.target.value))}
                className="h-11 w-full rounded-md border border-[#cfd6ec] bg-white px-3 text-sm text-slate-900 outline-none ring-brand-500 transition focus:ring-2"
              />
            </Field>
          </div>

          <div className="mt-4 space-y-3">
            <Toggle label="Show cut marks" checked={cutMarks} onChange={onCutMarksChange} />
            <Toggle label="Show photo border" checked={border} onChange={onBorderChange} />
          </div>
        </Section>

        <Section title="Copies">
          <Field label="Sheet Fill">
            <select
              value={copySelectValue}
              onChange={(event) => {
                if (event.target.value === "auto") {
                  onCopiesChange("auto");
                  return;
                }

                if (event.target.value === "custom") {
                  onCopiesChange(copies === "auto" ? 1 : Math.max(1, copies));
                  return;
                }

                onCopiesChange(Number(event.target.value));
              }}
              className="h-11 w-full rounded-md border border-[#cfd6ec] bg-white px-3 text-sm text-slate-900 outline-none ring-brand-500 transition focus:ring-2"
            >
              <option value="auto">Auto-fill</option>
              <option value="4">4 copies</option>
              <option value="8">8 copies</option>
              <option value="12">12 copies</option>
              <option value="custom">Custom</option>
            </select>
          </Field>

          {copySelectValue === "custom" ? (
            <div className="mt-3">
              <Field label="Custom Copy Count">
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={copies === "auto" ? 1 : copies}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value);
                    onCopiesChange(Number.isFinite(nextValue) ? Math.max(1, Math.round(nextValue)) : 1);
                  }}
                  className="h-11 w-full rounded-md border border-[#cfd6ec] bg-white px-3 text-sm text-slate-900 outline-none ring-brand-500 transition focus:ring-2"
                />
              </Field>
            </div>
          ) : null}
        </Section>
      </div>

      <div className="border-t border-[#d9deef] bg-white px-5 py-4">
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={!canContinue}
          className="mb-3 w-full rounded-md border border-[#d3d8ea] bg-white px-3 py-2 text-sm text-brand-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Download PDF
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="h-11 flex-1 rounded-xl border border-[#d3d8ea] bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onPrint}
            disabled={!canContinue}
            className="h-11 flex-1 rounded-xl bg-brand-600 px-5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Print
          </button>
        </div>
      </div>
    </aside>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <h4 className="border-b border-[#e5e8f4] pb-2 font-geist text-[18px] font-semibold leading-none text-slate-900">
        {title}
      </h4>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-[#cfd6ec] text-brand-600"
      />
      {label}
    </label>
  );
}
