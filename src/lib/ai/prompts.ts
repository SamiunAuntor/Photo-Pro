export const PHOTO_ENHANCEMENT_PROMPT = `Create a professional ID-style portrait photo from the uploaded image.
Keep the person's identity, face, hair, skin tone, body shape, and clothing unchanged.
Only clean the background and make it plain white.
Do not beautify.
Do not change facial features.
Do not change clothes.
Do not alter age, expression, hairstyle, jawline, eyes, nose, mouth, or skin texture.
Keep realistic lighting.
Output a centered portrait suitable for ID/photo printing.
Output only the final edited image.`;

export const PHOTO_OPTIMIZATION_PROMPT = `You are an image quality assistant for passport-size and ID-style photo printing.

Analyze the uploaded cropped portrait photo and suggest conservative editing values only. Do not edit or regenerate the image. Do not change the person's face, identity, expression, skin tone, facial structure, hairstyle, clothing, or body shape.

The goal is only to make the existing cropped photo look slightly cleaner, clearer, and print-ready using basic image adjustments.

Return JSON only.

Rules:

* Keep all changes subtle and natural.
* Do not suggest beauty retouching.
* Do not suggest face modification.
* Do not over-brighten the skin.
* Do not make the person look fairer, younger, slimmer, sharper, sadder, more serious, or different.
* Preserve the original expression and identity.
* Assume the photo will be printed as a small passport-size / ID-style photo.
* Prefer small corrections over aggressive edits.

Return values in this exact JSON format:

{
"brightness": number,
"contrast": number,
"saturation": number,
"hue": number,
"warmth": number,
"reason": string
}

Value rules:

* brightness: percentage from 85 to 115, where 100 means no change
* contrast: percentage from 85 to 125, where 100 means no change
* saturation: percentage from 80 to 120, where 100 means no change
* hue: degrees from -8 to 8, where 0 means no change
* warmth: value from -25 to 25, where 0 means no change; positive means warmer, negative means cooler
* reason: one short sentence explaining the adjustment

If the image already looks good, return values very close to neutral:
brightness 100, contrast 100, saturation 100, hue 0, warmth 0.

Return JSON only. Do not include markdown. Do not include explanation outside the JSON.`;
