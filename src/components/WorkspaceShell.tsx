import { FileImage, Grid2x2, Sparkles, Upload } from "lucide-react";
import logoMark from "@/assets/logo-ii.png";
import { Step } from "@/types/photo";

const stepConfig: {
  id: Step;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
    { id: "upload", label: "Upload", icon: Upload },
    { id: "processing", label: "Preview", icon: FileImage },
    { id: "optimize", label: "Optimize", icon: Sparkles },
    { id: "layout", label: "Layout", icon: Grid2x2 },
  ];

export function WorkspaceShell({
  currentStep,
  onStepChange,
  canVisitStep,
  children,
}: {
  currentStep: Step;
  onStepChange: (step: Step) => void;
  canVisitStep: (step: Step) => boolean;
  children: React.ReactNode;
}) {
  const activeIndex = stepConfig.findIndex((step) => step.id === currentStep);

  return (
    <main className="min-h-screen bg-[#f7f8ff] text-slate-900">
      <header className="border-b border-[#d9deef] bg-white">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <img
              src={logoMark.src}
              alt="Photo Pro"
              className="h-11 w-auto object-contain"
            />
            <span className="font-geist text-2xl font-semibold tracking-tight">
              <span className="text-slate-900">Photo </span>
              <span className="text-brand-600">Pro</span>
            </span>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {stepConfig.map((step, index) => {
              const isActive = index === activeIndex;
              const isCompleted = index < activeIndex;
              const isEnabled = canVisitStep(step.id);

              return (
                <div key={step.id} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => isEnabled && onStepChange(step.id)}
                    disabled={!isEnabled}
                    className={`flex items-center gap-2 rounded-full px-2 py-1 transition ${isEnabled ? "hover:bg-[#f3f5ff]" : "cursor-not-allowed opacity-40"
                      }`}
                  >
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${isActive
                          ? "bg-brand-600 text-white"
                          : isCompleted
                            ? "bg-brand-100 text-brand-700"
                            : "bg-[#e8ecfa] text-slate-500"
                        }`}
                    >
                      {index + 1}
                    </div>
                    <span
                      className={`text-sm ${isActive ? "font-semibold text-brand-600" : "text-slate-500"
                        }`}
                    >
                      {step.label}
                    </span>
                  </button>
                  {index < stepConfig.length - 1 ? (
                    <div
                      className={`h-px w-10 ${index < activeIndex ? "bg-brand-600" : "bg-[#d9deef]"
                        }`}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>

          <a
            href="https://www.clipsnap.com/background-remover/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-medium text-brand-700 transition hover:bg-brand-100"
          >
            BG Remover
          </a>
        </div>
      </header>

      <div className="min-h-[calc(100vh-121px)]">{children}</div>

      <footer className="border-t border-[#d9deef] bg-white">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-center px-4 py-3 text-xs text-slate-500 md:px-6">
          <span>&copy; 2026 Photo Pro. All rights reserved.</span>
        </div>
      </footer>
    </main>
  );
}
