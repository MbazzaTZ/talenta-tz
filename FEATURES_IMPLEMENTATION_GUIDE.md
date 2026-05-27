# Talenta-TZ v2 - Enhanced Features Documentation

**Version:** 2.0  
**Last Updated:** May 27, 2026  
**Status:** Implementation Guide

---

## 📋 Overview

This document outlines the new features and improvements added to the Talenta-TZ platform. All features are designed to maintain existing functionality while adding powerful new capabilities for verification, talent discovery, and trust & safety.

---

## 🎯 New Features Implementation Guide

### 1. Institution Verification System

#### Components
- `src/components/institution-verification-admin.tsx` - Admin interface for institutions
- `src/components/verification-badge.tsx` - Verification badges and status indicators

#### Types
```typescript
// src/lib/enhanced-types.ts
- Institution
- StudentVerificationRequest
- UserBadge
- VerificationStatus
```

#### Functions
```typescript
// src/lib/supabase-enhanced.ts
- createInstitution()
- getInstitution()
- updateInstitution()
- requestStudentVerification()
- getVerificationRequests()
- approveVerification()
- rejectVerification()
- awardBadge()
- getUserBadges()
```

#### How to Use

**Student requesting verification:**
```typescript
import { requestStudentVerification } from "@/lib/supabase-enhanced";

const request = await requestStudentVerification(userId, institutionId, {
  student_name: "John Doe",
  student_email: "john@example.com",
  enrollment_number: "STU2024001",
  graduation_date: "2025-06-30",
  status: "pending",
  document_url: "https://...",
  institution_name: "University of Dar es Salaam",
  notes: ""
});
```

**Institution admin approving verification:**
```typescript
import { approveVerification } from "@/lib/supabase-enhanced";

const approved = await approveVerification(requestId, adminId);
// Automatically awards "verified_student" badge
```

**Display badges on profile:**
```typescript
import { VerificationBadge } from "@/components/verification-badge";

<VerificationBadge 
  badges={userBadges}
  verificationStatus="verified"
  size="md"
  showLabel={true}
/>
```

---

### 2. Enhanced User Profiles

#### New Profile Sections

The following data models are added to user profiles:

```typescript
interface EnhancedUserProfile {
  // Existing fields...
  
  // Enhanced sections
  skills: Skill[];
  experience: Experience[];
  education: Education[];
  certifications: Certificate[];
  social_links: SocialLink[];
  
  // Verification
  verification_status: VerificationStatus;
  verification_requests: StudentVerificationRequest[];
  badges: UserBadge[];
}
```

#### Skill Management
```typescript
interface Skill {
  id: string;
  name: string;
  proficiency_level: "beginner" | "intermediate" | "advanced" | "expert";
  years_of_experience?: number;
  endorsed_count?: number;
}
```

#### Integration with Existing Profile Page
Add these sections to `/src/routes/dashboard.tsx` or create a new enhanced profile view:

```typescript
import { TalentShowcase } from "@/components/talent-showcase";

export function EnhancedProfilePage() {
  return (
    <div className="space-y-8">
      {/* Existing sections */}
      
      {/* New sections */}
      <SkillsSection userId={userId} />
      <ExperienceSection userId={userId} />
      <EducationSection userId={userId} />
      <CertificatesSection userId={userId} />
      <TalentShowcase userId={userId} isEditable={true} />
      <SocialLinksSection userId={userId} />
    </div>
  );
}
```

---

### 3. Recruiter Search Filters

#### Component
`src/components/recruiter-talent-search.tsx`

#### Usage
```typescript
import { RecruiterTalentSearch } from "@/components/recruiter-talent-search";

export function TalentSearchPage() {
  return (
    <RecruiterTalentSearch 
      onTalentSelect={(talentId) => {
        // Handle talent selection
        navigate({ to: `/profile/${talentId}` });
      }}
    />
  );
}
```

#### Available Filters
- ✅ Verified users only
- ✅ Open to work status
- ✅ Skills (React, Node.js, Python, etc.)
- ✅ University/Institution
- ✅ Location
- ✅ Experience level (through search)

#### Search Function
```typescript
import { searchTalent } from "@/lib/supabase-enhanced";

const { results, total } = await searchTalent(
  {
    verification_status: "verified",
    skills: ["React", "Node.js"],
    locations: ["Dar es Salaam"],
    open_to_work: true,
  },
  limit,
  offset
);
```

---

### 4. Talent Showcase

#### Component
`src/components/talent-showcase.tsx`

