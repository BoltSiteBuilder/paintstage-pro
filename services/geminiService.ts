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
// Apply paint color to WALLS (or exterior siding) ONLY
// ────────────────────────────────────────────────────────────
export const applyPaintColor = async (
  base64ImageData: string,
  mimeType: string,
  brand: string,
  colorName: string,
  hexCode: string
): Promise<string> => {
  const systemInstruction = `You are an expert paint visualization AI. Your ONLY task is to repaint the WALLS (for interior photos) or the SIDING (for exterior photos) of the provided photo. Everything else must remain UNTOUCHED in its original color.

PAINT THESE SURFACES (and only these):
- For interior photos: every wall surface — back wall, left wall, right wall, side walls, partial walls at the edges, walls behind furniture, walls around fireplaces, walls next to doorways, walls around windows, walls visible in adjacent rooms or hallways
- For exterior photos: every main exterior siding/wall surface — the primary cladding of the building

CRITICAL — PAINT EVERY VISIBLE WALL/SIDING SURFACE:
- If you can see a wall/siding surface, you MUST paint it the new color
- Do NOT leave any wall/siding in the original color
- Do NOT treat any wall as an "accent" — every wall gets the same new color

ABSOLUTELY DO NOT PAINT (keep these EXACTLY as they appear in the original):
- DOORS (door slabs / door panels) — leave doors in their original color completely
- DOOR FRAMES, DOOR CASINGS, DOOR JAMBS — leave all door trim untouched
- WINDOW FRAMES, WINDOW CASINGS, WINDOW SILLS — leave all window trim untouched
- BASEBOARDS — leave all baseboards untouched
- CROWN MOLDING, CHAIR RAILS, PICTURE RAILS — leave all moldings untouched
- CEILINGS (and tray ceilings, coffered ceilings) — leave all ceilings untouched
- FLOORING (wood, tile, carpet, concrete) — leave all floors untouched
- FURNITURE, fixtures, artwork, mirrors, switches, outlets — leave all decor untouched
- For exterior: roofs, fascia, soffits, gutters, garage doors, front doors, window/door trim — leave untouched

REALISM:
- The new wall color must look photorealistic with natural light variation, subtle shading from light sources, and faint wall texture beneath the paint
- Walls should show realistic shadows from light direction and any objects in the room
- The transition between the painted walls and the unchanged trim/doors/ceiling must be crisp and clean, matching the natural edges of the architecture`;

  const userPrompt = `Repaint EVERY visible wall surface (or for exterior photos, every siding surface) in this image with the paint color "${colorName}" by ${brand} (hex code: ${hexCode}).

PAINT THESE: every wall/siding surface — back, left, right, side, partial, around fireplaces, around doorways, around windows, in adjacent rooms visible through doorways.

DO NOT PAINT: doors, door frames, door casings, window frames, window casings, baseboards, crown molding, ceilings, floors, furniture, or any other element. These must stay EXACTLY their original color.

The output should look like a real photograph of this space after only the walls (or siding) were professionally painted with ${brand} "${colorName}" (${hexCode}) — every door, trim piece, baseboard, ceiling, and floor still in its original color, untouched.`;

  return generateImage(base64ImageData, mimeType, `${systemInstruction}\n\n${userPrompt}`);
};

