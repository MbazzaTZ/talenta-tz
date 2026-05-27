# Talenta-TZ V2 - Quick Reference Guide

**Quick start guide for integrating and using new v2 features.**

---

## 🚀 Fastest Integration Path

### 1. Add Universal Search to Header (5 minutes)

```typescript
// src/components/site-chrome.tsx
import { UniversalSearchBar } from "@/components/universal-search";

export function SiteHeader() {
  return (
    <header className="flex items-center gap-4">
      <UniversalSearchBar />
      {/* ...rest of header */}
    </header>
  );
}
```

### 2. Add Talent Showcase to Dashboard (5 minutes)

```typescript
// src/routes/dashboard.tsx
import { TalentShowcase } from "@/components/talent-showcase";

export function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* ...existing sections */}
      <TalentShowcase userId={userId} isEditable={true} />
    </div>
  );
}
```

### 3. Add Report Button to Job Cards (2 minutes)

```typescript
// src/components/job-card.tsx or job.$id.tsx
import { CompactReportButton } from "@/components/report-abuse";

<CompactReportButton reportedJobId={job.id} />
```

### 4. Create Supabase Tables (10 minutes)

Copy & paste SQL from `FEATURES_IMPLEMENTATION_GUIDE.md` into Supabase.

**Done!** ✅ Basic integration complete.

---

## 📚 Component Quick Links

| Component | Import | Purpose | Time |
|-----------|--------|---------|------|
| **UniversalSearch** | `universal-search.tsx` | Global search bar | 5m |
| **UniversalSearchBar** | `universal-search.tsx` | Compact header search | 2m |
| **VerificationBadge** | `verification-badge.tsx` | Show badges on profiles | 2m |
| **InstitutionVerificationAdmin** | `institution-verification-admin.tsx` | Admin approval UI | 10m |
| **TalentShowcase** | `talent-showcase.tsx` | Portfolio/gallery | 5m |
| **RecruiterTalentSearch** | `recruiter-talent-search.tsx` | Talent discovery page | 15m |
| **ReportAbuse** | `report-abuse.tsx` | Report content dialog | 3m |
| **CompactReportButton** | `report-abuse.tsx` | Inline report icon | 1m |

---

## 🔧 Key Functions

### Search & Discovery
```typescript
// Global search
const results = await universalSearch(query);

// Recruiter talent search
const { results, total } = await searchTalent(filters);
```

### Verification
```typescript
// Request verification
await requestStudentVerification(studentId, institutionId, data);

// Approve (admin)
await approveVerification(requestId, adminId);

// Get badges
const badges = await getUserBadges(userId);
```

### Portfolio
```typescript
// Add showcase item
await createShowcaseItem(userId, item);

// Get portfolio
const items = await getUserShowcase(userId);

// Get featured items
const featured = await getFeaturedShowcaseItems(userId);
```

### Trust & Safety
```typescript
// Report content
await reportContent({...});

// Get user safety score
const metrics = await getUserSafetyMetrics(userId);
```

---

## 🎨 Component Props

### UniversalSearch
```typescript
<UniversalSearch
  placeholder="Search jobs, people, companies..."
  showFilters={true}
  minChars={2}
  debounceMs={300}
  onNavigate={(result) => {}}
/>
```

### VerificationBadge
```typescript
<VerificationBadge
  badges={userBadges}
  verificationStatus="verified"
  size="md"  // sm | md | lg
  showLabel={true}
/>
```

### TalentShowcase
```typescript
<TalentShowcase
  userId={userId}
  isEditable={true}
  showFeaturedOnly={false}
/>
```

### RecruiterTalentSearch
```typescript
<RecruiterTalentSearch
  onTalentSelect={(talentId) => {}}
/>
```

### ReportAbuse
```typescript
<ReportAbuse
  reportedUserId={userId}
  reportedJobId={jobId}
/>
```

---

## 📱 Mobile-First Features

