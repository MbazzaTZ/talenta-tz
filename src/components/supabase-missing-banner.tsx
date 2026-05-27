import { supabaseConfigured } from '@/integrations/supabase/client';

/**
 * Shown at the top of every page when Supabase env vars are missing.
 * Disappears automatically once the build includes real credentials.
 */
export function SupabaseMissingBanner() {
  if (supabaseConfigured) return null;

  return (
    <div className="bg-destructive text-destructive-foreground px-4 py-2 text-center text-sm font-medium">
      ⚠️ Supabase is not configured. Add{' '}
      <code className="rounded bg-black/20 px-1">VITE_SUPABASE_URL</code> and{' '}
      <code className="rounded bg-black/20 px-1">VITE_SUPABASE_ANON_KEY</code> to your Vercel
      environment variables, then redeploy.
    </div>
  );
}
