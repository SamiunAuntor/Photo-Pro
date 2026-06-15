import { Step } from "@/types/photo";

const steps: { id: Step; label: string; hint: string }[] = [
  { id: "upload", label: "Upload", hint: "Add one portrait image" },
  { id: "processing", label: "Processing", hint: "Prepare the print photo" },
  { id: "layout", label: "Layout", hint: "Preview, save PDF, and print" },
];

export function Stepper({ currentStep }: { currentStep: Step }) {
  const activeIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {steps.map((step, index) => {
        const isActive = index === activeIndex;
        const isComplete = index < activeIndex;

        return (
          <div
            key={step.id}
            className={`rounded-3xl border px-4 py-4 transition ${
              isActive
                ? "border-brand-500 bg-brand-600 text-white shadow-lg"
                : isComplete
                  ? "border-brand-200 bg-brand-50 text-brand-700"
                  : "border-slate-200 bg-white/80 text-slate-500"
            }`}
          >
            <p className="text-sm font-semibold">{`0${index + 1}`}</p>
            <p className="mt-2 text-lg font-semibold">{step.label}</p>
            <p className="mt-1 text-sm opacity-80">{step.hint}</p>
          </div>
        );
      })}
    </div>
  );
}
