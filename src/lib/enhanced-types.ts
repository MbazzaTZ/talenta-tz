/**
 * Enhanced Types & Data Models for Talenta-TZ v2
 * Includes institution verification, talent showcase, and advanced profiles
 */

export type UserRole = "job_seeker" | "employer" | "institution" | "recruiter" | "admin";

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
