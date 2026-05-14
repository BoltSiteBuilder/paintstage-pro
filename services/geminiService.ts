import { GoogleGenAI, Modality } from '@google/genai';

const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error('API_KEY environment variable not set.');
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Image generation model — requires billing enabled on your API key
const MODEL = 'gemini-2.5-flash-image';

// ────────────────────────────────────────────────────────────
// Shared low-level call
// ────────────────────────────────────────────────────────────
const generateImage = async (
  base64ImageData: string,
  mimeType: string,
  fullPrompt: string
): Promise<string> => {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: {
      parts: [
        { inlineData: { data: base64ImageData, mimeType } },
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
    throw new Error(`The AI did not return a painted image. ${detail} Please try a different photo or request.`);
  }

  return imageUrl;
};

// ────────────────────────────────────────────────────────────
// Apply paint color to ALL walls
// ────────────────────────────────────────────────────────────
export const applyPaintColor = async (
  base64ImageData: string,
  mimeType: string,
  brand: string,
  colorName: string,
  hexCode: string
): Promise<string> => {
  const systemInstruction = `You are an expert interior paint visualization AI. Your ONLY task is to repaint EVERY wall in the provided room photo with the specified color.

CRITICAL — PAINT EVERY SINGLE WALL:
- You MUST apply the new paint color to ALL wall surfaces visible in the photo — without exception
- This includes: the back wall, the left wall, the right wall, side walls, partial walls at the edges of the frame, walls behind furniture, walls around fireplaces, walls next to doorways, walls around windows, and any wall surface in adjacent rooms or hallways visible through doorways
- If you can see a wall, you MUST paint it the new color
- Do NOT leave any wall in the original color
- Do NOT treat any wall as an "accent" — every wall gets the same new color
- Check every corner and edge of the image to ensure no wall has been missed

PRESERVE EVERYTHING ELSE EXACTLY:
- Keep ALL furniture, flooring, ceiling, baseboards, door frames, window frames, crown molding, and trim exactly as they appear
- Keep all light fixtures, artwork, mirrors, switches, outlets, and decorations unchanged
- Keep all lighting, shadows, highlights, and reflections on every non-wall surface
- Do NOT alter the room's layout, perspective, composition, or any object

REALISM:
- The new wall color must look photorealistic with natural light variation, subtle shading from light sources, and faint wall texture beneath the paint
- Walls should show realistic shadows from light direction and any objects in the room`;

  const userPrompt = `Repaint EVERY visible wall in this room with the paint color "${colorName}" by ${brand} (hex code: ${hexCode}).

This means: paint the back wall, paint the left wall, paint the right wall, paint any side or partial walls, paint walls around doorways, fireplaces, and windows, and paint any wall visible in adjacent rooms or hallways. EVERY wall gets the new color.

Do not leave any wall in its original color. Do not paint just one wall as an accent — paint them ALL.

Leave everything that is NOT a wall completely untouched: furniture, floor, ceiling, trim, doors, windows, fixtures, decorations, shadows.

The final image should look like a real photograph of this room after every wall has been professionally painted with ${brand} "${colorName}" (${hexCode}).`;

  return generateImage(base64ImageData, mimeType, `${systemInstruction}\n\n${userPrompt}`);
};

// ────────────────────────────────────────────────────────────
// Apply a tweak / refinement to an already-painted image
// ────────────────────────────────────────────────────────────
export const tweakPaintedImage = async (
  base64ImageData: string,
  mimeType: string,
  tweakDescription: string
): Promise<string> => {
  const systemInstruction = `You are refining an already-painted room photo. The user wants to make a SPECIFIC adjustment to the image they're looking at.

STRICT RULES:
- Apply ONLY the specific change the user describes — nothing more
- PRESERVE ALL existing paint colors and details exactly as they appear in the current image, UNLESS the user explicitly asks to change them
- Do NOT revert any previous edits
- Do NOT change anything else in the image other than what the user explicitly requested
- The result must look photorealistic with natural lighting, shadows, and textures
- Keep all furniture, flooring, ceiling, trim, fixtures, and decorations in place unless the user says otherwise`;

  const userPrompt = `Apply this specific adjustment to the painted room photo:

"${tweakDescription}"

Make ONLY this change. Preserve every other detail in the current image — keep all existing paint colors, all furniture, all fixtures, all lighting, exactly as they are. The output should look like a real photograph that incorporates this one specific change.`;

  return generateImage(base64ImageData, mimeType, `${systemInstruction}\n\n${userPrompt}`);
};
