# Local Development Setup - ENVIRONMENT VARIABLES

## Quick Start

To run talenta-tz locally with database connectivity:

### 1. Get Your Supabase Credentials

1. Go to **Supabase Dashboard** → https://supabase.com/dashboard
2. Select your project
3. Click **Settings** (gear icon, bottom left)
4. Click **API** in the sidebar
5. Copy these values:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon Key** (public) → `VITE_SUPABASE_ANON_KEY`

### 2. Create `.env.local` File

```bash
# In project root directory, create .env.local
touch .env.local
```

### 3. Add Your Credentials

Paste into `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

⚠️ **Important:**
- Never commit `.env.local` to git (it's in `.gitignore`)
- Never share these credentials
- The anon key shown in Supabase is safe for frontend use (it's limited by Row Level Security policies)

### 4. Start Development Server

```bash
npm run dev
```

The app will now connect to your Supabase database!

---

## Testing Without Credentials

If you just want to browse the UI without a database:

```bash
npm run dev
```

The app will load with placeholder credentials and show a warning in console. Database operations will fail, but UI renders fine for testing.

---

## Troubleshooting

### "supabaseUrl is required" Error
→ You're missing `.env.local` or it's empty
→ Follow steps 1-3 above

### Can't see Supabase credentials
→ Make sure you're logged into Supabase dashboard with the correct account
→ Check that the project exists (not deleted)

### Wrong credentials
→ Double-check you copied the correct values
→ Delete `.env.local` and start over

---

## For Production (Vercel)

Don't use `.env.local` on Vercel!

Instead, add environment variables directly in **Vercel Dashboard**:

1. Go to your Vercel project
2. Settings → Environment Variables
3. Add:
   - Key: `VITE_SUPABASE_URL` → Value: `https://your-project.supabase.co`
   - Key: `VITE_SUPABASE_ANON_KEY` → Value: `your-anon-key`
4. Click "Redeploy" to apply changes

✅ Done! Your production deployment will now use the real database.

---

**Questions?** Check the main `DEPLOYMENT_GUIDE.md` or `PRODUCTION_READINESS_REPORT.md`
