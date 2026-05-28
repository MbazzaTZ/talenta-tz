/**
 * Enhanced Types & Data Models for Talenta-TZ v2
 * Includes institution verification, talent showcase, and advanced profiles
 */

export type UserRole = "job_seeker" | "employer" | "institution" | "recruiter" | "recruitment_agency" | "admin";

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export type BadgeType = "verified_student" | "verified_graduate" | "verified_recruiter" | "verified_institution";

// ─── Institution & Verification ───────────────────────────────────────────

export interface Institution {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  location?: string;
  established_year?: number;
  verified: boolean;
  admin_id: string;
  created_at: string;
  updated_at: string;
}

export interface StudentVerificationRequest {
  id: string;
  student_id: string;
  institution_id: string;
  student_name?: string;
  student_email?: string;
  institution_name?: string;
  enrollment_number?: string;
  graduation_date?: string;
  status: VerificationStatus;
  document_url?: string;
  notes?: string;
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_type: BadgeType;
  issued_at: string;
  expires_at?: string;
  issued_by?: string;
  metadata?: Record<string, unknown>;
}

// ─── Enhanced User Profile ────────────────────────────────────────────────

export interface EnhancedUserProfile {
  id: string;
  full_name: string | null;
  email: string;
  role: UserRole;
  avatar_url?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  phone?: string | null;

  // Enhanced sections
  skills: Skill[];
  experience: Experience[];
  education: Education[];
  certifications: Certificate[];
  social_links: SocialLink[];

  // Files & Portfolio
  resume_url?: string | null;
  portfolio_url?: string | null;

  // Verification
  verification_status: VerificationStatus;
  verification_requests: StudentVerificationRequest[];
  badges: UserBadge[];

  // Activity
  is_open_to_work?: boolean;
  last_active?: string;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  name: string;
  proficiency_level?: "beginner" | "intermediate" | "advanced" | "expert";
  years_of_experience?: number;
  endorsed_count?: number;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
  company_logo_url?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date?: string;
  grade?: string;
  description?: string;
  institution_logo_url?: string;
}

export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
  certificate_url?: string;
}

export interface SocialLink {
  id: string;
  platform: "linkedin" | "github" | "twitter" | "portfolio" | "other";
  url: string;
  display_name?: string;
}

// ─── Talent Showcase ──────────────────────────────────────────────────────

export interface TalentShowcase {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  type: "project" | "achievement" | "work_sample" | "award";
  media_url?: string;
  media_type?: "image" | "video" | "document" | "link";
  thumbnail_url?: string;
  tags?: string[];
  visibility: "public" | "private" | "recruiters_only";
  featured: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectMedia {
  id: string;
  showcase_id: string;
  url: string;
  type: "image" | "video" | "document";
  order: number;
  metadata?: Record<string, unknown>;
}

// ─── Recruiter Search ────────────────────────────────────────────────────

export interface TalentSearchFilter {
  verification_status?: VerificationStatus;
  user_types?: ("student" | "graduate" | "working_professional")[];
  skills?: string[];
  universities?: string[];
  locations?: string[];
  experience_years?: {
    min?: number;
    max?: number;
  };
  open_to_work?: boolean;
  has_portfolio?: boolean;
}

export interface TalentSearchResult {
  user: EnhancedUserProfile;
  match_score: number;
  badges: UserBadge[];
  featured_showcases: TalentShowcase[];
}

// ─── Trust & Safety ──────────────────────────────────────────────────────

export interface Report {
  id: string;
  reported_by: string;
  reported_user_id?: string;
  reported_job_id?: string;
  report_type: "fake_profile" | "fake_job" | "harassment" | "inappropriate_content" | "scam";
  description: string;
  status: "pending" | "investigating" | "resolved" | "dismissed";
  evidence_urls?: string[];
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  action_taken?: string;
}

export interface SafetyMetrics {
  user_id: string;
  trust_score: number;
  verified_email: boolean;
  verified_phone: boolean;
  verified_institution: boolean;
  reports_count: number;
  positive_interactions: number;
  last_updated: string;
}

// ─── Universal Search ────────────────────────────────────────────────────

export type SearchableEntity = "job" | "job_seeker" | "employee" | "employer" | "company" | "institution";

export interface UniversalSearchResult {
  type: SearchableEntity;
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  verified?: boolean;
  location?: string;
  relevance_score: number;
}

export interface SearchFilters {
  entity_types?: SearchableEntity[];
  location?: string;
  verified_only?: boolean;
  date_range?: {
    start?: string;
    end?: string;
  };
  sort_by?: "relevance" | "recent" | "popular";
}

// ─── Statistics & Analytics ──────────────────────────────────────────────

export interface UserStatistics {
  user_id: string;
  profile_views: number;
  job_applications: number;
  jobs_saved: number;
  jobs_posted?: number;
  profile_completeness: number;
  portfolio_items_count: number;
  last_profile_update: string;
}

// ─── Recruitment Agency ──────────────────────────────────────────────────

export interface RecruitmentAgency {
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

export interface RecruitmentProject {
  id: string;
  agency_id: string;
  client_id?: string; // Employer/Company
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

export interface RecruitmentAgencyStaff {
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

export interface AgencyProjectAssignment {
  id: string;
  project_id: string;
  staff_id: string;
  role: "lead" | "recruiter" | "reviewer";
  assigned_at: string;
  assignment_status: "active" | "completed" | "onhold";
}

export interface AgencyCandidate {
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

export interface AgencyProjectMetrics {
  project_id: string;
  agency_id: string;
  total_candidates_submitted: number;
  candidates_shortlisted: number;
  candidates_interviewed: number;
  candidates_offered: number;
  candidates_placed: number;
  conversion_rate: number;
  average_placement_time_days: number;
  success_rate: number;
  last_updated: string;
}

export interface AgencyInvoice {
  id: string;
  agency_id: string;
  project_id?: string;
  invoice_number: string;
  client_id: string;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  issue_date: string;
  due_date: string;
  payment_date?: string;
  description?: string;
  line_items?: {
    description: string;
    quantity: number;
    unit_price: number;
  }[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AgencySettings {
  agency_id: string;
  branding_color?: string;
  logo_url?: string;
  terms_and_conditions?: string;
  commission_rate?: number;
  payment_terms?: string;
  email_signature?: string;
  notification_email?: string;
  notification_preferences?: {
    new_applications: boolean;
    status_updates: boolean;
    monthly_reports: boolean;
  };
  updated_at: string;
}

export interface AgencyReport {
  id: string;
  agency_id: string;
  report_type: "monthly" | "quarterly" | "yearly" | "project";
  period_start: string;
  period_end: string;
  total_placements: number;
  total_revenue?: number;
  total_projects: number;
  active_projects: number;
  team_size: number;
  success_rate: number;
  top_performing_staff?: string[];
  generated_at: string;
}

export interface AgencyPermission {
  id: string;
  agency_id: string;
  staff_id: string;
  permission: string;
  granted_at: string;
}

export interface AgencyClientRelationship {
  id: string;
  agency_id: string;
  client_id: string;
  client_name?: string;
  relationship_status: "active" | "inactive" | "terminated";
  projects_count: number;
  total_placements: number;
  total_revenue?: number;
  contract_start_date?: string;
  contract_end_date?: string;
  primary_contact_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
