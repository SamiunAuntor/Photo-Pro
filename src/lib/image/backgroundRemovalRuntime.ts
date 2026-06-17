import {
  BackgroundRemovalError,
  RemovalProgress,
} from "@/lib/image/backgroundRemovalTypes";

type BackgroundRemovalModule = typeof import("@imgly/background-removal");

type WorkerRequest =
  | {
      id: number;
      type: "warmup";
    }
  | {
      id: number;
      type: "remove";
      blob: Blob;
    };

type WorkerResponse =
  | {
      id: number;
      type: "progress";
      progress: RemovalProgress;
    }
  | {
      id: number;
      type: "success";
      action: "warmup";
    }
  | {
      id: number;
      type: "success";
      action: "remove";
      blob: Blob;
    }
  | {
      id: number;
      type: "error";
      message: string;
    };

type PendingRequest =
  | {
      type: "warmup";
      resolve: () => void;
      reject: (error: Error) => void;
    }
  | {
      type: "remove";
      resolve: (blob: Blob) => void;
      reject: (error: Error) => void;
    };

const BACKGROUND_REMOVAL_MARKER_KEY = "photopro-bg-model-version";
const BACKGROUND_REMOVAL_MARKER_VALUE = "@imgly/background-removal@1.7.0:isnet_fp16";

let modulePromise: Promise<BackgroundRemovalModule> | null = null;
let preloadPromise: Promise<void> | null = null;
let runtimeReady = false;
let latestProgress: RemovalProgress | null = null;
let workerInstance: Worker | null = null;
let requestSequence = 0;

const pendingRequests = new Map<number, PendingRequest>();
const progressListeners = new Set<(progress: RemovalProgress) => void>();

function isBrowser() {
  return typeof window !== "undefined";
}

function supportsWorkerRuntime() {
  return isBrowser() && typeof Worker !== "undefined";
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

function getWorker() {
  if (!supportsWorkerRuntime()) {
    return null;
  }

  if (!workerInstance) {
    workerInstance = new Worker(
      new URL("../../workers/backgroundRemoval.worker.ts", import.meta.url),
      {
        type: "module",
      },
    );

    workerInstance.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;

      if (message.type === "progress") {
        emitProgress(message.progress);
        return;
      }

      const pending = pendingRequests.get(message.id);

      if (!pending) {
        return;
      }

      pendingRequests.delete(message.id);

      if (message.type === "error") {
        pending.reject(new BackgroundRemovalError(message.message));
        return;
      }

      if (pending.type === "warmup" && message.action === "warmup") {
        runtimeReady = true;
        writeCacheMarker();
        pending.resolve();
        return;
      }

      if (pending.type === "remove" && message.action === "remove") {
        pending.resolve(message.blob);
      }
    };

    workerInstance.onerror = (event) => {
      const error = new BackgroundRemovalError(
        event.message || "Background removal worker failed unexpectedly.",
      );

      for (const [, pending] of pendingRequests) {
        pending.reject(error);
      }

      pendingRequests.clear();
      workerInstance?.terminate();
      workerInstance = null;
      runtimeReady = false;
      preloadPromise = null;
    };
  }

  return workerInstance;
}

function postWorkerRequest(request: WorkerRequest) {
  const worker = getWorker();

  if (!worker) {
    throw new BackgroundRemovalError("Background removal worker is not available.");
  }

  worker.postMessage(request);
}

function warmupWithWorker() {
  return new Promise<void>((resolve, reject) => {
    const id = ++requestSequence;

    pendingRequests.set(id, {
      type: "warmup",
      resolve,
      reject,
    });

    postWorkerRequest({
      id,
      type: "warmup",
    });
  });
}

function removeWithWorker(input: File | Blob) {
  return new Promise<Blob>((resolve, reject) => {
    const id = ++requestSequence;

    pendingRequests.set(id, {
      type: "remove",
      resolve,
      reject,
    });

    postWorkerRequest({
      id,
      type: "remove",
      blob: input,
    });
  });
}

async function warmupDirectRuntime() {
  emitProgress({
    percentage: 0,
    message: readCacheMarker()
      ? "Preparing cached background remover..."
      : "Preparing background remover...",
  });

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
}

async function removeDirectRuntime(input: File | Blob) {
  const { removeBackground } = await getRuntimeApi();

  emitProgress({
    percentage: 0,
    message: "Removing background...",
  });

  return removeBackground(input, {
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
        try {
          if (supportsWorkerRuntime()) {
            emitProgress({
              percentage: 0,
              message: readCacheMarker()
                ? "Preparing cached background remover..."
                : "Preparing background remover...",
            });
            await warmupWithWorker();
          } else {
            await warmupDirectRuntime();
          }

          emitProgress({
            percentage: 100,
            message: "Background remover ready.",
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

    const result = supportsWorkerRuntime()
      ? await removeWithWorker(input)
      : await removeDirectRuntime(input);

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
