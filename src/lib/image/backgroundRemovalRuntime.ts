import {
  BackgroundRemovalError,
  RemovalProgress,
} from "@/lib/image/backgroundRemovalTypes";

type BackgroundRemovalModule = typeof import("@imgly/background-removal");

const BACKGROUND_REMOVAL_MARKER_KEY = "photopro-bg-model-version";
const BACKGROUND_REMOVAL_MARKER_VALUE = "@imgly/background-removal@1.7.0:isnet_fp16";

let modulePromise: Promise<BackgroundRemovalModule> | null = null;
let preloadPromise: Promise<void> | null = null;
let runtimeReady = false;
let latestProgress: RemovalProgress | null = null;

const progressListeners = new Set<(progress: RemovalProgress) => void>();

function isBrowser() {
  return typeof window !== "undefined";
}

function readCacheMarker() {
  if (!isBrowser()) {
    return false;
  }

  try {
    return window.localStorage.getItem(BACKGROUND_REMOVAL_MARKER_KEY) === BACKGROUND_REMOVAL_MARKER_VALUE;
  } catch {
    return false;
  }
}

function writeCacheMarker() {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(
      BACKGROUND_REMOVAL_MARKER_KEY,
      BACKGROUND_REMOVAL_MARKER_VALUE,
    );
  } catch {
    // Ignore storage failures. This marker is only for UX wording.
  }
}

function emitProgress(progress: RemovalProgress) {
  latestProgress = progress;

  for (const listener of progressListeners) {
    listener(progress);
  }
}

function subscribeProgress(listener?: (progress: RemovalProgress) => void) {
  if (!listener) {
    return () => undefined;
  }

  progressListeners.add(listener);

  if (latestProgress) {
    listener(latestProgress);
  }

  return () => {
    progressListeners.delete(listener);
  };
}

function normalizePreparationMessage(key: string) {
  const lowerKey = key.toLowerCase();

  if (
    lowerKey.includes("fetch:") ||
    lowerKey.includes("onnx") ||
    lowerKey.includes("wasm") ||
    lowerKey.includes("model")
  ) {
    return "Loading background-removal model...";
  }

  return "Preparing background remover...";
}

export function loadBackgroundRemovalModule() {
  if (!isBrowser()) {
    throw new BackgroundRemovalError("Background removal is available only in the browser.");
  }

  if (!modulePromise) {
    modulePromise = import("@imgly/background-removal");
  }

  return modulePromise;
}

async function getRuntimeApi() {
  const module = await loadBackgroundRemovalModule();
  const removeBackground = module.removeBackground;
  const preload = module.preload;

  if (typeof removeBackground !== "function") {
    throw new BackgroundRemovalError("Background remover is not available.");
  }

  return { removeBackground, preload };
}

export async function warmBackgroundRemover(
  onProgress?: (progress: RemovalProgress) => void,
) {
  if (!isBrowser()) {
    throw new BackgroundRemovalError("Background removal is available only in the browser.");
  }

  const unsubscribe = subscribeProgress(onProgress);

  try {
    if (runtimeReady) {
      emitProgress({
        percentage: 100,
        message: readCacheMarker()
          ? "Preparing cached background remover..."
          : "Preparing background remover...",
      });
      return;
    }

    if (!preloadPromise) {
      preloadPromise = (async () => {
        emitProgress({
          percentage: 0,
          message: readCacheMarker()
            ? "Preparing cached background remover..."
            : "Preparing background remover...",
        });

        try {
          const { preload } = await getRuntimeApi();

          if (typeof preload === "function") {
            await preload({
              output: {
                format: "image/png",
                quality: 1,
              },
              progress: (key: string, current: number, total: number) => {
                emitProgress({
                  percentage: total > 0 ? Math.round((current / total) * 100) : undefined,
                  message: normalizePreparationMessage(key),
                });
              },
            });
          }

          runtimeReady = true;
          writeCacheMarker();
          emitProgress({
            percentage: 100,
            message: "Preparing background remover...",
          });
        } catch (error) {
          runtimeReady = false;
          preloadPromise = null;
          throw error;
        }
      })();
    }

    await preloadPromise;
  } catch (error) {
    console.warn("Background remover warm-up failed:", error);
    throw new BackgroundRemovalError(
      error instanceof Error
        ? error.message
        : "Background removal could not be completed on this device.",
    );
  } finally {
    unsubscribe();
  }
}

export async function removeBackgroundCached(
  input: File | Blob,
  onProgress?: (progress: RemovalProgress) => void,
): Promise<Blob> {
  const unsubscribe = subscribeProgress(onProgress);

  try {
    await warmBackgroundRemover();

    const { removeBackground } = await getRuntimeApi();

    emitProgress({
      percentage: 0,
      message: "Removing background...",
    });

    const result = await removeBackground(input, {
      output: {
        format: "image/png",
        quality: 1,
      },
      progress: (key: string, current: number, total: number) => {
        const lowerKey = key.toLowerCase();

        emitProgress({
          percentage: total > 0 ? Math.round((current / total) * 100) : undefined,
          message: lowerKey.includes("fetch:")
            ? "Loading background-removal model..."
            : "Removing background...",
        });
      },
    });

    emitProgress({
      percentage: 100,
      message: "Finalizing image...",
    });

    return result;
  } catch (error) {
    console.warn("Background removal failed in browser:", error);
    throw new BackgroundRemovalError(
      error instanceof Error
        ? error.message
        : "Background removal could not be completed on this device.",
    );
  } finally {
    unsubscribe();
  }
}