// ────────────────────────────────────────────────────────────
// Apply paint color to TRIM ONLY (baseboards, crown molding, casings)
// ────────────────────────────────────────────────────────────
export const applyTrimColor = async (
  base64ImageData: string,
  mimeType: string,
  colorName: string,
  hexCode: string
): Promise<string> => {
  const systemInstruction = `You are an expert paint visualization AI. Your ONLY task is to repaint the TRIM in the provided photo. Everything else must remain UNTOUCHED.

PAINT ONLY THESE TRIM ELEMENTS:
- For interior photos: baseboards, crown molding, chair rails, picture rails, door casings/frames, window casings/frames, window sills, door jambs
- For exterior photos: fascia boards, soffits, window trim/casings, door trim/casings, corner boards, frieze boards, rake boards

ABSOLUTELY DO NOT PAINT:
- WALLS or SIDING — leave the wall/siding color exactly as it appears now
- DOORS (door slabs / door panels) — leave doors untouched
- CEILINGS — leave ceilings untouched
- FLOORING — leave floors untouched
- FURNITURE, fixtures, artwork, decor — leave everything else untouched

REALISM:
- The new trim color must look photorealistic with proper light variation along the trim
- Clean, sharp edges where trim meets walls, doors, and ceiling
- Preserve all shadows and dimensional details on the trim profiles`;

  const userPrompt = `Repaint ALL trim elements in this image with the color "${colorName}" (hex code: ${hexCode}).

PAINT THESE: baseboards, crown molding, door casings, door frames, window casings, window frames, window sills, chair rails, picture rails (interior) — OR fascia, soffits, window trim, door trim, corner boards (exterior).

DO NOT PAINT: walls, siding, doors (door slabs), ceilings, floors, furniture, or anything else. They must stay exactly their current color.

The output should look like a real photograph of this space after only the trim was professionally painted "${colorName}" (${hexCode}) — every wall, door, ceiling, floor, and piece of furniture still in its current color, untouched.`;

  return generateImage(base64ImageData, mimeType, `${systemInstruction}\n\n${userPrompt}`);
};

// ────────────────────────────────────────────────────────────
// Apply paint color to DOORS ONLY (door slabs / panels)
// ────────────────────────────────────────────────────────────
export const applyDoorColor = async (
  base64ImageData: string,
  mimeType: string,
  colorName: string,
  hexCode: string
): Promise<string> => {
  const systemInstruction = `You are an expert paint visualization AI. Your ONLY task is to repaint the DOORS in the provided photo. Everything else must remain UNTOUCHED.

PAINT ONLY THE DOOR SLABS:
- The moveable door panels themselves — the flat or paneled face of each door
- This includes interior doors, closet doors, front doors (exterior), back doors, and any garage doors visible
- Paint both sides of doors that are open (if visible)

ABSOLUTELY DO NOT PAINT:
- DOOR FRAMES, DOOR CASINGS, DOOR JAMBS, DOOR TRIM — these are NOT the door itself, leave them untouched
- WALLS, SIDING — leave walls and siding completely untouched
- CEILINGS, FLOORS — leave untouched
- WINDOWS, WINDOW TRIM — leave untouched
- BASEBOARDS, CROWN MOLDING — leave untouched
- DOOR HARDWARE (knobs, handles, hinges, locks, kick plates) — leave hardware in its original metal finish
- FURNITURE, fixtures, decor — leave untouched

REALISM:
- The new door color must look photorealistic with natural light variation across the door face
- Preserve all panel details, recesses, raised panels, and architectural details of each door
- Door hardware (knobs, hinges) must remain its original metal/finish
- Clean, crisp edges where the door meets its frame`;

  const userPrompt = `Repaint ALL doors (the door slabs / moveable panels only) in this image with the color "${colorName}" (hex code: ${hexCode}).

PAINT THESE: every door slab — interior doors, closet doors, exterior doors, garage doors. Both sides if a door is open.

DO NOT PAINT: door frames, door casings, door trim, door hardware (knobs/handles/hinges stay original metal), walls, siding, windows, ceilings, floors, baseboards, crown molding, or anything else. They must stay exactly their current color.

The output should look like a real photograph of this space after only the doors were professionally painted "${colorName}" (${hexCode}) — door frames still in their original color, walls untouched, hardware still in its original metal finish.`;

  return generateImage(base64ImageData, mimeType, `${systemInstruction}\n\n${userPrompt}`);
};

// ────────────────────────────────────────────────────────────
// Apply a free-form tweak to an already-painted image
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

  const userPrompt = `Apply this specific adjustment to the painted photo:

"${tweakDescription}"

Make ONLY this change. Preserve every other detail in the current image — keep all existing paint colors, all furniture, all fixtures, all lighting, exactly as they are. The output should look like a real photograph that incorporates this one specific change.`;

  return generateImage(base64ImageData, mimeType, `${systemInstruction}\n\n${userPrompt}`);
};
