# Recruitment Agency Feature Documentation

**Version:** 3.0  
**Date:** May 27, 2026  
**Status:** Production Ready

---

## 📋 Overview

The Recruitment Agency feature allows HR recruitment firms and staffing agencies to manage their operations on behalf of employers. Agencies can create projects, manage team members, track candidates, and monitor placement success metrics.

---

## 🎯 Key Features

### 1. Agency Profiles
- **Full Agency Information** - Name, location, website, specialization
- **Verification Badges** - Verified Agency badge with verification status
- **Team & Project Metrics** - Dashboard showing performance statistics
- **Subscription Tiers** - Free, Basic, Professional, Enterprise plans
- **Agency Settings** - Branding, commission rates, payment terms

### 2. Project Management
- **Create & Manage Projects** - Create recruitment projects on behalf of clients
- **Target Positions** - Define multiple positions, skills, and requirements
- **Timeline & Budget** - Set project timelines and budgets
- **Project Status Tracking** - Draft → Active → Completed → Archived
- **Position Tracking** - Monitor how many positions filled vs. target

### 3. Staff Management
- **Team Hierarchy** - Recruiter, Manager, Lead, Director roles
- **Staff Profiles** - Name, specialization, contact information
- **Performance Metrics** - Track placements, success rates
- **Project Assignment** - Assign staff to specific recruitment projects
- **Availability** - Manage active/inactive team members

### 4. Candidate Management
- **Candidate Submission** - Submit candidates for projects
- **Status Tracking** - Submitted → Shortlisted → Interviewed → Offered → Placed
- **Candidate Notes** - Add feedback and assessment notes
- **Salary Expectations** - Track candidate salary requirements
- **Placement Tracking** - Record when candidate is placed

### 5. Analytics & Reporting
- **Project Metrics** - Conversion rates, success rates, average placement time
- **Team Performance** - Per-recruiter statistics and rankings
- **Agency Reports** - Monthly, quarterly, yearly, or project reports
- **Client Relationships** - Track placements and revenue per client
- **KPI Dashboard** - Real-time performance indicators

### 6. Billing & Invoicing
- **Invoice Generation** - Create invoices for clients
- **Payment Tracking** - Monitor paid, pending, overdue invoices
- **Line Items** - Detailed breakdown of services and fees
- **Commission Tracking** - Calculate commissions based on placements

---

## 🛠️ Types & Interfaces

### RecruitmentAgency
```typescript
interface RecruitmentAgency {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  location?: string;
  country?: string;
  founded_year?: number;
  specialization?: string[];
  description?: string;
  company_size?: "1-10" | "11-50" | "51-200" | "200+";
  verified: boolean;
  admin_id: string;
  max_projects?: number;
  max_staff?: number;
  subscription_tier?: "free" | "basic" | "professional" | "enterprise";
  created_at: string;
  updated_at: string;
}
```

### RecruitmentProject
```typescript
interface RecruitmentProject {
  id: string;
  agency_id: string;
  client_id?: string;
  project_name: string;
  description?: string;
  industry?: string;
  target_positions?: string[];
  target_count?: number;
  required_skills?: string[];
  budget?: number;
  timeline?: {
    start_date: string;
    end_date?: string;
    urgency?: "low" | "medium" | "high" | "urgent";
  };
  status: "draft" | "active" | "onhold" | "completed" | "archived";
  positions_filled?: number;
  created_at: string;
  updated_at: string;
}
```

### RecruitmentAgencyStaff
```typescript
interface RecruitmentAgencyStaff {
  id: string;
  agency_id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  role: "recruiter" | "manager" | "lead" | "director";
  specialization?: string[];
  bio?: string;
  avatar_url?: string;
  assigned_projects?: string[];
  candidates_placed?: number;
  success_rate?: number;
  is_active: boolean;
  joined_at: string;
  last_active?: string;
}
```

### AgencyCandidate
```typescript
interface AgencyCandidate {
  id: string;
  agency_id: string;
  project_id?: string;
  candidate_id: string;
  candidate_name?: string;
  candidate_email?: string;
  candidate_phone?: string;
  submitted_by_staff_id: string;
  status: "submitted" | "shortlisted" | "interviewed" | "offered" | "rejected" | "placed";
  notes?: string;
  rating?: number;
  salary_expectation?: number;
  placement_date?: string;
  submitted_at: string;
  updated_at: string;
}
```

---

## 📚 Components

### RecruitmentAgencyProfile
Displays agency information, metrics, and services.

```typescript
import { RecruitmentAgencyProfile } from "@/components/recruitment-agency-profile";

<RecruitmentAgencyProfile 
  agencyId={agencyId}
  isEditable={isAdmin}
  onEdit={handleEdit}
/>
```

**Props:**
- `agencyId` (string) - Agency ID to display
- `isEditable` (boolean) - Show edit button
- `onEdit` (function) - Callback when edit clicked

### AgencyProjectsManager
Manage recruitment projects for clients.

