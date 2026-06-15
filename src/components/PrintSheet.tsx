import { PrintJob } from "@/types/photo";

export function PrintSheet({
  job,
  copies,
  previewScale = 1,
}: {
  job: PrintJob;
  copies?: number;
  previewScale?: number;
}) {
  const totalCells = Math.max(0, copies ?? job.total);
  const scaledWidth =
    previewScale === 1
      ? `${job.paperWidthMm}mm`
      : `calc(${job.paperWidthMm}mm * ${previewScale})`;
  const scaledHeight =
    previewScale === 1
      ? `${job.paperHeightMm}mm`
      : `calc(${job.paperHeightMm}mm * ${previewScale})`;

  return (
    <div
      className="print-sheet relative overflow-hidden"
      style={{
        width: scaledWidth,
        height: scaledHeight,
      }}
    >
      <div
        className="absolute left-0 top-0 grid origin-top-left bg-white shadow-[0_20px_45px_rgba(15,23,42,0.08)]"
        style={{
          width: `${job.paperWidthMm}mm`,
          height: `${job.paperHeightMm}mm`,
          gridTemplateColumns: `repeat(${job.columns}, ${job.photoWidthMm}mm)`,
          gridAutoRows: `${job.photoHeightMm}mm`,
          gap: `${job.gapMm}mm`,
          padding: `${job.marginMm}mm`,
          transform: `scale(${previewScale})`,
        }}
      >
        {Array.from({ length: totalCells }).map((_, index) => (
          <div
            key={index}
            className={`relative overflow-hidden bg-white ${
              job.border ? "border border-slate-400" : ""
            }`}
            style={{
              width: `${job.photoWidthMm}mm`,
              height: `${job.photoHeightMm}mm`,
            }}
          >
            <img
              src={job.image}
              alt={`Photo copy ${index + 1}`}
              className="h-full w-full object-cover"
            />
            {job.cutMarks ? <CutMarks /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function CutMarks() {
  const markClass = "absolute bg-slate-400";

  return (
    <>
      <span className={`${markClass} left-0 top-0 h-[1px] w-2`} />
      <span className={`${markClass} left-0 top-0 h-2 w-[1px]`} />
      <span className={`${markClass} right-0 top-0 h-[1px] w-2`} />
      <span className={`${markClass} right-0 top-0 h-2 w-[1px]`} />
      <span className={`${markClass} bottom-0 left-0 h-[1px] w-2`} />
      <span className={`${markClass} bottom-0 left-0 h-2 w-[1px]`} />
      <span className={`${markClass} bottom-0 right-0 h-[1px] w-2`} />
      <span className={`${markClass} bottom-0 right-0 h-2 w-[1px]`} />
    </>
  );
}