All new components are:
- ✅ Fully responsive
- ✅ Touch-friendly (44px+ buttons)
- ✅ Optimized for small screens
- ✅ Lazy-loading images
- ✅ Horizontal scrolling for galleries

---

## 🗄️ Database Schema Cheat Sheet

**6 new tables to create:**

1. `institutions` - Institution accounts
2. `student_verification_requests` - Verification workflow
3. `user_badges` - User achievements
4. `talent_showcases` - Portfolio items
5. `reports` - Trust & safety
6. `safety_metrics` - User trust scores

Full SQL in `FEATURES_IMPLEMENTATION_GUIDE.md`

---

## ✅ Testing Checklist

Quick test for each feature:

### Verification System
- [ ] Create institution account
- [ ] Request student verification
- [ ] Approve/reject as admin
- [ ] Verify badge appears

### Talent Showcase
- [ ] Add showcase item
- [ ] Upload media
- [ ] Mark as featured
- [ ] Check privacy controls

### Universal Search
- [ ] Search for job
- [ ] Search for person
- [ ] Filter by entity type
- [ ] Test on mobile

### Recruiter Search
- [ ] Apply filters
- [ ] View talent cards
- [ ] Check badge display
- [ ] Test pagination

### Report System
- [ ] Open report dialog
- [ ] Submit report
- [ ] Verify confirmation

---

## 🎯 Integration Timeline

**Recommended phased rollout:**

| Phase | Features | Timeline |
|-------|----------|----------|
| **Phase 1** | Universal Search | Week 1 |
| **Phase 2** | Talent Showcase | Week 2 |
| **Phase 3** | Verification System | Week 3 |
| **Phase 4** | Recruiter Search | Week 4 |
| **Phase 5** | Report System | Week 5 |

**Fully integrated: ~5 weeks**

---

## 📊 File Structure

```
New files:
src/
├── lib/
│   ├── enhanced-types.ts         (Types)
│   └── supabase-enhanced.ts      (Data functions)
├── components/
│   ├── verification-badge.tsx
│   ├── institution-verification-admin.tsx
│   ├── talent-showcase.tsx
│   ├── universal-search.tsx
│   ├── recruiter-talent-search.tsx
│   └── report-abuse.tsx

Documentation:
├── FEATURES_IMPLEMENTATION_GUIDE.md  (Full guide)
└── V2_QUICK_REFERENCE.md           (This file)
```

---

## 🆘 Common Issues

### "Component not found"
→ Make sure to import from `src/components/`

### "Type not found"
→ Import types from `src/lib/enhanced-types.ts`

### "Data function error"
→ Check Supabase table exists and RLS policies allow access

### "Search returning no results"
→ Verify debounce delay and minimum characters (default 2)

### "Mobile layout broken"
→ All components responsive - check parent container width

---

## 📖 Full Documentation

For detailed implementation:
→ See `FEATURES_IMPLEMENTATION_GUIDE.md`

For each component:
→ Check JSDoc comments in component files

For database setup:
→ Copy SQL from implementation guide

---

## 🚀 Deploy to Production

1. **Create tables** - SQL from guide
2. **Set RLS policies** - Protect data access
3. **Import components** - Follow examples
4. **Test thoroughly** - Use checklist
5. **Deploy gradually** - Phased rollout
6. **Monitor metrics** - Track adoption

---

## 💡 Pro Tips

1. **Universal search** works best in header - add immediately
2. **Talent showcase** is optional - enable per-profile
3. **Verification** requires institution setup first
4. **Recruiter search** should be admin-only route
5. **Reports** are anonymous - promote safety

---

## 🎓 Learning Resources

- TanStack Query docs: For data fetching patterns
- Shadcn/ui docs: For component customization
- Supabase docs: For database setup & RLS

---

**Last Updated:** May 27, 2026  
**Status:** Production-Ready ✅  
**Questions?** Check `FEATURES_IMPLEMENTATION_GUIDE.md`
