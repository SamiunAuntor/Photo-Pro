# Photosop Mini

Live: https://photo-pro-wine.vercel.app/

Photosop Mini is a small frontend-only passport and ID photo layout tool. The app is focused on a simple workflow: upload a background-removed photo, crop it to a fixed photo ratio, preview it, and generate a printable layout for paper sizes like A4.

## What It Does

- Upload a prepared photo
- Crop and position it inside a fixed passport-style frame
- Preview the cropped result
- Generate a repeated print layout
- Download the layout as a PDF
- Open a print-friendly sheet

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Zustand
- jsPDF

## Run Locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Background Remover Cache Check

To verify the browser-side background-removal model is being reused instead of fully downloaded every time:

1. Open DevTools and go to the `Network` tab.
2. Make sure `Disable cache` is unchecked.
3. Run background removal once.
4. Refresh the page normally.
5. Run background removal again.
6. Inspect the model, WASM, and ONNX requests.
7. Confirm they show cache reuse such as `memory cache`, `disk cache`, or a `304` response.
