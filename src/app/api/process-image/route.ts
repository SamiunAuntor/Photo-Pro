import { GoogleGenAI, Modality } from "@google/genai";
import { NextResponse } from "next/server";
import { PHOTO_ENHANCEMENT_PROMPT } from "@/lib/ai/prompts";
import { AIProvider, ProviderProcessResult } from "@/lib/ai/providerTypes";

export const runtime = "nodejs";

// Gemini image processing is kept for future optional paid AI processing.
// It is not used in the default MVP flow.
const GEMINI_FALLBACK_WARNING = "Gemini processing failed, original image used as fallback.";
type ProcessImageRequest = {
  imageDataUrl?: unknown;
};

function createResponse(result: ProviderProcessResult, status = 200) {
  return NextResponse.json(result, { status });
}

function createFallbackResult(
  imageDataUrl: string,
  provider: AIProvider,
  warning: string,
): ProviderProcessResult {
  return {
    processedImage: imageDataUrl,
    provider,
    warning,
  };
}

function parseImageDataUrl(imageDataUrl: string) {
  const match = imageDataUrl.match(/^data:(.+);base64,(.+)$/);

  if (!match) {
    return null;
  }

  const [, mimeType, data] = match;
  return { mimeType, data };
}

function extractInlineImage(
  response: Awaited<ReturnType<GoogleGenAI["models"]["generateContent"]>>,
) {
  for (const candidate of response.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      if (part.inlineData?.data) {
        return {
          mimeType: part.inlineData.mimeType || "image/png",
          data: part.inlineData.data,
        };
      }
    }
  }

  return null;
}

async function processWithGemini(
  imageDataUrl: string,
  parsedImage: NonNullable<ReturnType<typeof parseImageDataUrl>>,
): Promise<ProviderProcessResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return createFallbackResult(imageDataUrl, "gemini", GEMINI_FALLBACK_WARNING);
  }

  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: PHOTO_ENHANCEMENT_PROMPT,
            },
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
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const generatedImage = extractInlineImage(response);

    if (!generatedImage) {
      return createFallbackResult(imageDataUrl, "gemini", GEMINI_FALLBACK_WARNING);
    }

    return {
      processedImage: `data:${generatedImage.mimeType};base64,${generatedImage.data}`,
      provider: "gemini",
      warning: null,
    };
  } catch (error) {
    console.warn("Gemini image processing fell back:", error);
    return createFallbackResult(imageDataUrl, "gemini", GEMINI_FALLBACK_WARNING);
  }
}

export async function POST(request: Request) {
  let body: ProcessImageRequest;

  try {
    body = (await request.json()) as ProcessImageRequest;
  } catch {
    return NextResponse.json(
      {
        error: "Invalid JSON body.",
      },
      { status: 400 },
    );
  }

  if (typeof body.imageDataUrl !== "string" || !body.imageDataUrl.trim()) {
    return NextResponse.json(
      {
        error: "imageDataUrl is required.",
      },
      { status: 400 },
    );
  }

  const imageDataUrl = body.imageDataUrl;
  const parsedImage = parseImageDataUrl(imageDataUrl);

  if (!parsedImage) {
    return createResponse(
      createFallbackResult(
        imageDataUrl,
        "mock",
        "Invalid image data URL. Original image used as fallback.",
      ),
      400,
    );
  }

  return createResponse(await processWithGemini(imageDataUrl, parsedImage));
}
