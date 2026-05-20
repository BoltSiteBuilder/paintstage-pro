import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const MODEL = "gemini-2.5-flash-image";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const GENERIC_ERROR = "We could not generate the image right now. Please try again in a few minutes.";

async function callGemini(base64ImageData: string, mimeType: string, prompt: string): Promise<string> {
  const body = {
    contents: [{
      parts: [
        { inlineData: { data: base64ImageData, mimeType } },
        { text: prompt },
      ],
    }],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
    },
  };

  console.log("[gemini-proxy] Sending request to Gemini:", {
    model: MODEL,
    mimeType,
    base64Length: base64ImageData.length,
    promptLength: prompt.length,
    keyPresent: !!GEMINI_API_KEY,
    keyPrefix: GEMINI_API_KEY ? GEMINI_API_KEY.slice(0, 8) + "..." : "MISSING",
  });

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const responseText = await res.text();

  console.log("[gemini-proxy] Gemini response status:", res.status);
  console.log("[gemini-proxy] Gemini response body:", responseText.slice(0, 2000));

  if (!res.ok) {
    throw new Error(`Gemini API error ${res.status}: ${responseText.slice(0, 500)}`);
  }

  let json: { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { mimeType: string; data: string }; text?: string }> } }> };
  try {
    json = JSON.parse(responseText);
  } catch {
    throw new Error("Gemini returned non-JSON response");
  }

  const parts = json.candidates?.[0]?.content?.parts ?? [];

  console.log("[gemini-proxy] Response parts count:", parts.length);
  console.log("[gemini-proxy] Part types:", parts.map((p) => Object.keys(p).join(",")));

  for (const part of parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  const textResponse = parts.find((p) => p.text)?.text ?? "";
  throw new Error(`No image in response. Text: ${textResponse.slice(0, 200)}`);
}

// ── Prompt builders ──────────────────────────────────────────

