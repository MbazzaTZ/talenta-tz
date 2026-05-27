/**
 * Enhanced Supabase Data Functions
 * Handles institution verification, talent showcase, and advanced searches
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  Institution,
  StudentVerificationRequest,
  UserBadge,
  TalentShowcase,
  Report,
  UniversalSearchResult,
  TalentSearchFilter,
  SafetyMetrics,
} from "./enhanced-types";

// ─── Institution Management ───────────────────────────────────────────────

export async function createInstitution(institution: Omit<Institution, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase
    .from("institutions")
    .insert({
      name: institution.name,
      email: institution.email,
      phone: institution.phone,
      website: institution.website,
      logo_url: institution.logo_url,
      location: institution.location,
      established_year: institution.established_year,
      verified: institution.verified,
      admin_id: institution.admin_id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating institution:", error);
    return null;
  }
  return data as Institution;
}

export async function getInstitution(institutionId: string) {
  const { data, error } = await supabase
    .from("institutions")
    .select("*")
    .eq("id", institutionId)
    .single();

  if (error) {
    console.error("Error fetching institution:", error);
    return null;
  }
  return data as Institution;
}

export async function updateInstitution(institutionId: string, updates: Partial<Institution>) {
  const { data, error } = await supabase
    .from("institutions")
    .update(updates)
    .eq("id", institutionId)
    .select()
    .single();

  if (error) {
    console.error("Error updating institution:", error);
    return null;
  }
  return data as Institution;
}

// ─── Student Verification ────────────────────────────────────────────────

export async function requestStudentVerification(
  studentId: string,
  institutionId: string,
  data: Omit<StudentVerificationRequest, "id" | "requested_at">
) {
  const { data: result, error } = await supabase
    .from("student_verification_requests")
    .insert({
      student_id: studentId,
      institution_id: institutionId,
      student_name: data.student_name,
      student_email: data.student_email,
      institution_name: data.institution_name,
      enrollment_number: data.enrollment_number,
      graduation_date: data.graduation_date,
      status: data.status,
      document_url: data.document_url,
      notes: data.notes,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating verification request:", error);
    return null;
  }
  return result as StudentVerificationRequest;
}

export async function getVerificationRequests(institutionId: string) {
  const { data, error } = await supabase
    .from("student_verification_requests")
    .select("*")
    .eq("institution_id", institutionId)
    .order("requested_at", { ascending: false });

  if (error) {
    console.error("Error fetching verification requests:", error);
    return [];
  }
  return data as StudentVerificationRequest[];
}

export async function approveVerification(requestId: string, reviewedBy: string) {
  const { data, error } = await supabase
    .from("student_verification_requests")
    .update({
      status: "verified",
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy,
    })
    .eq("id", requestId)
    .select()
    .single();

  if (error) {
    console.error("Error approving verification:", error);
    return null;
  }

  // Award badge
  if (data && data.student_id) {
    await awardBadge(data.student_id, "verified_student", reviewedBy, {
      institution_id: data.institution_id,
    });
  }

  return data as StudentVerificationRequest;
}

export async function rejectVerification(requestId: string, reason: string, reviewedBy: string) {
  const { data, error } = await supabase
    .from("student_verification_requests")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy,
      notes: reason,
    })
    .eq("id", requestId)
    .select()
    .single();

  if (error) {
    console.error("Error rejecting verification:", error);
    return null;
  }
  return data as StudentVerificationRequest;
}

// ─── User Badges ──────────────────────────────────────────────────────────

export async function awardBadge(
  userId: string,
  badgeType: string,
  issuedBy: string,
  metadata?: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from("user_badges")
    .insert({
      user_id: userId,
      badge_type: badgeType,
      issued_by: issuedBy,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error("Error awarding badge:", error);
    return null;
  }
  return data as UserBadge;
}

export async function getUserBadges(userId: string) {
  const { data, error } = await supabase
    .from("user_badges")
    .select("*")
    .eq("user_id", userId)
    .order("issued_at", { ascending: false });

  if (error) {
    console.error("Error fetching badges:", error);
    return [];
  }
  return data as UserBadge[];
}

// ─── Talent Showcase ──────────────────────────────────────────────────────

export async function createShowcaseItem(
  userId: string,
  item: Omit<TalentShowcase, "id" | "views_count" | "created_at" | "updated_at">
) {
  const { data, error } = await supabase
    .from("talent_showcases")
    .insert({
      user_id: userId,
      title: item.title,
      description: item.description,
      type: item.type,
      media_url: item.media_url,
      media_type: item.media_type,
      thumbnail_url: item.thumbnail_url,
      tags: item.tags,
      visibility: item.visibility,
      featured: item.featured,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating showcase item:", error);
    return null;
  }
  return data as TalentShowcase;
}

export async function getUserShowcase(userId: string, visibility: "public" | "all" = "public") {
  let query = supabase.from("talent_showcases").select("*").eq("user_id", userId);

  if (visibility === "public") {
    query = query.eq("visibility", "public");
  }

  const { data, error } = await query.order("featured", { ascending: false }).order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching showcase:", error);
    return [];
  }
  return data as TalentShowcase[];
}

export async function getFeaturedShowcaseItems(userId: string, limit = 3) {
  const { data, error } = await supabase
    .from("talent_showcases")
    .select("*")
    .eq("user_id", userId)
    .eq("featured", true)
    .eq("visibility", "public")
    .limit(limit);

  if (error) {
    console.error("Error fetching featured items:", error);
    return [];
  }
  return data as TalentShowcase[];
}

export async function updateShowcaseViews(showcaseId: string) {
  const { error } = await supabase
    .from("talent_showcases")
    .update({ views_count: supabase.sql`views_count + 1` })
    .eq("id", showcaseId);

  if (error) {
    console.error("Error updating views:", error);
  }
}

// ─── Trust & Safety ───────────────────────────────────────────────────────

export async function reportContent(report: Omit<Report, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("reports")
    .insert({
      reported_by: report.reported_by,
      reported_user_id: report.reported_user_id,
      reported_job_id: report.reported_job_id,
      report_type: report.report_type,
      description: report.description,
      evidence_urls: report.evidence_urls,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating report:", error);
    return null;
  }
  return data as Report;
}

export async function getUserSafetyMetrics(userId: string) {
  const { data, error } = await supabase
    .from("safety_metrics")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching safety metrics:", error);
    return null;
  }
  return data as SafetyMetrics;
}

// ─── Recruiter Search ─────────────────────────────────────────────────────

export async function searchTalent(filters: TalentSearchFilter, limit = 50, offset = 0) {
  let query = supabase
    .from("profiles")
    .select(
      `
      *,
      user_badges (*),
      talent_showcases (*)
    `
    )
    .eq("role", "job_seeker");

  // Apply filters
  if (filters.verification_status) {
    query = query.eq("verification_status", filters.verification_status);
  }

  if (filters.open_to_work !== undefined) {
    query = query.eq("is_open_to_work", filters.open_to_work);
  }

  if (filters.locations && filters.locations.length > 0) {
    query = query.in("location", filters.locations);
  }

  // Execute query
  const { data, error, count } = await query.range(offset, offset + limit - 1).order("updated_at", {
    ascending: false,
  });

  if (error) {
    console.error("Error searching talent:", error);
    return { results: [], total: 0 };
  }

  return {
    results: data || [],
    total: count || 0,
  };
}

// ─── Universal Search ─────────────────────────────────────────────────────

export async function universalSearch(query: string, limit = 20): Promise<UniversalSearchResult[]> {
  // Search jobs
  const jobsPromise = supabase
    .from("jobs")
    .select("id, title, description, location, company_name")
    .textSearch("title", query, { type: "phrase" })
    .limit(limit / 3)
    .then(
      (res) =>
        res.data?.map((job: { id: string; title: string; description?: string; location?: string; company_name?: string }) => ({
          type: "job" as const,
          id: job.id,
          title: job.title,
          subtitle: job.company_name,
          description: job.description,
          location: job.location,
          relevance_score: 1,
        })) || []
    )
    .catch(() => [])
};

// Continue search for users
  const usersPromise = supabase
    .from("profiles")
    .select("id, full_name, headline, location, avatar_url, verification_status")
    .textSearch("full_name", query, { type: "phrase" })
    .limit(limit / 3)
    .then(
      (res) =>
        res.data?.map((user) => ({
          type: "job_seeker" as const,
          id: user.id,
          title: user.full_name || "User",
          subtitle: user.headline,
          image_url: user.avatar_url,
          location: user.location,
          verified: user.verification_status === "verified",
          relevance_score: 1,
        })) || []
    )
    .catch(() => []);

  // Search companies
  const companiesPromise = supabase
    .from("companies")
    .select("id, name, location, logo_url, verified")
    .textSearch("name", query, { type: "phrase" })
    .limit(limit / 3)
    .then(
      (res) =>
        res.data?.map((company) => ({
          type: "company" as const,
          id: company.id,
          title: company.name,
          image_url: company.logo_url,
          location: company.location,
          verified: company.verified,
          relevance_score: 1,
        })) || []
    )
    .catch(() => []);

  const [jobs, users, companies] = await Promise.all([jobsPromise, usersPromise, companiesPromise]);

  return [...jobs, ...users, ...companies].slice(0, limit);
}
