import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { PHOTO_OPTIMIZATION_PROMPT } from "@/lib/ai/prompts";
import {
  neutralOptimizationValues,
  normalizeOptimizationValues,
} from "@/lib/image/applyOptimization";
import { OptimizationValues } from "@/types/photo";

export const runtime = "nodejs";

const FALLBACK_REASON = "Gemini optimization unavailable. Neutral values used.";
const FALLBACK_WARNING = "Auto optimization unavailable. You can adjust manually.";

type OptimizeRequest = {
  imageDataUrl?: unknown;
};

function parseImageDataUrl(imageDataUrl: string) {
  const match = imageDataUrl.match(/^data:(.+);base64,(.+)$/);

  if (!match) {
    return null;
  }

  const [, mimeType, data] = match;
  return { mimeType, data };
}

function createFallbackValues(): OptimizationValues {
  return {
    ...neutralOptimizationValues,
    reason: FALLBACK_REASON,
  };
}

function stripCodeFences(value: string) {
  return value.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
}

function parseOptimizationText(text: string | undefined) {
  if (!text) {
    return null;
  }

  try {
    return normalizeOptimizationValues(JSON.parse(stripCodeFences(text)) as OptimizationValues);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let body: OptimizeRequest;

  try {
    body = (await request.json()) as OptimizeRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.imageDataUrl !== "string" || !body.imageDataUrl.trim()) {
    return NextResponse.json({ error: "imageDataUrl is required." }, { status: 400 });
  }

  const parsedImage = parseImageDataUrl(body.imageDataUrl);

  if (!parsedImage) {
    return NextResponse.json(
      {
        values: createFallbackValues(),
        warning: FALLBACK_WARNING,
      },
      { status: 200 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        values: createFallbackValues(),
        warning: FALLBACK_WARNING,
      },
      { status: 200 },
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: PHOTO_OPTIMIZATION_PROMPT },
            {
              inlineData: {
                mimeType: parsedImage.mimeType,
                data: parsedImage.data,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const values = parseOptimizationText(response.text);

    if (!values) {
      return NextResponse.json(
        {
          values: createFallbackValues(),
          warning: FALLBACK_WARNING,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        values,
        warning: null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.warn("Gemini optimize-values fell back:", error);

    return NextResponse.json(
      {
        values: createFallbackValues(),
        warning: FALLBACK_WARNING,
      },
      { status: 200 },
    );
  }
}
