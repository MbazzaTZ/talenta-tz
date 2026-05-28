# DeepSeek AI Setup (Secure)

The DeepSeek API key lives **only** in Supabase as a secret. It is never in the
repo, never in the frontend, never in git. The browser calls our Edge Function;
the function calls DeepSeek.

## One-time setup

### 1. Install Supabase CLI (if needed)
```bash
npm install -g supabase
supabase login
```

### 2. Link your project
```bash
cd talenta-tz
supabase link --project-ref YOUR_PROJECT_REF
```
(Find YOUR_PROJECT_REF in Supabase → Project Settings → General → Reference ID.)

### 3. Set the API key as a secret (NOT in code)
```bash
supabase secrets set DEEPSEEK_API_KEY=sk-your-rotated-key-here
```
> Use a freshly rotated key. Set it once; rotating later is just this one command again.

### 4. Deploy the function
```bash
supabase functions deploy deepseek
```

That's it. The function is live at:
`https://YOUR_PROJECT_REF.supabase.co/functions/v1/deepseek`

## How the app uses it
The frontend calls it through `src/lib/ai.ts`:
- `aiExtractJob(text)` → structured job fields (used by admin/employer job import)
- `aiWriteCv(kind, context)` → CV summary or cover letter
- `aiChat(messages)` → general assistant

The job import already uses `aiExtractJob` with an automatic fallback to the
local heuristic if the function is unavailable — so nothing breaks if you
haven't deployed the function yet.

## What's safe / what's not
- ✅ The key is in Supabase secrets (server-side only)
- ✅ `.env`, `.env.local`, `supabase/.env` are gitignored
- ❌ Never put `sk-...` in any `.tsx`, `.ts`, `.env` that gets committed, or in chat

## Rotating the key
1. Generate a new key in your DeepSeek dashboard
2. Revoke the old one
3. `supabase secrets set DEEPSEEK_API_KEY=sk-new-key`
4. No redeploy needed — the function reads the secret at runtime
