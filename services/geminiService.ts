const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const PROXY_URL = `${SUPABASE_URL}/functions/v1/gemini-proxy`;

const GENERIC_ERROR = 'We could not generate the image right now. Please try again in a few minutes.';

async function callProxy(payload: Record<string, string>): Promise<string> {
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
  });

  let json: { imageUrl?: string; error?: string };
  try {
    json = await res.json();
  } catch {
    throw new Error(GENERIC_ERROR);
  }

  if (!res.ok || !json.imageUrl) {
    throw new Error(GENERIC_ERROR);
  }

  return json.imageUrl;
}

export const applyPaintColor = async (
  base64ImageData: string,
  mimeType: string,
  brand: string,
  colorName: string,
  hexCode: string
): Promise<string> => {
  return callProxy({ operation: 'applyPaintColor', base64ImageData, mimeType, brand, colorName, hexCode });
};

export const applyTrimColor = async (
  base64ImageData: string,
  mimeType: string,
  colorName: string,
  hexCode: string
): Promise<string> => {
  return callProxy({ operation: 'applyTrimColor', base64ImageData, mimeType, colorName, hexCode });
};

export const applyDoorColor = async (
  base64ImageData: string,
  mimeType: string,
  colorName: string,
  hexCode: string
): Promise<string> => {
  return callProxy({ operation: 'applyDoorColor', base64ImageData, mimeType, colorName, hexCode });
};

export const tweakPaintedImage = async (
  base64ImageData: string,
  mimeType: string,
  tweakDescription: string
): Promise<string> => {
  return callProxy({ operation: 'tweakPaintedImage', base64ImageData, mimeType, tweakDescription });
};