#### Features
- 📸 Upload project images, videos, and documents
- 🏆 Showcase achievements and awards
- 👁️ View tracking and analytics
- ⭐ Featured showcase items
- 🔒 Privacy controls (Public, Private, Recruiters Only)
- 🏷️ Tagging and categorization

#### Usage
```typescript
import { TalentShowcase } from "@/components/talent-showcase";

// In user profile
<TalentShowcase 
  userId={userId}
  isEditable={currentUserId === userId}
  showFeaturedOnly={false}
/>

// Recruiter viewing featured items
<TalentShowcase 
  userId={userId}
  showFeaturedOnly={true}
/>
```

#### Functions
```typescript
// Create showcase item
const item = await createShowcaseItem(userId, {
  title: "E-commerce Platform",
  description: "Built with React and Node.js",
  type: "project",
  media_url: "https://...",
  media_type: "image",
  visibility: "public",
  tags: ["React", "E-commerce"],
  featured: true,
});

// Get showcase
const items = await getUserShowcase(userId, "public");

// Get featured items
const featured = await getFeaturedShowcaseItems(userId, 3);

// Track views
await updateShowcaseViews(showcaseId);
```

---

### 5. Universal Search

#### Component
`src/components/universal-search.tsx`

#### Features
- 🔍 Search across all entity types
- ⚡ Debounced queries
- 📱 Mobile-friendly dropdown
- 🎯 Entity-specific filtering
- ⌨️ Keyboard navigation support

#### Usage
```typescript
import { UniversalSearch, UniversalSearchBar } from "@/components/universal-search";

// Full search interface
<UniversalSearch 
  placeholder="Search jobs, people, companies..."
  showFilters={true}
  onNavigate={(result) => {
    navigate({ to: getResultPath(result) });
  }}
/>

// Compact bar for navigation
<UniversalSearchBar />
```

#### Searchable Entities
- `job` - Job listings
- `job_seeker` - Individual talent
- `employee` - Employees at companies
- `employer` - Employer profiles
- `company` - Company profiles
- `institution` - Educational institutions

#### Function
```typescript
const results = await universalSearch(query, limit);
// Returns: UniversalSearchResult[]
```

---

### 6. Trust & Safety Features

#### Components
- `src/components/report-abuse.tsx` - Report dialog and buttons
- `src/components/verification-badge.tsx` - Trust indicators

#### Report Types
- 🚫 Fake Profile
- 🚫 Fake/Scam Job
- 🚷 Harassment
- 🚷 Inappropriate Content
- 🚷 Scam

#### Usage
```typescript
import { ReportAbuse, CompactReportButton } from "@/components/report-abuse";

// Full report dialog
<ReportAbuse 
  reportedUserId={userId}
  reportedJobId={jobId}
/>

// Compact button for lists
<CompactReportButton reportedUserId={userId} />
```

#### Functions
```typescript
// Submit report
const report = await reportContent({
  reported_by: currentUserId,
  reported_user_id: userId,
  reported_job_id: jobId,
  report_type: "fake_profile",
  description: "This profile is fake",
  evidence_urls: ["https://..."],
});

// Get user safety metrics
const metrics = await getUserSafetyMetrics(userId);
// Returns: SafetyMetrics with trust_score, verification_status, etc.
```

---

## 🛠️ Database Schema Requirements

The following tables need to be created in Supabase:

### institutions
```sql
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  website TEXT,
  logo_url TEXT,
  location TEXT,
  established_year INTEGER,
  verified BOOLEAN DEFAULT false,
  admin_id UUID REFERENCES auth.users,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### student_verification_requests
```sql
CREATE TABLE student_verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES auth.users,
  institution_id UUID REFERENCES institutions,
  student_name TEXT,
  student_email TEXT,
  enrollment_number TEXT,
  graduation_date TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  document_url TEXT,
  notes TEXT,
  requested_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES auth.users
);
```

### user_badges
```sql
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users,
  badge_type VARCHAR(50) NOT NULL,
  issued_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  issued_by UUID REFERENCES auth.users,
  metadata JSONB
);
```

### talent_showcases
```sql
CREATE TABLE talent_showcases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users,
  title TEXT NOT NULL,
  description TEXT,
  type VARCHAR(20), -- project, achievement, work_sample, award
  media_url TEXT,
  media_type VARCHAR(20), -- image, video, document
  thumbnail_url TEXT,
  tags TEXT[],
  visibility VARCHAR(20) DEFAULT 'public',
  featured BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### reports
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reported_by UUID REFERENCES auth.users,
  reported_user_id UUID REFERENCES auth.users,
  reported_job_id UUID REFERENCES jobs,
  report_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  evidence_urls TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES auth.users,
  action_taken TEXT
);
```

### safety_metrics
```sql
CREATE TABLE safety_metrics (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  trust_score INTEGER DEFAULT 50,
  verified_email BOOLEAN DEFAULT false,
  verified_phone BOOLEAN DEFAULT false,
  verified_institution BOOLEAN DEFAULT false,
  reports_count INTEGER DEFAULT 0,
  positive_interactions INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);
