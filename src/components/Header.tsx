export function Header() {
  return (
    <div className="flex items-center justify-between rounded-[28px] border border-white/70 bg-white/80 px-6 py-5 shadow-card backdrop-blur">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-brand-600">
          Photosop Mini
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
          Print-ready ID photos in three clicks
        </h1>
      </div>
      <div className="hidden rounded-2xl bg-brand-50 px-4 py-3 text-right text-sm text-brand-700 md:block">
        <p>Upload</p>
        <p>Process</p>
        <p>Print</p>
      </div>
    </div>
  );
}
