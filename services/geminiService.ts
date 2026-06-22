const PROXY_URL = 'https://gemini-proxy.robwarfield.workers.dev';

const GENERIC_ERROR = 'We could not generate the image right now. Please try again in a few minutes.';
const RETRY_DELAY_MS = 1500;

async function callProxyOnce(payload: Record<string, string>): Promise<string> {
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

async function callProxy(payload: Record<string, string>): Promise<string> {
  try {
    return await callProxyOnce(payload);
  } catch (err) {
    console.error('[geminiService] Request failed, retrying in 1.5s…', err);
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    try {
      return await callProxyOnce(payload);
    } catch (retryErr) {
      console.error('[geminiService] Retry also failed:', retryErr);
      throw new Error(GENERIC_ERROR);
    }
  }
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
