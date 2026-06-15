"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PrintSheet } from "@/components/PrintSheet";
import { readPrintJob } from "@/lib/print/printJobStorage";
import { PrintJob } from "@/types/photo";

export default function PrintPage() {
  const [job, setJob] = useState<PrintJob | null>(null);

  useEffect(() => {
    const storedJob = readPrintJob();
    setJob(storedJob);

    if (storedJob) {
      const timeoutId = window.setTimeout(() => {
        window.print();
      }, 500);

      return () => window.clearTimeout(timeoutId);
    }
  }, []);

  if (!job) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#222326] p-6">
        <div className="no-print rounded-[22px] border-2 border-brand-500/60 bg-white p-8 text-center shadow-card">
          <h1 className="font-geist text-2xl font-semibold text-ink">No print job found</h1>
          <p className="mt-3 text-slate-600">
            Return to the home page, generate a layout, and try printing again.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-2xl bg-brand-600 px-5 py-3 font-semibold text-white"
          >
            Back Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#edf1ff] p-4 print:bg-white print:p-0">
      <div className="mx-auto flex max-w-[1500px] flex-col items-center">
        <div className="no-print mb-4 flex gap-3 self-center">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl bg-brand-600 px-5 py-3 font-medium text-white"
        >
          Print Again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-medium text-slate-700"
        >
          Back
        </Link>
        </div>
        <div className="w-full bg-[#edf1ff]">
          <div className="flex justify-center">
            <PrintSheet job={job} copies={job.total} />
          </div>
        </div>
      </div>
    </main>
  );
}
