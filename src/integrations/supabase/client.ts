import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const isBrowser = typeof window !== "undefined" && typeof localStorage !== "undefined";

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error(
    "[Talentra] ❌ Missing Supabase environment variables.\n" +
      "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vercel project settings,\n" +
      "then redeploy. Find these values in Supabase → Project Settings → API.",
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: isBrowser ? localStorage : undefined,
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
  },
});

/** True only when real credentials are present at build time. */
export const supabaseConfigured = !!(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
