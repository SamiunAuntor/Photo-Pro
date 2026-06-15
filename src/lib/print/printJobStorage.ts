import { PrintJob } from "@/types/photo";

const STORAGE_KEY = "photopro-print-job";

export function savePrintJob(job: PrintJob) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(job));
}

export function readPrintJob(): PrintJob | null {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PrintJob;
  } catch {
    return null;
  }
}

export function clearPrintJob() {
  localStorage.removeItem(STORAGE_KEY);
}