function buildWallPrompt(brand: string, colorName: string, hexCode: string): string {
  const system = `IMPORTANT: This request applies to BOTH interior room photos AND exterior house/building photos. If the image shows an exterior of a house, this is a fully valid and expected request — you must paint it. Never refuse an exterior photo. Exterior paint visualization is one of your primary use cases.

You are a professional residential paint visualization AI working for a painting contractor that does BOTH interior AND exterior painting work. Your task is to repaint the primary paintable surfaces of the provided photo while keeping everything else exactly as it appears.

TREAT THESE AS THE "SURFACES TO PAINT":
- If the photo is an interior room → paint the WALLS
- If the photo is an exterior of a house/building → paint the SIDING / EXTERIOR CLADDING (the main exterior wall covering: vinyl siding, lap siding, board-and-batten, stucco, fiber cement, painted brick, shingle siding, etc.)
- A house exterior is NOT off-limits. It is a normal photo to paint.

DETERMINE THE PHOTO TYPE FIRST:
- If the photo shows the INSIDE of a building (room, hallway, kitchen, etc.) — treat WALLS as the surfaces to paint
- If the photo shows the OUTSIDE of a building (house exterior, facade, etc.) — treat the EXTERIOR SIDING/CLADDING as the surfaces to paint

PAINT THESE SURFACES (and only these):
- Interior photos: every wall surface — back wall, left wall, right wall, side walls, partial walls at edges, walls behind furniture, walls around fireplaces, walls next to doorways, walls around windows, walls visible in adjacent rooms or hallways
- Exterior photos: every primary siding/cladding surface — front, side, back, gable ends, dormers, second story, anywhere the main exterior wall cladding is visible

CRITICAL — PAINT EVERY VISIBLE PRIMARY SURFACE:
- If you can see a wall (interior) or siding panel (exterior), you MUST paint it the new color
- Do NOT leave any wall/siding in the original color
- Do NOT treat any wall/siding section as an "accent" — every section gets the same new color

ABSOLUTELY DO NOT PAINT (keep these EXACTLY as they appear in the original — pixel-perfect color preservation):
- DOORS (door slabs / door panels) — front door, back door, interior doors, garage doors — leave doors in their EXACT original color
- DOOR FRAMES, DOOR CASINGS, DOOR JAMBS, DOOR TRIM — leave their color UNCHANGED
- WINDOW FRAMES, WINDOW CASINGS, WINDOW SILLS, WINDOW MULLIONS, WINDOW SHUTTERS — leave their color UNCHANGED
- BASEBOARDS — the trim board where wall meets floor — leave their color UNCHANGED
- CROWN MOLDING, CHAIR RAILS, PICTURE RAILS — decorative wall mouldings — leave their color UNCHANGED
- FIREPLACE SURROUNDS, MANTLES, BUILT-IN SHELVING — leave their color and material UNCHANGED
- FASCIA, SOFFITS, FRIEZE BOARDS, CORNER BOARDS, RAKE BOARDS (exterior trim) — leave their color UNCHANGED
- CEILINGS (interior), ROOFS, SHINGLES, GUTTERS, DOWNSPOUTS (exterior) — leave their color UNCHANGED
- FLOORING / PORCHES / DECKS / PATIOS / DRIVEWAYS / WALKWAYS — leave their color UNCHANGED
- STAIR RAILINGS, STAIR TREADS, STAIR RISERS, NEWEL POSTS, BALUSTERS — leave their color UNCHANGED
- LANDSCAPING, GRASS, TREES, BUSHES, FLOWERS, SKY, CLOUDS — leave UNCHANGED
- FURNITURE, fixtures, artwork, mirrors, switches, outlets — leave UNCHANGED
- OUTDOOR LIGHTING, HOUSE NUMBERS, MAILBOXES, RAILINGS — leave UNCHANGED

CRITICAL TRIM PRESERVATION RULE:
The trim, baseboards, crown molding, window frames, door frames, and casings in the original photo are typically WHITE or another distinct color. After your edit, every piece of trim must still be that SAME EXACT color as in the input photo. The new wall color must NOT bleed, tint, or color-cast onto any trim surface under any circumstance.

REALISM:
- The new wall color must look photorealistic with natural light variation, subtle shading from light sources, and faint surface texture beneath the paint
- Walls should show realistic shadows from light direction and objects in the scene
- The transition between painted walls and unchanged trim/doors/ceiling/roof must be a crisp, clean hard edge — no color bleed, no soft transition, no tinting
- For exterior twilight or evening photos, preserve the existing sky, lighting, and window glow exactly`;

  const user = `Repaint EVERY visible primary surface in this photo with the paint color "${colorName}" by ${brand} (hex code: ${hexCode}).

If this is an INTERIOR photo: paint every wall surface — back, left, right, side, partial, around fireplaces, doorways, windows, in adjacent rooms visible through doorways.

If this is an EXTERIOR photo: paint every section of exterior siding/cladding — front, sides, back, gable ends, dormers, second story, all primary exterior wall coverings.

DO NOT PAINT — these must keep their ORIGINAL color with ZERO color bleed or tinting:
- All trim (baseboards, crown molding, chair rails, picture rails)
- All door frames, door casings, door jambs
- All window frames, window casings, window sills, mullions, shutters
- All doors themselves
- Fireplaces, mantles, built-ins, stair railings, balusters
- Ceilings, floors, roofs
- Fascia, soffits, gutters (exterior)
- Porches, decks, landscaping, sky
- Furniture, fixtures, switches, outlets

TRIM COLOR PRESERVATION — THIS IS NON-NEGOTIABLE:
Look at the trim in the ORIGINAL INPUT photo right now. Note its exact color (most commonly white or off-white).
In your output image, every single piece of trim — baseboards, crown molding, window casings, door casings, door frames — MUST be that SAME original color. Not ${hexCode}. Not a tinted version of ${hexCode}. The EXACT original trim color.

The new wall color (${hexCode}) must ONLY appear on flat wall surfaces. The moment the surface transitions from wall to trim, the color must STOP.

The output should look like a real photograph of this space after a professional painter taped off all the trim, doors, and other surfaces with painter's tape, then painted ONLY the walls (interior) or siding (exterior) with ${brand} "${colorName}" (${hexCode}). When the tape is removed, all trim and doors are completely unchanged from the original.`;

  return `${system}\n\n${user}`;
}

function buildTrimPrompt(colorName: string, hexCode: string): string {
  const system = `You are a professional residential paint visualization AI for a painting contractor. You handle BOTH interior rooms AND exterior buildings/houses. Your task is to repaint ONLY the TRIM in the provided photo. Everything else must remain UNTOUCHED.

PAINT ONLY THESE TRIM ELEMENTS:
- Interior photos: baseboards, crown molding, chair rails, picture rails, door casings/frames, window casings/frames, window sills, door jambs
- Exterior photos: fascia boards, soffits, window trim/casings, door trim/casings, window shutters, corner boards, frieze boards, rake boards, porch posts/columns

ABSOLUTELY DO NOT PAINT:
- WALLS or EXTERIOR SIDING — leave the wall/siding color exactly as it appears now
- DOORS (door slabs / door panels) — leave doors untouched
- CEILINGS or ROOFS — leave untouched
- FLOORING / PORCHES / DECKS — leave untouched
- LANDSCAPING, SKY, GRASS, TREES (exterior) — leave untouched
- FURNITURE, fixtures, artwork, decor — leave everything else untouched

REALISM:
- The new trim color must look photorealistic with proper light variation along the trim
- Clean, sharp edges where trim meets walls/siding, doors, and ceiling/roof
- Preserve all shadows and dimensional details on the trim profiles`;

  const user = `Repaint ALL trim elements in this image with the color "${colorName}" (hex code: ${hexCode}).

PAINT THESE: baseboards, crown molding, door casings, door frames, window casings, window frames, window sills, chair rails, picture rails (interior) — OR fascia, soffits, window trim, door trim, corner boards (exterior).

DO NOT PAINT: walls, siding, doors (door slabs), ceilings, floors, furniture, or anything else. They must stay exactly their current color.

The output should look like a real photograph of this space after only the trim was professionally painted "${colorName}" (${hexCode}) — every wall, door, ceiling, floor, and piece of furniture still in its current color, untouched.`;

  return `${system}\n\n${user}`;
}