```typescript
import { AgencyProjectsManager } from "@/components/agency-projects-manager";

<AgencyProjectsManager agencyId={agencyId} />
```

**Features:**
- Create, edit, delete projects
- View project candidates
- Track position filling progress
- Set project timelines and budgets

### AgencyStaffManager
Manage recruitment team members.

```typescript
import { AgencyStaffManager } from "@/components/agency-staff-manager";

<AgencyStaffManager agencyId={agencyId} isAdmin={true} />
```

**Features:**
- Add/remove team members
- Track recruiter performance
- Manage specializations
- Monitor placement statistics

---

## 🔧 Data Functions

All functions are in `src/lib/supabase-agency.ts`:

### Agency Management
```typescript
createRecruitmentAgency(agency)
getRecruitmentAgency(agencyId)
updateRecruitmentAgency(agencyId, updates)
getAgenciesByAdmin(adminId)
```

### Project Management
```typescript
createProject(agencyId, project)
getAgencyProjects(agencyId, status?)
getProject(projectId)
updateProject(projectId, updates)
```

### Staff Management
```typescript
addAgencyStaff(agencyId, staff)
getAgencyStaff(agencyId)
getStaffMember(staffId)
updateStaffMember(staffId, updates)
removeStaffMember(staffId)
```

### Candidate Management
```typescript
submitCandidate(agencyId, candidate)
getProjectCandidates(projectId)
updateCandidateStatus(candidateId, status, notes?)
```

### Analytics
```typescript
getProjectMetrics(projectId)
calculateProjectMetrics(projectId)
generateAgencyReport(agencyId, reportType, periodStart, periodEnd)
```

### Billing
```typescript
createInvoice(agencyId, invoice)
getAgencyInvoices(agencyId)
```

### Client Management
```typescript
getAgencyClients(agencyId)
addAgencyClient(agencyId, client)
```

---

## 🗄️ Database Schema

### recruitment_agencies
```sql
CREATE TABLE recruitment_agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  website TEXT,
  logo_url TEXT,
  location TEXT,
  country TEXT,
  founded_year INTEGER,
  specialization TEXT[],
  description TEXT,
  company_size VARCHAR(20),
  verified BOOLEAN DEFAULT false,
  admin_id UUID REFERENCES auth.users,
  max_projects INTEGER DEFAULT 10,
  max_staff INTEGER DEFAULT 50,
  subscription_tier VARCHAR(20) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### recruitment_projects
```sql
CREATE TABLE recruitment_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES recruitment_agencies,
  client_id UUID REFERENCES auth.users,
  project_name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  target_positions TEXT[],
  target_count INTEGER,
  required_skills TEXT[],
  budget DECIMAL,
  timeline JSONB,
  status VARCHAR(20) DEFAULT 'draft',
  positions_filled INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### recruitment_agency_staff
```sql
CREATE TABLE recruitment_agency_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES recruitment_agencies,
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role VARCHAR(20) NOT NULL,
  specialization TEXT[],
  bio TEXT,
  avatar_url TEXT,
  assigned_projects TEXT[],
  candidates_placed INTEGER DEFAULT 0,
  success_rate DECIMAL,
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP
);
```

### agency_candidates
```sql
CREATE TABLE agency_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES recruitment_agencies,
  project_id UUID REFERENCES recruitment_projects,
  candidate_id UUID REFERENCES auth.users,
  candidate_name TEXT,
  candidate_email TEXT,
  candidate_phone TEXT,
  submitted_by_staff_id UUID REFERENCES recruitment_agency_staff,
  status VARCHAR(20) DEFAULT 'submitted',
  notes TEXT,
  rating DECIMAL,
  salary_expectation DECIMAL,
  placement_date TIMESTAMP,
  submitted_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### agency_project_metrics
```sql
CREATE TABLE agency_project_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES recruitment_projects UNIQUE,
  agency_id UUID REFERENCES recruitment_agencies,
  total_candidates_submitted INTEGER DEFAULT 0,
  candidates_shortlisted INTEGER DEFAULT 0,
  candidates_interviewed INTEGER DEFAULT 0,
  candidates_offered INTEGER DEFAULT 0,
  candidates_placed INTEGER DEFAULT 0,
  conversion_rate DECIMAL,
  average_placement_time_days INTEGER,
  success_rate DECIMAL,
  last_updated TIMESTAMP DEFAULT NOW()
);
```

### agency_invoices
```sql
CREATE TABLE agency_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES recruitment_agencies,
  project_id UUID REFERENCES recruitment_projects,
  invoice_number TEXT UNIQUE,
  client_id UUID REFERENCES auth.users,
  amount DECIMAL NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'draft',
  issue_date DATE,
  due_date DATE,
  payment_date DATE,
  description TEXT,
  line_items JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### agency_client_relationships
