import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isBrowser = typeof window !== "undefined" && typeof localStorage !== "undefined";

/** True only when real credentials are present at build time. */
export const supabaseConfigured = !!(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn(
    "[Talentra] ⚠️  Supabase credentials not configured.\n" +
      "For local development, create .env.local with:\n" +
      "  VITE_SUPABASE_URL=your-url\n" +
      "  VITE_SUPABASE_ANON_KEY=your-key\n\n" +
      "For Vercel production, add these to Environment Variables.\n" +
      "Get values from: Supabase → Project Settings → API",
  );
}

// Create client with placeholder credentials if not configured
// (allows app to load in dev without credentials, but won't connect to real DB)
const clientUrl = SUPABASE_URL || "https://placeholder.supabase.co";
const clientKey = SUPABASE_PUBLISHABLE_KEY || "placeholder-key";

export const supabase = createClient<Database>(clientUrl, clientKey, {
  auth: {
    storage: isBrowser ? localStorage : undefined,
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
  },
});
