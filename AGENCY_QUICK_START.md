# Recruitment Agency - Quick Start Guide

**Get started with the new Recruitment Agency role in 5 minutes.**

---

## ⚡ 5-Minute Setup

### Step 1: Create Database Tables (2 minutes)

Copy this SQL and paste into **Supabase SQL Editor**:

```sql
-- Copy the full SQL schema from RECRUITMENT_AGENCY_GUIDE.md
-- Tables: recruitment_agencies, recruitment_projects, recruitment_agency_staff,
--         agency_candidates, agency_project_metrics, agency_invoices,
--         agency_reports, agency_client_relationships
```

See `RECRUITMENT_AGENCY_GUIDE.md` for complete SQL.

### Step 2: Add Components (2 minutes)

```typescript
// src/routes/agency/dashboard.tsx
import { RecruitmentAgencyProfile } from "@/components/recruitment-agency-profile";
import { AgencyProjectsManager } from "@/components/agency-projects-manager";
import { AgencyStaffManager } from "@/components/agency-staff-manager";

export function AgencyDashboard() {
  const agencyId = useParams({ from: "/agency/$agencyId" }).agencyId;
  
  return (
    <div className="space-y-8">
      <RecruitmentAgencyProfile 
        agencyId={agencyId} 
        isEditable={true} 
      />
      <AgencyProjectsManager agencyId={agencyId} />
      <AgencyStaffManager agencyId={agencyId} isAdmin={true} />
    </div>
  );
}
```

### Step 3: Create Your First Agency (1 minute)

```typescript
import { createRecruitmentAgency } from "@/lib/supabase-agency";

const agency = await createRecruitmentAgency({
  name: "My Recruitment Agency",
  email: "contact@myagency.com",
  location: "New York, NY",
  admin_id: currentUserId,
  subscription_tier: "professional",
  verified: false,
});
```

---

## 🎯 Key Components

### 1. RecruitmentAgencyProfile
**Display agency information and metrics.**

```typescript
<RecruitmentAgencyProfile 
  agencyId={agencyId}
  isEditable={isAdmin}
  onEdit={() => navigate("/edit-agency")}
/>
```

Shows:
- Agency name, logo, contact info
- Verification badge
- Key metrics (projects, team, placements)
- Services and specializations

### 2. AgencyProjectsManager
**Create and manage recruitment projects.**

```typescript
<AgencyProjectsManager agencyId={agencyId} />
```

Features:
- Create projects with target positions
- Define required skills
- Set timeline and budget
- View candidates submitted
- Track position filling

### 3. AgencyStaffManager
**Manage recruitment team.**

```typescript
<AgencyStaffManager agencyId={agencyId} isAdmin={true} />
```

Features:
- Add team members
- Manage roles (recruiter, manager, lead, director)
- Track performance metrics
- Assign to projects

---

## 📚 Common Operations

### Create a Project
```typescript
import { createProject } from "@/lib/supabase-agency";

const project = await createProject(agencyId, {
  project_name: "Senior Engineers - Tech Startup",
  description: "Looking for experienced React developers",
  target_positions: ["Senior Frontend Engineer", "Tech Lead"],
  target_count: 3,
  required_skills: ["React", "TypeScript", "Node.js"],
  budget: 50000,
  timeline: {
    start_date: "2025-06-01",
    urgency: "high",
  },
  status: "draft",
});
```

### Add Team Member
```typescript
import { addAgencyStaff } from "@/lib/supabase-agency";

const staff = await addAgencyStaff(agencyId, {
  user_id: "user-id-here",
  name: "John Recruiter",
  email: "john@agency.com",
  role: "recruiter",
  specialization: ["Tech", "Finance"],
  bio: "10+ years recruitment experience",
  is_active: true,
});
```

### Submit Candidate
```typescript
import { submitCandidate } from "@/lib/supabase-agency";

const candidate = await submitCandidate(agencyId, {
  project_id: projectId,
  candidate_id: candidateId,
  candidate_name: "Jane Smith",
  candidate_email: "jane@example.com",
  submitted_by_staff_id: recruiterStaffId,
  status: "submitted",
  rating: 4.5,
  salary_expectation: 120000,
});
```

### Update Candidate Status
```typescript
import { updateCandidateStatus } from "@/lib/supabase-agency";

// Move through pipeline: submitted → shortlisted → interviewed → offered → placed
await updateCandidateStatus(candidateId, "placed", "Offer accepted, starts July 1st");
```

