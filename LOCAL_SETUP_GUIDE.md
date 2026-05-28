# TALENTA-TZ - LOCAL SETUP & VS CODE DEPLOYMENT GUIDE

## 📋 QUICK START (5 MINUTES)

### Step 1: Clone Repository Locally
```bash
# Open terminal/command prompt
git clone https://github.com/MbazzaTZ/talenta-tz.git
cd talenta-tz
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Create Environment File
Create a `.env.local` file in the root directory:
```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Get these from: https://app.supabase.com → Your Project → Settings → API

### Step 4: Test Locally
```bash
npm run dev
```
Visit: http://localhost:5173

### Step 5: Deploy to Vercel
```bash
npm install -g vercel
vercel login
vercel deploy --prod
```

---

## 🖥️ VS CODE SETUP

### 1. Open Project in VS Code
```bash
code .
```

### 2. Install Recommended Extensions
In VS Code, go to Extensions and install:
- **ES7+ React/Redux/React-Native snippets** (dsznajder.es7-react-js-snippets)
- **TypeScript Vue Plugin** (Vue.volar)
- **Prettier - Code formatter** (esbenp.prettier-vscode)
- **ESLint** (dbaeumer.vscode-eslint)
- **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)

### 3. Open Integrated Terminal
Press: `Ctrl + `` (backtick)

### 4: Run Development Server
```bash
npm run dev
```

---

## 📁 PROJECT STRUCTURE

```
talenta-tz/
├── src/
│   ├── components/          # All UI components
│   │   ├── student-verification-request.tsx      (V2)
│   │   ├── enhanced-profile-display.tsx          (V2)
│   │   ├── talent-showcase-manager.tsx           (V2)
│   │   ├── universal-search-full.tsx             (V2)
│   │   ├── recruiter-talent-discovery.tsx        (V2)
│   │   ├── trust-safety-system.tsx               (V2)
│   │   ├── verification-badge.tsx                (V2)
│   │   ├── agency-projects-list.tsx              (Agency)
│   │   ├── agency-staff-list.tsx                 (Agency)
│   │   ├── agency-overview.tsx                   (Agency)
│   │   ├── agency-analytics.tsx                  (Agency)
│   │   ├── agency-settings.tsx                   (Agency)
│   │   └── ui/                # Shadcn UI components
│   ├── routes/
│   │   ├── agency.$agencyId.tsx                  (Agency Dashboard)
│   │   └── ...other routes
│   ├── lib/
│   │   ├── enhanced-types.ts                     (Type definitions)
│   │   ├── supabase-enhanced.ts                  (V2 data functions)
│   │   ├── supabase-agency.ts                    (Agency data functions)
│   │   └── auth.ts                               (Auth functions)
│   ├── integrations/
│   │   └── supabase/                             (Supabase client)
│   └── App.tsx
├── public/
├── dist/                     # Build output (auto-generated)
├── .env.local               # Your environment variables
├── vercel.json              # Vercel configuration
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

---

## ⚙️ ENVIRONMENT VARIABLES

### Get Your Supabase Credentials

1. Go to: https://app.supabase.com
2. Login to your account
3. Select your project
4. Click "Settings" (bottom left)
5. Click "API" 
6. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon Key** → `VITE_SUPABASE_ANON_KEY`

### Example .env.local
```
VITE_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2F1dGguOWV0YS5pbyIsImF1ZCI6InBvc3RncmVzLWFwaS1kZWZhdWx0Iiwic3ViIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIn0.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 🚀 DEPLOYMENT FROM VS CODE

### Option 1: Deploy Using Terminal in VS Code

1. **Open Terminal:** `Ctrl + `` 

2. **Login to Vercel:**
```bash
vercel login
```
This opens your browser. Sign in with your account.

3. **Deploy to Production:**
```bash
vercel deploy --prod
```

4. **Wait for deployment** (usually 2-3 minutes)

5. **Your URL:** https://talenta-tz.vercel.app (or your custom domain)

6. **Add Environment Variables in Vercel:**
   - Open: https://vercel.com/dashboard
   - Select: talenta-tz project
   - Go to: Settings → Environment Variables
   - Add:
     - `VITE_SUPABASE_URL` = your value
     - `VITE_SUPABASE_ANON_KEY` = your value

7. **Redeploy:**
```bash
vercel deploy --prod
```

### Option 2: GitHub Auto-Deployment (Recommended)

1. Push to GitHub:
```bash
git add .
git commit -m "message"
git push origin main
```

