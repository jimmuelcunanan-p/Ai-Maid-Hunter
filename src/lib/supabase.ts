import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

function isValidSupabaseConfiguration(
  candidateUrl: string | undefined,
  candidateKey: string | undefined,
): candidateUrl is string {
  if (!candidateUrl?.trim() || !candidateKey?.trim()) return false;
  try {
    const parsedUrl = new URL(candidateUrl.trim());
    return parsedUrl.protocol === "https:" && parsedUrl.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = isValidSupabaseConfiguration(url, key);
const configuredUrl = isSupabaseConfigured ? (url as string).trim() : "https://example.supabase.co";
const configuredKey = isSupabaseConfigured ? (key as string).trim() : "demo-key";
export const supabase = createClient(
  configuredUrl,
  configuredKey,
  {
  auth: { persistSession:true, autoRefreshToken:true }
  },
);
