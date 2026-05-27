import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type Role = 'job_seeker' | 'employer' | 'admin';

export interface SeekerProfile {
  id: string;
  full_name: string | null;
  avatarUrl?: string | null;
  email?: string;
  role?: Role;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  phone?: string | null;
  skills?: string[];
  experience?: string[];
  education?: string[];
  resumeUrl?: string;
  portfolioUrl?: string;
  verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ApplicationRecord {
  id: string;
  applicant_id: string;
  job_id: string;
  jobTitle?: string;
  companyName?: string;
  status: string;
  created_at: string;
}

export interface SavedJobRecord {
  id: string;
  user_id: string;
  job_id: string;
  jobTitle?: string;
  companyName?: string;
  created_at: string;
}

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export async function getUserProfile(uid: string): Promise<SeekerProfile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();

  if (error || !data) return null;

  const row = data as ProfileRow & {
    skills?: string[];
    experience?: string[];
    education?: string[];
    resume_url?: string;
    portfolio_url?: string;
    verified?: boolean;
  };

  return {
    id: row.id,
    full_name: row.full_name,
    avatarUrl: row.avatar_url ?? undefined,
    headline: row.headline,
    bio: row.bio,
    location: row.location,
    phone: row.phone,
    skills: row.skills ?? [],
    experience: row.experience ?? [],
    education: row.education ?? [],
    resumeUrl: row.resume_url ?? undefined,
    portfolioUrl: row.portfolio_url ?? undefined,
    verified: row.verified ?? false,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function saveUserProfile(uid: string, profile: Partial<SeekerProfile>) {
  type ProfileUpdate = Database['public']['Tables']['profiles']['Update'] & {
    skills?: string[];
    experience?: string[];
    education?: string[];
    portfolio_url?: string;
    resume_url?: string;
  };

  const updateData: ProfileUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (profile.full_name !== undefined) updateData.full_name = profile.full_name;
  if (profile.headline !== undefined) updateData.headline = profile.headline;
  if (profile.bio !== undefined) updateData.bio = profile.bio;
  if (profile.location !== undefined) updateData.location = profile.location;
  if (profile.phone !== undefined) updateData.phone = profile.phone;
  if (profile.skills !== undefined) updateData.skills = profile.skills;
  if (profile.experience !== undefined) updateData.experience = profile.experience;
  if (profile.education !== undefined) updateData.education = profile.education;
  if (profile.portfolioUrl !== undefined) updateData.portfolio_url = profile.portfolioUrl;
  if (profile.resumeUrl !== undefined) updateData.resume_url = profile.resumeUrl;
  if ((profile as { avatarUrl?: string | null }).avatarUrl !== undefined)
    (updateData as Record<string, unknown>).avatar_url = (profile as { avatarUrl?: string | null }).avatarUrl;

  const { error } = await supabase
    .from('profiles')
    .update(updateData as never)
    .eq('id', uid);

  if (error) throw error;
}

export async function uploadResumeFile(uid: string, file: File) {
  const fileExt = file.name.split('.').pop();
  const timestamp = Date.now();
  // Path inside the bucket: uid/timestamp.ext
  // The bucket is 'resumes', so do NOT prefix with 'resumes/'
  const filePath = `${uid}/${timestamp}.${fileExt}`;

  const { error: uploadError } = await supabase.storage.from('resumes').upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(filePath);

  await saveUserProfile(uid, { resumeUrl: publicUrl });
  return publicUrl;
}

interface ApplicationRow {
  id: string;
  applicant_id: string;
  job_id: string;
  status: string;
  created_at: string;
  jobs?: {
    title?: string;
    companies?: {
      name?: string;
    } | null;
  } | null;
}

export async function fetchUserApplications(uid: string): Promise<ApplicationRecord[]> {
  const { data, error } = await supabase
    .from('applications')
    .select(
      `
      id,
      applicant_id,
      job_id,
      status,
      created_at,
      jobs (
        title,
        companies (
          name
        )
      )
    `,
    )
    .eq('applicant_id', uid)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching applications:', error);
    return [];
  }

  return (data as ApplicationRow[]).map((item) => ({
    id: item.id,
    applicant_id: item.applicant_id,
    job_id: item.job_id,
    jobTitle: item.jobs?.title ?? '',
    companyName: item.jobs?.companies?.name ?? '',
    status: item.status,
    created_at: item.created_at,
  }));
}

interface SavedJobRow {
  id: string;
  user_id: string;
  job_id: string;
  created_at: string;
  jobs?: {
    title?: string;
    companies?: {
      name?: string;
    } | null;
  } | null;
}

export async function fetchSavedJobs(uid: string): Promise<SavedJobRecord[]> {
  const { data, error } = await supabase
    .from('saved_jobs')
    .select(
      `
      id,
      user_id,
      job_id,
      created_at,
      jobs (
        title,
        companies (
          name
        )
      )
    `,
    )
    .eq('user_id', uid)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching saved jobs:', error);
    return [];
  }

  return (data as SavedJobRow[]).map((item) => ({
    id: item.id,
    user_id: item.user_id,
    job_id: item.job_id,
    jobTitle: item.jobs?.title ?? '',
    companyName: item.jobs?.companies?.name ?? '',
    created_at: item.created_at,
  }));
}

export async function uploadAvatarFile(uid: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop() ?? 'jpg';
  const filePath = `${uid}/avatar.${fileExt}`;

  // Upsert (overwrite existing avatar)
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

  // Save to profile
  await supabase.from('profiles').update({ avatar_url: publicUrl, updated_at: new Date().toISOString() }).eq('id', uid);
  return publicUrl;
}

export async function ensureUserDocument(uid: string, email: string, role: Role, fullName: string) {
  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', uid)
    .single();

  if (!existingProfile) {
    // Create profile
    await supabase.from('profiles').insert({
      id: uid,
      full_name: fullName,
    });
  }

  // Ensure user role
  const { data: existingRole } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', uid)
    .eq('role', role)
    .single();

  if (!existingRole) {
    await supabase.from('user_roles').insert({
      user_id: uid,
      role: role,
    });
  }

  void email; // used for type completeness
}
