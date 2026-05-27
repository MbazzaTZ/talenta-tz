import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = 'https://qqbfvxlgqbspvybzsklv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYmZ2eGxncWJzcHZ5Ynpza2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDMxNzcsImV4cCI6MjA5NTM3OTE3N30.ty9dUH9S-ZP1Xq8FuWJtSv38fZj7r8wSezYB5ix15MQ';

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
