import * as React from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Users,
  Eye,
  Star,
  Plus,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  BadgeCheck,
  ChevronRight,
  BarChart3,
  Send,
  Building2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { SiteHeader, SiteFooter, MobileBottomNav } from '@/components/site-chrome';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { timeAgo } from '@/lib/kazi-data';
import { AvatarUpload } from '@/components/avatar-upload';

export const Route = createFileRoute('/employer-dashboard')({
  component: EmployerDashboardPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
  location: string | null;
  website: string | null;
  verified: boolean;
  description: string | null;
  employees_count: string | null;
}
interface Job {
  id: string;
  title: string;
  status: string;
  created_at: string;
  views_count: number;
  deadline: string | null;
  companies: { name: string } | null;
  _applications_count?: number;
}
interface Application {
  id: string;
  applicant_id: string;
  job_id: string;
  status: string;
  created_at: string;
  remarks: string | null;
  qualifications: string | null;
  experience_note: string | null;
  background_check: boolean;
  references_shared: boolean;
  employer_score: number | null;
  employer_notes: string | null;
  cv_snapshot: Record<string, unknown> | null;
  jobs: { title: string } | null;
  profiles: {
    full_name: string | null;
    headline: string | null;
    location: string | null;
    avatar_url: string | null;
    skills: string[] | null;
    resume_url: string | null;
    phone: string | null;
  } | null;
}

const STATUS_COLORS: Record<string, string> = {
  applied: 'bg-blue-100 text-blue-800',
  under_review: 'bg-amber-100 text-amber-800',
  shortlisted: 'bg-purple-100 text-purple-800',
  interview: 'bg-indigo-100 text-indigo-800',
  offer: 'bg-emerald-100 text-emerald-800',
  hired: 'bg-emerald-200 text-emerald-900',
  rejected: 'bg-red-100 text-red-800',
};

const APP_STATUSES = [
  { value: 'applied', label: 'Applied' },
  { value: 'under_review', label: 'Under review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer extended' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Not selected' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
function EmployerDashboardPage() {
  const { user, loading, roles } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && !user) navigate({ to: '/auth' });
    if (!loading && user && !roles.includes('employer') && !roles.includes('admin')) {
      navigate({ to: '/dashboard' });
    }
  }, [user, loading, roles, navigate]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0 bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold">Employer Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Manage your companies, jobs, and candidates
            </p>
          </div>
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shrink-0">
            <Link to="/post-job">
              <Plus className="h-4 w-4 mr-1.5" /> Post a job
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="h-10 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="jobs">Job listings</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="employees">Team verification</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab userId={user.id} />
          </TabsContent>
          <TabsContent value="companies">
            <CompaniesTab userId={user.id} />
          </TabsContent>
          <TabsContent value="jobs">
            <JobsTab userId={user.id} />
          </TabsContent>
          <TabsContent value="applications">
            <ApplicationsTab userId={user.id} />
          </TabsContent>
          <TabsContent value="employees">
            <EmployeesTab userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ userId }: { userId: string }) {
  const { data: stats } = useQuery({
    queryKey: ['employer-stats', userId],
    queryFn: async () => {
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', userId);
      const companyIds = (companies ?? []).map((c: { id: string }) => c.id);

      const [jobsRes, appsRes] = await Promise.all([
        supabase.from('jobs').select('id,status,views_count').eq('posted_by', userId),
        companyIds.length
          ? supabase
              .from('applications')
              .select('id,status,created_at')
              .in(
                'job_id',
                (await supabase.from('jobs').select('id').eq('posted_by', userId)).data?.map(
                  (j) => j.id,
                ) ?? [],
              )
          : { data: [] },
      ]);

      const jobs = jobsRes.data ?? [];
      const apps = appsRes.data ?? [];

      return {
        totalJobs: jobs.length,
        activeJobs: jobs.filter((j) => j.status === 'published').length,
        totalViews: jobs.reduce((s, j) => s + (j.views_count ?? 0), 0),
        totalApps: apps.length,
        newApps: apps.filter((a) => a.status === 'applied').length,
        shortlisted: apps.filter((a) => a.status === 'shortlisted').length,
        companies: companies?.length ?? 0,
      };
    },
  });

  const s = stats ?? {
    totalJobs: 0,
    activeJobs: 0,
    totalViews: 0,
    totalApps: 0,
    newApps: 0,
    shortlisted: 0,
    companies: 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            icon: Briefcase,
            label: 'Active jobs',
            value: s.activeJobs,
            sub: `${s.totalJobs} total`,
          },
          { icon: Eye, label: 'Total views', value: s.totalViews, sub: 'across all jobs' },
          { icon: Send, label: 'Applications', value: s.totalApps, sub: `${s.newApps} new` },
          { icon: Star, label: 'Shortlisted', value: s.shortlisted, sub: 'candidates' },
        ].map(({ icon: Icon, label, value, sub }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-accent/10 grid place-items-center text-accent shrink-0">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold leading-none">{value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                <div className="text-[10px] text-muted-foreground/60">{sub}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          {
            label: 'Post a new job',
            to: '/post-job',
            icon: Plus,
            desc: 'Reach thousands of candidates',
          },
          {
            label: 'View company profile',
            to: '/companies' as never,
            icon: Building2,
            desc: 'See how candidates see you',
          },
          {
            label: 'Browse candidates',
            to: '/jobs' as never,
            icon: Users,
            desc: 'Find talent proactively',
          },
        ].map(({ label, to, icon: Icon, desc }) => (
          <Link key={label} to={to} className="group">
            <Card className="p-4 hover:shadow-md hover:border-accent/40 transition-all h-full">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-accent/10 grid place-items-center text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm group-hover:text-accent transition-colors">
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Companies Tab ────────────────────────────────────────────────────────────
function CompaniesTab({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const { data: companies, isLoading } = useQuery({
    queryKey: ['my-companies', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('companies')
        .select('id,name,logo_url,industry,location,website,verified,description,employees_count')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });
      return (data ?? []) as Company[];
    },
  });

  if (isLoading)
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );

  return (
    <div className="space-y-4">
      {companies?.length ? (
        companies.map((co) => (
          <Card key={co.id} className="p-5">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-xl border border-border bg-cream grid place-items-center overflow-hidden shrink-0">
                {co.logo_url ? (
                  <img src={co.logo_url} alt={co.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display font-bold text-xl text-primary">{co.name[0]}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display font-semibold flex items-center gap-1.5">
                      {co.name}
                      {co.verified && <BadgeCheck className="h-4 w-4 text-accent" />}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                      {co.industry && <span>{co.industry}</span>}
                      {co.location && <span>· {co.location}</span>}
                      {co.employees_count && <span>· {co.employees_count} employees</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                      <Link to="/companies/$id" params={{ id: co.id }}>
                        View public page
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className="h-7 text-xs bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      <Link to="/post-job">Post job</Link>
                    </Button>
                  </div>
                </div>
                {co.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {co.description}
                  </p>
                )}
                {!co.verified && (
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                    <Clock className="h-3 w-3" /> Pending admin verification
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))
      ) : (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-display font-semibold">No companies yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create a company profile when you post your first job.
          </p>
          <Button asChild className="mt-4 bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link to="/post-job">Post a job</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Jobs Tab ─────────────────────────────────────────────────────────────────
function JobsTab({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['employer-jobs-full', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('jobs')
        .select('id,title,status,created_at,views_count,deadline,companies(name)')
        .eq('posted_by', userId)
        .order('created_at', { ascending: false });
      return (data ?? []) as Job[];
    },
  });

  const updateStatus = async (jobId: string, status: string) => {
    await supabase
      .from('jobs')
      .update({ status } as never)
      .eq('id', jobId);
    toast.success('Job status updated');
    queryClient.invalidateQueries({ queryKey: ['employer-jobs-full', userId] });
  };

  if (isLoading)
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );

  return (
    <div className="space-y-3">
      {jobs?.length ? (
        jobs.map((job) => (
          <Card key={job.id} className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <Link
                  to="/job/$id"
                  params={{ id: job.id }}
                  className="font-semibold text-sm hover:text-accent transition-colors block truncate"
                >
                  {job.title}
                </Link>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{job.companies?.name}</span>
                  <span className="flex items-center gap-0.5">
                    <Eye className="h-3 w-3" /> {job.views_count ?? 0}
                  </span>
                  {job.deadline && (
                    <span>
                      Deadline:{' '}
                      {new Date(job.deadline).toLocaleDateString('en-TZ', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  )}
                  <span>{timeAgo(job.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Select value={job.status} onValueChange={(v) => updateStatus(job.id, v)}>
                  <SelectTrigger className="h-7 text-xs w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['draft', 'published', 'closed'].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                  <Link to="/job/$id" params={{ id: job.id }}>
                    View
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        ))
      ) : (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Briefcase className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-display font-semibold">No jobs posted yet</p>
          <Button asChild className="mt-4 bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link to="/post-job">Post your first job</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Applications Tab ─────────────────────────────────────────────────────────
function ApplicationsTab({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = React.useState<Application | null>(null);
  const [notes, setNotes] = React.useState('');
  const [score, setScore] = React.useState<number>(0);
  const [saving, setSaving] = React.useState(false);

  const { data: applications, isLoading } = useQuery({
    queryKey: ['employer-applications', userId],
    queryFn: async () => {
      // Get all job IDs posted by this user
      const { data: jobIds } = await supabase.from('jobs').select('id').eq('posted_by', userId);
      if (!jobIds?.length) return [];

      const { data } = await supabase
        .from('applications')
        .select(
          `
          id, applicant_id, job_id, status, created_at,
          remarks, qualifications, experience_note,
          background_check, references_shared,
          employer_score, employer_notes, cv_snapshot,
          jobs(title),
          profiles!applicant_id(full_name, headline, location, avatar_url, skills, resume_url, phone)
        `,
        )
        .in(
          'job_id',
          jobIds.map((j) => j.id),
        )
        .order('created_at', { ascending: false });
      return (data ?? []) as unknown as Application[];
    },
  });

  const updateStatus = async (appId: string, status: string) => {
    await supabase
      .from('applications')
      .update({ status } as never)
      .eq('id', appId);
    toast.success('Status updated');
    queryClient.invalidateQueries({ queryKey: ['employer-applications', userId] });
    if (selected?.id === appId) setSelected((prev) => (prev ? { ...prev, status } : null));
  };

  const saveNotes = async () => {
    if (!selected) return;
    setSaving(true);
    await supabase
      .from('applications')
      .update({
        employer_notes: notes || null,
        employer_score: score || null,
      } as never)
      .eq('id', selected.id);
    toast.success('Notes saved');
    setSaving(false);
    queryClient.invalidateQueries({ queryKey: ['employer-applications', userId] });
  };

  if (isLoading)
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-5">
      {/* List */}
      <div className="space-y-2">
        {applications?.length ? (
          applications.map((app) => (
            <Card
              key={app.id}
              className={`p-4 cursor-pointer hover:shadow-md transition-all ${selected?.id === app.id ? 'border-accent ring-1 ring-accent/30' : ''}`}
              onClick={() => {
                setSelected(app);
                setNotes(app.employer_notes ?? '');
                setScore(app.employer_score ?? 0);
              }}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="h-10 w-10 rounded-xl bg-accent/10 grid place-items-center shrink-0 overflow-hidden">
                  {app.profiles?.avatar_url ? (
                    <img
                      src={app.profiles.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-accent">
                      {app.profiles?.full_name?.[0]?.toUpperCase() ?? 'U'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">
                        {app.profiles?.full_name ?? 'Applicant'}
                      </p>
                      <p className="text-xs text-muted-foreground">{app.profiles?.headline}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        For: <span className="text-foreground">{app.jobs?.title}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[app.status] ?? 'bg-muted text-muted-foreground'}`}
                      >
                        {app.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {timeAgo(app.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {app.background_check && (
                      <Badge variant="outline" className="text-[10px]">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5 text-emerald-500" />
                        BG check
                      </Badge>
                    )}
                    {app.references_shared && (
                      <Badge variant="outline" className="text-[10px]">
                        <Users className="h-2.5 w-2.5 mr-0.5 text-blue-500" />
                        References
                      </Badge>
                    )}
                    {app.employer_score && (
                      <Badge variant="outline" className="text-[10px]">
                        {'★'.repeat(app.employer_score)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Send className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-display font-semibold">No applications yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Applications will appear here once candidates apply.
            </p>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected ? (
        <div className="space-y-4 sticky top-20">
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-accent/10 grid place-items-center overflow-hidden shrink-0">
                {selected.profiles?.avatar_url ? (
                  <img
                    src={selected.profiles.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-xl text-accent">
                    {selected.profiles?.full_name?.[0]?.toUpperCase() ?? 'U'}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold">{selected.profiles?.full_name}</p>
                <p className="text-xs text-muted-foreground">{selected.profiles?.headline}</p>
                {selected.profiles?.location && (
                  <p className="text-xs text-muted-foreground">{selected.profiles.location}</p>
                )}
              </div>
            </div>

            {/* Contact */}
            {(selected.profiles?.phone || selected.profiles?.resume_url) && (
              <div className="space-y-1 mb-4">
                {selected.profiles.phone && (
                  <p className="text-xs text-muted-foreground">📞 {selected.profiles.phone}</p>
                )}
                {selected.profiles.resume_url && (
                  <a
                    href={selected.profiles.resume_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-accent hover:underline"
                  >
                    📄 View resume ↗
                  </a>
                )}
              </div>
            )}

            {/* Skills */}
            {(selected.profiles?.skills?.length ?? 0) > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {selected.profiles!.skills!.slice(0, 8).map((s) => (
                    <Badge key={s} variant="secondary" className="text-[10px]">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator className="my-3" />

            {/* Application details */}
            {selected.remarks && (
              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Cover message</p>
                <p className="text-xs text-foreground/80 bg-muted/40 rounded-lg p-2.5 line-clamp-4">
                  {selected.remarks}
                </p>
              </div>
            )}
            {selected.qualifications && (
              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Qualifications</p>
                <p className="text-xs text-foreground/80 bg-muted/40 rounded-lg p-2.5 line-clamp-3">
                  {selected.qualifications}
                </p>
              </div>
            )}
            {selected.experience_note && (
              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Experience</p>
                <p className="text-xs text-foreground/80 bg-muted/40 rounded-lg p-2.5 line-clamp-3">
                  {selected.experience_note}
                </p>
              </div>
            )}

            <Separator className="my-3" />

            {/* Status update */}
            <div className="mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Update status</p>
              <Select value={selected.status} onValueChange={(v) => updateStatus(selected.id, v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APP_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Star rating */}
            <div className="mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Your rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setScore(n)}
                    className={`text-lg transition-transform hover:scale-110 ${n <= score ? 'text-amber-400' : 'text-muted-foreground/20'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Private notes */}
            <div className="mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Private notes</p>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Notes visible only to you..."
                className="text-xs"
              />
            </div>

            <Button
              onClick={saveNotes}
              disabled={saving}
              size="sm"
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
              Save notes
            </Button>
          </Card>
        </div>
      ) : (
        <div className="hidden lg:flex rounded-xl border border-dashed border-border p-8 items-center justify-center">
          <p className="text-sm text-muted-foreground">Select an application to review</p>
        </div>
      )}
    </div>
  );
}

// ─── Employees Tab ────────────────────────────────────────────────────────────
function EmployeesTab({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  const { data: employees } = useQuery({
    queryKey: ['employer-employees', userId],
    queryFn: async () => {
      const { data: companies } = await supabase
        .from('companies')
        .select('id,name')
        .eq('owner_id', userId);
      if (!companies?.length) return [];
      const ids = companies.map((c: { id: string }) => c.id);
      const { data } = await (supabase as any)
        .from('company_employees')
        .select(
          'id,user_id,job_title,department,verified,company_id,created_at,profiles!user_id(full_name,headline,avatar_url)',
        )
        .in('company_id', ids)
        .order('verified', { ascending: true });
      return (data ?? []).map((e: any) => ({
        ...e,
        companyName: companies.find((c: any) => c.id === e.company_id)?.name ?? '',
      }));
    },
  });

  const verify = async (id: string, verified: boolean) => {
    await (supabase as any).from('company_employees').update({ verified }).eq('id', id);
    toast.success(verified ? 'Verified — badge awarded!' : 'Verification revoked');
    queryClient.invalidateQueries({ queryKey: ['employer-employees', userId] });
  };

  const pending = employees?.filter((e: any) => !e.verified) ?? [];
  const verified = employees?.filter((e: any) => e.verified) ?? [];

  return (
    <div className="space-y-5">
      {pending.length > 0 && (
        <Card className="p-5">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Pending verification ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map((emp: any) => (
              <EmployeeRow
                key={emp.id}
                emp={emp}
                onVerify={() => verify(emp.id, true)}
                onRevoke={() => verify(emp.id, false)}
              />
            ))}
          </div>
        </Card>
      )}

      {verified.length > 0 && (
        <Card className="p-5">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <BadgeCheck className="h-4 w-4 text-emerald-500" />
            Verified employees ({verified.length})
          </h3>
          <div className="space-y-3">
            {verified.map((emp: any) => (
              <EmployeeRow
                key={emp.id}
                emp={emp}
                onVerify={() => verify(emp.id, true)}
                onRevoke={() => verify(emp.id, false)}
              />
            ))}
          </div>
        </Card>
      )}

      {!employees?.length && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-display font-semibold">No employee registrations yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Employees who add your company to their CV will appear here for verification.
          </p>
        </div>
      )}
    </div>
  );
}

function EmployeeRow({
  emp,
  onVerify,
  onRevoke,
}: {
  emp: any;
  onVerify: () => void;
  onRevoke: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border p-3 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-xl bg-accent/10 grid place-items-center overflow-hidden shrink-0">
          {emp.profiles?.avatar_url ? (
            <img src={emp.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="font-bold text-sm text-accent">
              {emp.profiles?.full_name?.[0]?.toUpperCase() ?? 'U'}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{emp.profiles?.full_name ?? 'User'}</p>
          <p className="text-xs text-muted-foreground truncate">
            {emp.job_title}
            {emp.department ? ` · ${emp.department}` : ''} at {emp.companyName}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {emp.verified ? (
          <>
            <Badge className="bg-emerald-100 text-emerald-800 text-xs">
              <BadgeCheck className="h-3 w-3 mr-0.5" />
              Verified
            </Badge>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onRevoke}>
              Revoke
            </Button>
          </>
        ) : (
          <>
            <Badge variant="secondary" className="text-xs">
              Pending
            </Badge>
            <Button
              size="sm"
              className="h-7 text-xs bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={onVerify}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Verify
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
