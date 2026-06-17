import { removeBackgroundCached } from "@/lib/image/backgroundRemovalRuntime";
import {
  BackgroundRemovalError,
  RemovalProgress,
} from "@/lib/image/backgroundRemovalTypes";

export async function removeBackgroundInBrowser(
  input: File | Blob,
  onProgress?: (progress: RemovalProgress) => void,
): Promise<Blob> {
  if (typeof window === "undefined") {
    throw new BackgroundRemovalError("Background removal is available only in the browser.");
  }

  return removeBackgroundCached(input, onProgress);
}