```sql
CREATE TABLE agency_client_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES recruitment_agencies,
  client_id UUID REFERENCES auth.users,
  client_name TEXT,
  relationship_status VARCHAR(20) DEFAULT 'active',
  projects_count INTEGER DEFAULT 0,
  total_placements INTEGER DEFAULT 0,
  total_revenue DECIMAL,
  contract_start_date DATE,
  contract_end_date DATE,
  primary_contact_id UUID REFERENCES recruitment_agency_staff,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### agency_reports
```sql
CREATE TABLE agency_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES recruitment_agencies,
  report_type VARCHAR(20) NOT NULL,
  period_start DATE,
  period_end DATE,
  total_placements INTEGER,
  total_revenue DECIMAL,
  total_projects INTEGER,
  active_projects INTEGER,
  team_size INTEGER,
  success_rate DECIMAL,
  top_performing_staff TEXT[],
  generated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📱 Integration Examples

### Adding Recruitment Agency to Dashboard
```typescript
// src/routes/dashboard.tsx
import { RecruitmentAgencyProfile } from "@/components/recruitment-agency-profile";
import { AgencyProjectsManager } from "@/components/agency-projects-manager";
import { AgencyStaffManager } from "@/components/agency-staff-manager";

export function AgencyDashboard() {
  const agencyId = useParams({ from: "/agency/$agencyId" }).agencyId;

  return (
    <div className="space-y-8">
      <RecruitmentAgencyProfile agencyId={agencyId} isEditable={true} />
      <AgencyProjectsManager agencyId={agencyId} />
      <AgencyStaffManager agencyId={agencyId} isAdmin={true} />
    </div>
  );
}
```

### Creating Agency from Employer Profile
```typescript
const agency = await createRecruitmentAgency({
  name: "Elite Recruitment",
  email: "contact@elite-recruitment.com",
  location: "New York, NY",
  admin_id: userId,
  subscription_tier: "professional",
  verified: false,
});
```

### Submitting Candidates for Project
```typescript
const candidate = await submitCandidate(agencyId, {
  project_id: projectId,
  candidate_id: candidateId,
  candidate_name: "John Doe",
  candidate_email: "john@example.com",
  submitted_by_staff_id: staffId,
  status: "submitted",
  salary_expectation: 80000,
});
```

---

## 🎨 Design Patterns

### Role-Based Access Control
- **Agency Admin** - Full access to agency settings, staff, projects
- **Manager** - Manage projects and team assignments
- **Lead Recruiter** - Submit candidates, manage assigned projects
- **Recruiter** - Submit candidates, update candidate status

### Project Workflow
1. **Draft** - Create and configure project
2. **Active** - Start recruiting, submit candidates
3. **On Hold** - Pause project temporarily
4. **Completed** - All positions filled or project ended
5. **Archived** - Archive old projects

### Candidate Pipeline
1. **Submitted** - Initial candidate submission
2. **Shortlisted** - Candidate qualifies
3. **Interviewed** - Candidate interviewed by client
4. **Offered** - Job offer extended
5. **Placed** - Candidate accepted and started
6. **Rejected** - Not moving forward

---

## 📊 Key Metrics

### Agency Metrics
- Total Projects
- Active Projects
- Total Placements
- Average Success Rate
- Team Size
- Monthly/Yearly Revenue

### Project Metrics
- Total Candidates Submitted
- Candidates Shortlisted
- Candidates Interviewed
- Conversion Rate
- Success Rate
- Average Placement Time

### Team Metrics
- Candidates Placed
- Success Rate
- Active Projects
- Response Time
- Quality Score

---

## ✅ Testing Checklist

- [ ] Create recruitment agency
- [ ] Edit agency profile
- [ ] Create recruitment project
- [ ] Add team member
- [ ] Assign staff to project
- [ ] Submit candidate for project
- [ ] Update candidate status
- [ ] View project metrics
- [ ] Generate agency report
- [ ] Create invoice
- [ ] Test on mobile

---

## 🚀 Deployment Checklist

- [ ] Create all database tables (copy SQL from schema)
- [ ] Set up RLS policies for agencies
- [ ] Configure subscription tier permissions
- [ ] Set up invoice numbering system
- [ ] Deploy components to production
- [ ] Test all workflows
- [ ] Monitor performance metrics

---

## 📖 Quick Reference

**Create an Agency:**
```typescript
const agency = await createRecruitmentAgency({
  name: "Agency Name",
  email: "contact@agency.com",
  admin_id: userId,
});
```

**Create a Project:**
```typescript
const project = await createProject(agencyId, {
  project_name: "Senior Engineers",
  target_count: 5,
  required_skills: ["React", "Node.js"],
});
```

**Add Staff:**
```typescript
const staff = await addAgencyStaff(agencyId, {
  user_id: userId,
  name: "John Recruiter",
  email: "john@agency.com",
  role: "recruiter",
});
```

**Submit Candidate:**
```typescript
const candidate = await submitCandidate(agencyId, {
  project_id: projectId,
  candidate_id: candidateId,
  submitted_by_staff_id: staffId,
  status: "submitted",
});
```

---

**Documentation Complete** ✅  
**Ready for Production** 🚀
