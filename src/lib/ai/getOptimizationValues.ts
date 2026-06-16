import {
  neutralOptimizationValues,
  normalizeOptimizationValues,
} from "@/lib/image/applyOptimization";
import { OptimizationValues } from "@/types/photo";

type OptimizeResponse = {
  values?: Partial<OptimizationValues>;
  warning?: string | null;
};

const DEFAULT_WARNING = "Auto optimization unavailable. You can adjust manually.";

export async function getOptimizationValues(imageDataUrl: string) {
  try {
    const response = await fetch("/api/optimize-values", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageDataUrl }),
    });

    if (!response.ok) {
      return {
        values: neutralOptimizationValues,
        warning: DEFAULT_WARNING,
      };
    }

    const data = (await response.json()) as OptimizeResponse;

    return {
      values: normalizeOptimizationValues(data.values ?? neutralOptimizationValues),
      warning: typeof data.warning === "string" ? data.warning : null,
    };
  } catch {
    return {
      values: neutralOptimizationValues,
      warning: DEFAULT_WARNING,
    };
  }
}
