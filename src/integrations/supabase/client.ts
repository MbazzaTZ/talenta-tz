import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

// Placeholder values keep the app from crashing when env vars are missing.
// All Supabase calls will fail gracefully — users will see auth errors rather than a blank crash.
const url = SUPABASE_URL || 'https://placeholder.supabase.co';
const key =
  SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.placeholder';

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error(
    '[Talentra] ❌ Missing Supabase environment variables.\n' +
      'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vercel project settings,\n' +
      'then redeploy. Find these values in Supabase → Project Settings → API.',
  );
}

export const supabase = createClient<Database>(url, key, {
  auth: {
    storage: isBrowser ? localStorage : undefined,
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
  },
});

/** True only when real credentials are present at build time. */
export const supabaseConfigured = !!(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
