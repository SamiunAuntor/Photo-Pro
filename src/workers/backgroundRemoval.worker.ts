/// <reference lib="webworker" />

import { preload, removeBackground } from "@imgly/background-removal";

type RemovalProgress = {
  percentage?: number;
  message?: string;
};

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

const workerScope = self as DedicatedWorkerGlobalScope;

let runtimeReady = false;

function getConfig() {
  const canUseGpu =
    typeof navigator !== "undefined" &&
    typeof (navigator as Navigator & { gpu?: unknown }).gpu !== "undefined";

  return {
    device: canUseGpu ? ("gpu" as const) : ("cpu" as const),
    output: {
      format: "image/png" as const,
      quality: 1,
    },
  };
}

function toProgressMessage(key: string, fallback: string) {
  const lowerKey = key.toLowerCase();

  if (
    lowerKey.includes("fetch:") ||
    lowerKey.includes("onnx") ||
    lowerKey.includes("wasm") ||
    lowerKey.includes("model")
  ) {
    return "Loading background-removal model...";
  }

  return fallback;
}

function emitProgress(id: number, progress: RemovalProgress) {
  const message: WorkerResponse = {
    id,
    type: "progress",
    progress,
  };

  workerScope.postMessage(message);
}

async function ensureReady(id: number) {
  if (runtimeReady) {
    return;
  }

  emitProgress(id, {
    percentage: 0,
    message: "Preparing background remover...",
  });

  await preload({
    ...getConfig(),
    progress: (key: string, current: number, total: number) => {
      emitProgress(id, {
        percentage: total > 0 ? Math.round((current / total) * 100) : undefined,
        message: toProgressMessage(key, "Preparing background remover..."),
      });
    },
  });

  runtimeReady = true;
}

workerScope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;

  try {
    if (request.type === "warmup") {
      await ensureReady(request.id);

      const success: WorkerResponse = {
        id: request.id,
        type: "success",
        action: "warmup",
      };

      workerScope.postMessage(success);
      return;
    }

    await ensureReady(request.id);

    emitProgress(request.id, {
      percentage: 0,
      message: "Removing background...",
    });

    const result = await removeBackground(request.blob, {
      ...getConfig(),
      progress: (key: string, current: number, total: number) => {
        emitProgress(request.id, {
          percentage: total > 0 ? Math.round((current / total) * 100) : undefined,
          message: toProgressMessage(key, "Removing background..."),
        });
      },
    });

    const success: WorkerResponse = {
      id: request.id,
      type: "success",
      action: "remove",
      blob: result,
    };

    workerScope.postMessage(success);
  } catch (error) {
    const failure: WorkerResponse = {
      id: request.id,
      type: "error",
      message:
        error instanceof Error
          ? error.message
          : "Background removal could not be completed on this device.",
    };

    workerScope.postMessage(failure);
  }
};

export {};