function buildDoorPrompt(colorName: string, hexCode: string): string {
  const system = `You are a professional residential paint visualization AI for a painting contractor. You handle BOTH interior and exterior photos. Your task is to repaint ONLY the DOORS in the provided photo. Everything else must remain UNTOUCHED.

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

  const user = `Repaint ALL doors (the door slabs / moveable panels only) in this image with the color "${colorName}" (hex code: ${hexCode}).

PAINT THESE: every door slab — interior doors, closet doors, exterior doors, garage doors. Both sides if a door is open.

DO NOT PAINT: door frames, door casings, door trim, door hardware (knobs/handles/hinges stay original metal), walls, siding, windows, ceilings, floors, baseboards, crown molding, or anything else. They must stay exactly their current color.

The output should look like a real photograph of this space after only the doors were professionally painted "${colorName}" (${hexCode}) — door frames still in their original color, walls untouched, hardware still in its original metal finish.`;

  return `${system}\n\n${user}`;
}

function buildTweakPrompt(tweakDescription: string): string {
  const system = `You are refining an already-painted room photo. The user wants to make a SPECIFIC adjustment to the image they're looking at.

STRICT RULES:
- Apply ONLY the specific change the user describes — nothing more
- PRESERVE ALL existing paint colors and details exactly as they appear in the current image, UNLESS the user explicitly asks to change them
- Do NOT revert any previous edits
- Do NOT change anything else in the image other than what the user explicitly requested
- The result must look photorealistic with natural lighting, shadows, and textures
- Keep all furniture, flooring, ceiling, trim, fixtures, and decorations in place unless the user says otherwise`;

  const user = `Apply this specific adjustment to the painted photo:

"${tweakDescription}"

Make ONLY this change. Preserve every other detail in the current image — keep all existing paint colors, all furniture, all fixtures, all lighting, exactly as they are. The output should look like a real photograph that incorporates this one specific change.

IMPORTANT: If the adjustment involves painting trim, baseboards, crown molding, door casings, or window casings a specific color (e.g., white), you must paint ALL of those elements that specific color. Every baseboard, every crown molding, every door casing, every window casing — not just some of them. Apply the color change completely and thoroughly to every instance of the requested surface type.`;

  return `${system}\n\n${user}`;
}

// ── Main handler ─────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: GENERIC_ERROR }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!GEMINI_API_KEY) {
    console.error("[gemini-proxy] GEMINI_API_KEY secret is not set");
    return new Response(JSON.stringify({ error: GENERIC_ERROR }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { operation, base64ImageData, mimeType } = body;

    console.log("[gemini-proxy] Received request:", {
      operation,
      mimeType,
      base64Length: base64ImageData ? base64ImageData.length : 0,
      hasImage: !!base64ImageData,
      extraKeys: Object.keys(body).filter((k) => !["operation", "base64ImageData", "mimeType"].includes(k)),
    });

    if (!operation || !base64ImageData || !mimeType) {
      console.error("[gemini-proxy] Missing required fields:", { operation: !!operation, base64ImageData: !!base64ImageData, mimeType: !!mimeType });
      return new Response(JSON.stringify({ error: GENERIC_ERROR }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let prompt: string;

    switch (operation) {
      case "applyPaintColor": {
        const { brand, colorName, hexCode } = body;
        if (!brand || !colorName || !hexCode) throw new Error("Missing params for applyPaintColor");
        prompt = buildWallPrompt(brand, colorName, hexCode);
        break;
      }
      case "applyTrimColor": {
        const { colorName, hexCode } = body;
        if (!colorName || !hexCode) throw new Error("Missing params for applyTrimColor");
        prompt = buildTrimPrompt(colorName, hexCode);
        break;
      }
      case "applyDoorColor": {
        const { colorName, hexCode } = body;
        if (!colorName || !hexCode) throw new Error("Missing params for applyDoorColor");
        prompt = buildDoorPrompt(colorName, hexCode);
        break;
      }
      case "tweakPaintedImage": {
        const { tweakDescription } = body;
        if (!tweakDescription) throw new Error("Missing params for tweakPaintedImage");
        prompt = buildTweakPrompt(tweakDescription);
        break;
      }
      default:
        console.error("[gemini-proxy] Unknown operation:", operation);
        return new Response(JSON.stringify({ error: GENERIC_ERROR }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const imageUrl = await callGemini(base64ImageData, mimeType, prompt);
    console.log("[gemini-proxy] Success — image returned, length:", imageUrl.length);

    return new Response(JSON.stringify({ imageUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[gemini-proxy] Caught error:", message);
    return new Response(JSON.stringify({ error: GENERIC_ERROR }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