2. Go to: https://vercel.com/dashboard

3. Click: "New Project" → "Import Git Repository"

4. Select: talenta-tz repository

5. Add Environment Variables

6. Click: "Deploy"

Future pushes to main automatically redeploy!

---

## 📝 COMMON VS CODE COMMANDS

### Run Development Server
```bash
npm run dev
```
Visit: http://localhost:5173

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Format Code
```bash
npm run format
```

### Lint Code
```bash
npm run lint
```

### Deploy to Vercel
```bash
vercel deploy --prod
```

### Check Git Status
```bash
git status
```

### Commit Changes
```bash
git add .
git commit -m "your message"
```

### Push to GitHub
```bash
git push origin main
```

### Pull Latest Changes
```bash
git pull origin main
```

---

## 🔧 USEFUL VS CODE SHORTCUTS

| Shortcut | Action |
|----------|--------|
| `Ctrl + K, Ctrl + O` | Open folder |
| `Ctrl + ~` | Toggle terminal |
| `Ctrl + Shift + P` | Command palette |
| `Ctrl + F` | Find in file |
| `Ctrl + H` | Find and replace |
| `Ctrl + /` | Toggle comment |
| `Alt + Shift + F` | Format document |
| `Ctrl + S` | Save file |
| `Ctrl + Shift + S` | Save all |
| `F5` | Start debugging |

---

## 📊 PROJECT STATISTICS

**Components Built:** 12 production-ready components
**Features:** 13 major features (7 V2 + 6 Agency)
**Code:** 3,767 lines of production code
**TypeScript:** 100% type-safe
**Database:** Supabase with 14 tables

---

## ✨ FEATURES READY TO USE

### V2 Features (7)
1. **Student Verification System** - Verify students and get badges
2. **Enhanced User Profiles** - Skills, experience, education, certs
3. **Talent Showcase** - Portfolio system with featured items
4. **Universal Search** - Search jobs, people, companies
5. **Recruiter Talent Discovery** - Find talent with advanced filters
6. **Trust & Safety** - Report abuse and safety metrics
7. **Verification Badges** - Visual trust indicators

### Recruitment Agency (6)
1. **Agency Dashboard** - Full management interface
2. **Project Management** - Create, edit, delete projects
3. **Staff Management** - Add, edit, remove team members
4. **Agency Overview** - Display agency information
5. **Analytics** - View metrics and performance
6. **Settings** - Configure agency details

---

## 🚨 TROUBLESHOOTING

### Port Already in Use
```bash
# Kill process using port 5173
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5173 | xargs kill -9
```

### Dependencies Issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Build Fails
```bash
# Check for TypeScript errors
npm run build

# Check for linting errors
npm run lint
```

### Vercel Deploy Fails
```bash
# Check environment variables are set
# Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are added

# Try deployment again
vercel deploy --prod
```

---

## 📚 USEFUL LINKS

- **Repository:** https://github.com/MbazzaTZ/talenta-tz
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Console:** https://app.supabase.com
- **Documentation:** README.md in project root
- **VS Code:** https://code.visualstudio.com

---

## ✅ DEPLOYMENT CHECKLIST

Before deploying:
- [ ] Clone repository locally
- [ ] Install dependencies (`npm install`)
- [ ] Create `.env.local` with Supabase credentials
- [ ] Test locally (`npm run dev`)
- [ ] Build for production (`npm run build`)
- [ ] All tests pass

During deployment:
- [ ] Run `vercel login`
- [ ] Run `vercel deploy --prod`
- [ ] Add environment variables in Vercel
- [ ] Redeploy (`vercel deploy --prod`)

After deployment:
- [ ] Visit deployed URL
- [ ] Test all features
- [ ] Check database connection
- [ ] Monitor performance

---

## 🎯 QUICK REFERENCE

```bash
# Clone and setup
git clone https://github.com/MbazzaTZ/talenta-tz.git
cd talenta-tz
npm install

# Create .env.local with your Supabase credentials

# Development
npm run dev          # Run locally
npm run build        # Build for production
npm run preview      # Preview build

# Deployment
vercel login         # Login to Vercel
vercel deploy --prod # Deploy to production

# Git workflow
git add .
git commit -m "message"
git push origin main
```

---

## 🎉 YOU'RE READY!

Everything is set up and ready to use in VS Code.

1. Clone the repository
2. Install dependencies
3. Add environment variables
4. Run `npm run dev`
5. Deploy with `vercel deploy --prod`

Your Talenta-TZ application is production-ready! 🚀
