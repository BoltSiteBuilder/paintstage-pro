import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

console.log('[PaintStage] Supabase URL at runtime:', supabaseUrl ?? 'UNDEFINED');
console.log('[PaintStage] Supabase key defined:', supabaseKey ? `YES (starts: ${supabaseKey.slice(0, 20)}…)` : 'UNDEFINED');

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