```

---

## 📱 Mobile UX Improvements

### Already Included Components
All new components are built with mobile responsiveness:

- 📱 **Responsive Grid Layouts** - Adapts from 1 to 3 columns
- 📱 **Touch-Friendly Buttons** - Min 44px height for mobile
- 📱 **Optimized Dialogs** - Full width on mobile
- 📱 **Scrollable Lists** - Horizontal scrolling for showcase items
- 📱 **Bottom Navigation Support** - Integrates with existing nav

### Performance Optimizations
- ⚡ **Lazy Loading** - Images loaded on demand
- ⚡ **Image Optimization** - Thumbnail_url for gallery previews
- ⚡ **Query Optimization** - Limited results per page
- ⚡ **Debounced Search** - Reduces API calls (default 300ms)

---

## 🔄 Integration with Existing Routes

### Landing Page (`src/routes/index.tsx`)
Add universal search to hero section:
```typescript
import { UniversalSearchBar } from "@/components/universal-search";

<UniversalSearchBar />
```

### Navigation (`src/components/site-chrome.tsx`)
Add search bar to header:
```typescript
<UniversalSearchBar />
```

### Dashboard (`src/routes/dashboard.tsx`)
Add talent showcase:
```typescript
import { TalentShowcase } from "@/components/talent-showcase";

<TalentShowcase userId={userId} isEditable={true} />
```

### Admin Page (`src/routes/admin.tsx`)
Add institution verification admin:
```typescript
import { InstitutionVerificationAdmin } from "@/components/institution-verification-admin";

<InstitutionVerificationAdmin 
  institutionId={institutionId}
  adminId={adminId}
/>
```

### Job Detail (`src/routes/job.$id.tsx`)
Add report button:
```typescript
import { ReportAbuse } from "@/components/report-abuse";

<ReportAbuse reportedJobId={jobId} />
```

---

## 🎨 Design Consistency

All new components follow the existing design system:
- ✅ Shadcn/ui components
- ✅ Tailwind CSS styling
- ✅ Consistent color palette
- ✅ Icon system (Lucide icons)
- ✅ Toast notifications (Sonner)
- ✅ Dialog patterns

---

## 🧪 Testing Checklist

- [ ] Create test institution account
- [ ] Request student verification
- [ ] Approve/reject verification as admin
- [ ] Verify badges appear on profile
- [ ] Add showcase items
- [ ] Search across entities
- [ ] Test recruiter filters
- [ ] Submit abuse report
- [ ] Test on mobile devices
- [ ] Verify performance metrics

---

## 📊 Analytics & Metrics

Track the following metrics:

```typescript
interface UserStatistics {
  profile_views: number;
  job_applications: number;
  jobs_saved: number;
  jobs_posted?: number;
  profile_completeness: number;
  portfolio_items_count: number;
  last_profile_update: string;
}
```

---

## 🚀 Deployment Checklist

- [ ] Database migrations created
- [ ] Tables created in Supabase
- [ ] RLS policies configured
- [ ] Environment variables updated
- [ ] Components imported in routes
- [ ] Types exported correctly
- [ ] Search indexes created
- [ ] Tests passing
- [ ] Mobile responsiveness verified
- [ ] Performance optimized

---

## 📝 File Structure

New files added:
```
src/
├── lib/
│   ├── enhanced-types.ts          (New type definitions)
│   └── supabase-enhanced.ts       (New data functions)
├── components/
│   ├── verification-badge.tsx     (Badges & status)
│   ├── institution-verification-admin.tsx
│   ├── talent-showcase.tsx        (Portfolio)
│   ├── universal-search.tsx       (Global search)
│   ├── recruiter-talent-search.tsx (Talent discovery)
│   └── report-abuse.tsx           (Trust & safety)
```

---

## 🎯 Next Steps

1. **Create Supabase tables** using schema above
2. **Update routes** to include new components
3. **Test each feature** in development
4. **Gather user feedback** on new UX
5. **Optimize based on analytics** data
6. **Deploy to production** with full testing

---

## 📞 Support & Questions

For implementation questions or issues:
1. Check component documentation in source files
2. Review type definitions in `enhanced-types.ts`
3. Test with sample data
4. Check Supabase documentation for database setup

---

**Documentation Complete** ✅  
**Ready for Implementation** 🚀