### Get Project Metrics
```typescript
import { calculateProjectMetrics } from "@/lib/supabase-agency";

const metrics = await calculateProjectMetrics(projectId);
// Returns: {
//   total_candidates_submitted: 15,
//   candidates_shortlisted: 8,
//   candidates_interviewed: 4,
//   candidates_offered: 2,
//   candidates_placed: 1,
//   conversion_rate: 7,
//   success_rate: 7
// }
```

### Generate Report
```typescript
import { generateAgencyReport } from "@/lib/supabase-agency";

const report = await generateAgencyReport(
  agencyId,
  "monthly",
  "2025-06-01",
  "2025-06-30"
);
// Returns agency performance report
```

---

## 🛠️ Data Functions by Category

**Agency Management**
- `createRecruitmentAgency()` - Create agency
- `getRecruitmentAgency()` - Get agency details
- `updateRecruitmentAgency()` - Update info
- `getAgenciesByAdmin()` - Get admin's agencies

**Projects**
- `createProject()` - Create project
- `getAgencyProjects()` - List projects
- `getProject()` - Get project details
- `updateProject()` - Update project

**Staff**
- `addAgencyStaff()` - Add team member
- `getAgencyStaff()` - List team
- `getStaffMember()` - Get staff details
- `updateStaffMember()` - Update staff
- `removeStaffMember()` - Remove from team

**Candidates**
- `submitCandidate()` - Submit candidate
- `getProjectCandidates()` - Get project candidates
- `updateCandidateStatus()` - Move through pipeline

**Analytics**
- `getProjectMetrics()` - Get project stats
- `calculateProjectMetrics()` - Calculate metrics
- `generateAgencyReport()` - Generate report

**Billing**
- `createInvoice()` - Create invoice
- `getAgencyInvoices()` - List invoices

**Clients**
- `getAgencyClients()` - List clients
- `addAgencyClient()` - Add client

---

## 🎨 Component Props Quick Reference

### RecruitmentAgencyProfile
```typescript
interface Props {
  agencyId: string;           // Required
  isEditable?: boolean;       // Show edit button
  onEdit?: () => void;        // Edit callback
}
```

### AgencyProjectsManager
```typescript
interface Props {
  agencyId: string;           // Required
}
```

### AgencyStaffManager
```typescript
interface Props {
  agencyId: string;           // Required
  isAdmin?: boolean;          // Show add/remove buttons
}
```

---

## 📊 Data Flow

```
1. Agency Created
   ↓
2. Projects Created for Clients
   ↓
3. Team Members Added
   ↓
4. Candidates Submitted
   ↓
5. Status Updated (Submitted → Placed)
   ↓
6. Invoices Generated
   ↓
7. Reports Generated
```

---

## ✅ Testing the Feature

1. **Create Agency**
   - Create new agency with test data
   - Verify profile appears

2. **Create Project**
   - Add project with positions and skills
   - Verify project appears in list

3. **Add Team Member**
   - Add recruiter to agency
   - Verify staff appears in team

4. **Submit Candidate**
   - Submit candidate for project
   - Verify candidate appears in project

5. **Update Status**
   - Move candidate through pipeline
   - Verify metrics update

6. **Generate Report**
   - Create report for agency
   - Verify metrics calculated

---

## 🚀 Integration Timeline

| Step | Time | Task |
|------|------|------|
| 1 | 5 min | Create database tables |
| 2 | 5 min | Add components to route |
| 3 | 5 min | Create test agency |
| 4 | 10 min | Test all workflows |
| 5 | 5 min | Deploy |

**Total: ~30 minutes**

---

## 📖 Full Documentation

For complete information:
→ See `RECRUITMENT_AGENCY_GUIDE.md`

Topics covered:
- Complete feature overview
- Type definitions
- Database schema
- All data functions
- Component details
- Integration examples
- Testing checklist
- Deployment guide

---

## 🎯 Next Steps

1. ✅ Create database tables
2. ✅ Add components to your routes
3. ✅ Test the workflow
4. ✅ Customize as needed
5. ✅ Deploy to production

---

**Ready to go!** 🚀

The Recruitment Agency feature is production-ready and fully documented.
Start with the 5-minute setup above, then refer to RECRUITMENT_AGENCY_GUIDE.md for details.
