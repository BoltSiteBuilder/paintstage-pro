import { GoogleGenAI, Modality } from '@google/genai';

const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error('API_KEY environment variable not set.');
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Image generation model — requires billing enabled on your API key
// See: https://aistudio.google.com → Billing
const MODEL = 'gemini-2.5-flash-image';

export const applyPaintColor = async (
  base64ImageData: string,
  mimeType: string,
  brand: string,
  colorName: string,
  hexCode: string
): Promise<string> => {
  // System instruction prepended to the prompt (model doesn't support systemInstruction config)
  const systemInstruction = `You are an expert interior paint visualization AI. Your ONLY task is to change the wall paint color in the provided room photo.

STRICT RULES — follow all of these without exception:
- Apply the new paint color ONLY to the wall surfaces (vertical wall planes)
- Preserve ALL furniture, flooring, ceiling, baseboards, door frames, window frames, crown molding, and trim EXACTLY as they appear
- Preserve all light fixtures, artwork, mirrors, switches, outlets, and decorations without any change
- Preserve all lighting, shadows, highlights, and reflections on every non-wall surface
- The new wall color must look photorealistic: show natural light variation, subtle shading from light sources, and faint wall texture beneath the paint
- Do NOT change anything in the room except the wall color
- Do NOT add new objects, furniture, or decorations
- Do NOT alter the room's layout, perspective, or composition in any way`;

  const userPrompt = `Apply the paint color "${colorName}" by ${brand} (hex code: ${hexCode}) to all visible wall surfaces in this room photo.

Paint ONLY the walls. Leave everything else — furniture, floor, ceiling, trim, doors, windows, fixtures, shadows — exactly as it is.

The result should look exactly like a real photograph of this room after the walls were professionally painted with ${brand} "${colorName}" (${hexCode}). Maintain the natural lighting, shadow variation, and subtle wall texture throughout.`;

  const fullPrompt = `${systemInstruction}\n\n${userPrompt}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: {
      parts: [
        {
          inlineData: {
            data: base64ImageData,
            mimeType: mimeType,
          },
        },
        { text: fullPrompt },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  let imageUrl: string | null = null;
  let textResponse: string | null = null;

  for (const part of parts) {
    if (part.inlineData) {
      imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    } else if (part.text) {
      textResponse = part.text;
    }
  }

  if (!imageUrl) {
    const detail = textResponse
      ? `AI response: "${textResponse}"`
      : 'The image may be unclear or the request was blocked by safety filters.';
    throw new Error(`The AI did not return a painted image. ${detail} Please try a different photo or color.`);
  }

  return imageUrl;
};
