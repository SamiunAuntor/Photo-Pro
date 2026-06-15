export function calculateGrid({
  paperWidthMm,
  paperHeightMm,
  photoWidthMm,
  photoHeightMm,
  marginMm,
  gapMm,
}: {
  paperWidthMm: number;
  paperHeightMm: number;
  photoWidthMm: number;
  photoHeightMm: number;
  marginMm: number;
  gapMm: number;
}) {
  const columns = Math.floor(
    (paperWidthMm - marginMm * 2 + gapMm) / (photoWidthMm + gapMm),
  );

  const rows = Math.floor(
    (paperHeightMm - marginMm * 2 + gapMm) / (photoHeightMm + gapMm),
  );

  return {
    columns,
    rows,
    total: Math.max(columns, 0) * Math.max(rows, 0),
  };
}
