// @ts-nocheck
/**
 * Recruitment Agency Data Functions
 * Handles agency profiles, projects, staff, and client management
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  RecruitmentAgency,
  RecruitmentProject,
  RecruitmentAgencyStaff,
  AgencyCandidate,
  AgencyProjectMetrics,
  AgencyInvoice,
  AgencyClientRelationship,
  AgencyReport,
} from "./enhanced-types";

// ─── Agency Management ────────────────────────────────────────────────────

export async function createRecruitmentAgency(
  agency: Omit<RecruitmentAgency, "id" | "created_at" | "updated_at">
) {
  const { data, error } = await supabase
    .from("recruitment_agencies")
    .insert({
      name: agency.name,
      email: agency.email,
      phone: agency.phone,
      website: agency.website,
      logo_url: agency.logo_url,
      location: agency.location,
      country: agency.country,
      founded_year: agency.founded_year,
      specialization: agency.specialization,
      description: agency.description,
      company_size: agency.company_size,
      verified: agency.verified,
      admin_id: agency.admin_id,
      max_projects: agency.max_projects || 10,
      max_staff: agency.max_staff || 50,
      subscription_tier: agency.subscription_tier || "free",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating recruitment agency:", error);
    return null;
  }
  return data as RecruitmentAgency;
}

export async function getRecruitmentAgency(agencyId: string) {
  const { data, error } = await supabase
    .from("recruitment_agencies")
    .select("*")
    .eq("id", agencyId)
    .single();

  if (error) {
    console.error("Error fetching recruitment agency:", error);
    return null;
  }
  return data as RecruitmentAgency;
}

export async function updateRecruitmentAgency(
  agencyId: string,
  updates: Partial<RecruitmentAgency>
) {
  const { data, error } = await supabase
    .from("recruitment_agencies")
    .update(updates)
    .eq("id", agencyId)
    .select()
    .single();

  if (error) {
    console.error("Error updating recruitment agency:", error);
    return null;
  }
  return data as RecruitmentAgency;
}

export async function getAgenciesByAdmin(adminId: string) {
  const { data, error } = await supabase
    .from("recruitment_agencies")
    .select("*")
    .eq("admin_id", adminId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching agencies:", error);
    return [];
  }
  return data as RecruitmentAgency[];
}

// ─── Projects Management ──────────────────────────────────────────────────

export async function createProject(
  agencyId: string,
  project: Omit<RecruitmentProject, "id" | "created_at" | "updated_at">
) {
  const { data, error } = await supabase
    .from("recruitment_projects")
    .insert({
      agency_id: agencyId,
      client_id: project.client_id,
      project_name: project.project_name,
      description: project.description,
      industry: project.industry,
      target_positions: project.target_positions,
      target_count: project.target_count,
      required_skills: project.required_skills,
      budget: project.budget,
      timeline: project.timeline,
      status: project.status || "draft",
      positions_filled: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating project:", error);
    return null;
  }
  return data as RecruitmentProject;
}

export async function getAgencyProjects(
  agencyId: string,
  status?: string
) {
  let query = supabase
    .from("recruitment_projects")
    .select("*")
    .eq("agency_id", agencyId);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
  return data as RecruitmentProject[];
}

export async function getProject(projectId: string) {
  const { data, error } = await supabase
    .from("recruitment_projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error) {
    console.error("Error fetching project:", error);
    return null;
  }
  return data as RecruitmentProject;
}

export async function updateProject(
  projectId: string,
  updates: Partial<RecruitmentProject>
) {
  const { data, error } = await supabase
    .from("recruitment_projects")
    .update(updates)
    .eq("id", projectId)
    .select()
    .single();

  if (error) {
    console.error("Error updating project:", error);
    return null;
  }
  return data as RecruitmentProject;
}

// ─── Staff Management ─────────────────────────────────────────────────────

export async function addAgencyStaff(
  agencyId: string,
  staff: Omit<RecruitmentAgencyStaff, "id" | "joined_at">
) {
  const { data, error } = await supabase
    .from("recruitment_agency_staff")
    .insert({
      agency_id: agencyId,
      user_id: staff.user_id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      specialization: staff.specialization,
      bio: staff.bio,
      avatar_url: staff.avatar_url,
      assigned_projects: staff.assigned_projects || [],
      candidates_placed: staff.candidates_placed || 0,
      success_rate: staff.success_rate || 0,
      is_active: staff.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding staff:", error);
    return null;
  }
  return data as RecruitmentAgencyStaff;
}

export async function getAgencyStaff(agencyId: string) {
  const { data, error } = await supabase
    .from("recruitment_agency_staff")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("is_active", true)
    .order("role", { ascending: true });

  if (error) {
    console.error("Error fetching staff:", error);
    return [];
  }
  return data as RecruitmentAgencyStaff[];
}

export async function getStaffMember(staffId: string) {
  const { data, error } = await supabase
    .from("recruitment_agency_staff")
    .select("*")
    .eq("id", staffId)
    .single();

  if (error) {
    console.error("Error fetching staff member:", error);
    return null;
  }
  return data as RecruitmentAgencyStaff;
}

export async function updateStaffMember(
  staffId: string,
  updates: Partial<RecruitmentAgencyStaff>
) {
  const { data, error } = await supabase
    .from("recruitment_agency_staff")
    .update(updates)
    .eq("id", staffId)
    .select()
    .single();

  if (error) {
    console.error("Error updating staff:", error);
    return null;
  }
  return data as RecruitmentAgencyStaff;
}

export async function removeStaffMember(staffId: string) {
  const { error } = await supabase
    .from("recruitment_agency_staff")
    .update({ is_active: false })
    .eq("id", staffId);

  if (error) {
    console.error("Error removing staff:", error);
    return false;
  }
  return true;
}

// ─── Candidate Management ─────────────────────────────────────────────────

export async function submitCandidate(
  agencyId: string,
  candidate: Omit<AgencyCandidate, "id" | "submitted_at" | "updated_at">
) {
  const { data, error } = await supabase
    .from("agency_candidates")
    .insert({
      agency_id: agencyId,
      project_id: candidate.project_id,
      candidate_id: candidate.candidate_id,
      candidate_name: candidate.candidate_name,
      candidate_email: candidate.candidate_email,
      candidate_phone: candidate.candidate_phone,
      submitted_by_staff_id: candidate.submitted_by_staff_id,
      status: candidate.status || "submitted",
      notes: candidate.notes,
      rating: candidate.rating,
      salary_expectation: candidate.salary_expectation,
    })
    .select()
    .single();

  if (error) {
    console.error("Error submitting candidate:", error);
    return null;
  }
  return data as AgencyCandidate;
}

export async function getProjectCandidates(projectId: string) {
  const { data, error } = await supabase
    .from("agency_candidates")
    .select("*")
    .eq("project_id", projectId)
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("Error fetching candidates:", error);
    return [];
  }
  return data as AgencyCandidate[];
}

export async function updateCandidateStatus(
  candidateId: string,
  status: string,
  notes?: string
) {
  const { data, error } = await supabase
    .from("agency_candidates")
    .update({
      status,
      notes,
      updated_at: new Date().toISOString(),
      ...(status === "placed" && { placement_date: new Date().toISOString() }),
    })
    .eq("id", candidateId)
    .select()
    .single();

  if (error) {
    console.error("Error updating candidate status:", error);
    return null;
  }
  return data as AgencyCandidate;
}

// ─── Project Metrics ──────────────────────────────────────────────────────

export async function getProjectMetrics(projectId: string) {
  const { data, error } = await supabase
    .from("agency_project_metrics")
    .select("*")
    .eq("project_id", projectId)
    .single();

  if (error) {
    console.error("Error fetching metrics:", error);
    return null;
  }
  return data as AgencyProjectMetrics;
}

export async function calculateProjectMetrics(projectId: string) {
  const { data: candidates, error } = await supabase
    .from("agency_candidates")
    .select("status, submitted_at, placement_date")
    .eq("project_id", projectId);

  if (error || !candidates) {
    console.error("Error calculating metrics:", error);
    return null;
  }

  const metrics = {
    total_candidates_submitted: candidates.length,
    candidates_shortlisted: candidates.filter((c) => c.status === "shortlisted").length,
    candidates_interviewed: candidates.filter((c) => c.status === "interviewed").length,
    candidates_offered: candidates.filter((c) => c.status === "offered").length,
    candidates_placed: candidates.filter((c) => c.status === "placed").length,
  };

  const conversionRate =
    metrics.total_candidates_submitted > 0
      ? (metrics.candidates_placed / metrics.total_candidates_submitted) * 100
      : 0;

  return {
    ...metrics,
    conversion_rate: Math.round(conversionRate),
    success_rate: Math.round(conversionRate),
  };
}

// ─── Invoicing ────────────────────────────────────────────────────────────

export async function createInvoice(
  agencyId: string,
  invoice: Omit<AgencyInvoice, "id" | "created_at" | "updated_at">
) {
  const { data, error } = await supabase
    .from("agency_invoices")
    .insert({
      agency_id: agencyId,
      project_id: invoice.project_id,
      invoice_number: invoice.invoice_number,
      client_id: invoice.client_id,
      amount: invoice.amount,
      currency: invoice.currency || "USD",
      status: invoice.status || "draft",
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      description: invoice.description,
      line_items: invoice.line_items,
      notes: invoice.notes,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating invoice:", error);
    return null;
  }
  return data as AgencyInvoice;
}

export async function getAgencyInvoices(agencyId: string) {
  const { data, error } = await supabase
    .from("agency_invoices")
    .select("*")
    .eq("agency_id", agencyId)
    .order("issue_date", { ascending: false });

  if (error) {
    console.error("Error fetching invoices:", error);
    return [];
  }
  return data as AgencyInvoice[];
}

// ─── Client Relationships ─────────────────────────────────────────────────

export async function getAgencyClients(agencyId: string) {
  const { data, error } = await supabase
    .from("agency_client_relationships")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("relationship_status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
  return data as AgencyClientRelationship[];
}

export async function addAgencyClient(
  agencyId: string,
  client: Omit<AgencyClientRelationship, "id" | "created_at" | "updated_at">
) {
  const { data, error } = await supabase
    .from("agency_client_relationships")
    .insert({
      agency_id: agencyId,
      client_id: client.client_id,
      client_name: client.client_name,
      relationship_status: client.relationship_status || "active",
      projects_count: client.projects_count || 0,
      total_placements: client.total_placements || 0,
      total_revenue: client.total_revenue,
      contract_start_date: client.contract_start_date,
      contract_end_date: client.contract_end_date,
      notes: client.notes,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding client:", error);
    return null;
  }
  return data as AgencyClientRelationship;
}

// ─── Reports ──────────────────────────────────────────────────────────────

export async function generateAgencyReport(
  agencyId: string,
  reportType: "monthly" | "quarterly" | "yearly" | "project",
  periodStart: string,
  periodEnd: string
) {
  // Get projects
  const { data: projects } = await supabase
    .from("recruitment_projects")
    .select("id, status")
    .eq("agency_id", agencyId);

  // Get placements
  const { data: placements } = await supabase
    .from("agency_candidates")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("status", "placed")
    .gte("placement_date", periodStart)
    .lte("placement_date", periodEnd);

  // Get staff
  const { data: staff } = await supabase
    .from("recruitment_agency_staff")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("is_active", true);

  const totalPlacements = placements?.length || 0;
  const successRate = projects && projects.length > 0 ? (totalPlacements / projects.length) * 100 : 0;

  return {
    agency_id: agencyId,
    report_type: reportType,
    period_start: periodStart,
    period_end: periodEnd,
    total_placements: totalPlacements,
    total_projects: projects?.length || 0,
    active_projects: projects?.filter((p) => p.status === "active").length || 0,
    team_size: staff?.length || 0,
    success_rate: Math.round(successRate),
  } as AgencyReport;
}