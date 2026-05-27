import * as React from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  MapPin,
  Clock,
  Briefcase,
  Calendar,
  BadgeCheck,
  Bookmark,
  ArrowLeft,
  Eye,
  Users,
  ExternalLink,
  Mail,
  Globe2,
  CheckCircle2,
  ChevronRight,
  Share2,
  Flag,
  BookmarkCheck,
  Building2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { SiteHeader, SiteFooter, MobileBottomNav } from '@/components/site-chrome';
import { ApplyDialog } from '@/components/apply-dialog';
import { FollowButton } from '@/components/follow-button';
import { supabase, supabaseConfigured } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { getUserProfile } from '@/lib/supabase-data';
import { formatSalary, industryLabel, timeAgo } from '@/lib/kazi-data';

export const Route = createFileRoute('/job/$id')({
  component: JobDetail,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function BulletList({ text }: { text: string }) {
  const items = text
    .split('\n')
    .map((l) => l.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
  if (!items.length)
    return <p className="text-sm text-foreground/80 whitespace-pre-wrap">{text}</p>;
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80">
          <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function JobDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reportOpen, setReportOpen] = React.useState(false);
  const [reportReason, setReportReason] = React.useState('scam');
  const [reportDetails, setReportDetails] = React.useState('');
  const [reporting, setReporting] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  // Increment view count once per mount
  React.useEffect(() => {
    supabase.rpc('increment_job_views' as never, { job_id: id } as never).then(() => {});
  }, [id]);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      if (!supabaseConfigured) {
        return {
          id,
          title: `Sample Job ${id}`,
          location: 'Dar es Salaam',
          region: 'Dar es Salaam',
          industry: 'ict',
          contract_type: 'Full-time',
          position_level: 'Mid-level',
          salary_min: 1500000,
          salary_max: 3000000,
          salary_negotiable: false,
          currency: 'TZS',
          created_at: new Date().toISOString(),
          deadline: null,
          featured: false,
          description:
            'This is a sample job description used during development when Supabase is not configured.',
          requirements:
            '- Bachelor degree in relevant field\n- 3+ years experience\n- Strong communication skills',
          responsibilities:
            '- Lead key projects\n- Collaborate with cross-functional teams\n- Report to management',
          apply_method: 'internal',
          apply_email: null,
          apply_url: null,
          views_count: 42,
          companies: {
            id: 'dev',
            name: 'Dev Company',
            logo_url: null,
            description: null,
            location: null,
            verified: false,
            owner_id: null,
          },
        } as never;
      }
      const { data, error } = await supabase
        .from('jobs')
        .select(
          '*,companies(id,name,logo_url,description,location,industry,website,verified,owner_id)',
        )
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: applicantCount } = useQuery({
    queryKey: ['job-applicants-count', id],
    queryFn: async () => {
      const { count } = await supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .eq('job_id', id);
      return count ?? 0;
    },
  });

  const { data: hasApplied } = useQuery({
    queryKey: ['application', id, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', id)
        .eq('applicant_id', user!.id)
        .maybeSingle();
      return !!data;
    },
  });

  const { data: isSaved } = useQuery({
    queryKey: ['saved-job', id, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('saved_jobs')
        .select('id')
        .eq('job_id', id)
        .eq('user_id', user!.id)
        .maybeSingle();
      return !!data;
    },
  });

  const { data: existingReport } = useQuery({
    queryKey: ['job-report', id, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('job_reports')
        .select('id')
        .eq('job_id', id)
        .eq('reporter_id', user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user?.id,
    queryFn: () => getUserProfile(user!.id),
  });

  // Match score
  const match = React.useMemo(() => {
    if (!profile || !job) return { score: 0, items: [] as { label: string; ok: boolean }[] };
    const items = [
      {
        label: 'Location match',
        ok: !!(profile.location && job.region && profile.location === job.region),
      },
      {
        label: 'Industry match',
        ok: !!(
          profile.headline?.toLowerCase().includes(job.industry?.toLowerCase() ?? '') ||
          profile.skills?.some((s: string) =>
            s.toLowerCase().includes(job.industry?.toLowerCase() ?? ''),
          )
        ),
      },
      {
        label: 'Skills match',
        ok: !!(
          profile.skills?.length &&
          job.description &&
          profile.skills.some((s: string) =>
            job.description.toLowerCase().includes(s.toLowerCase()),
          )
        ),
      },
      {
        label: 'Resume uploaded',
        ok: !!profile.resumeUrl,
      },
    ];
    const score = Math.round((items.filter((i) => i.ok).length / items.length) * 100);
    return { score, items };
  }, [profile, job]);

  const handleSave = async () => {
    if (!user) return navigate({ to: '/auth' });
    if (isSaved) {
      await supabase.from('saved_jobs').delete().eq('job_id', id).eq('user_id', user.id);
      toast.success('Removed from saved');
    } else {
      const { error } = await supabase.from('saved_jobs').insert({ user_id: user.id, job_id: id });
      if (error && !error.message.includes('duplicate')) toast.error(error.message);
      else toast.success('Saved to your list');
    }
    queryClient.invalidateQueries({ queryKey: ['saved-job', id, user.id] });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: job?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  // ── Loading / not found ───────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="container mx-auto px-4 py-12 max-w-4xl animate-pulse space-y-4">
          <div className="h-8 w-1/2 bg-muted rounded" />
          <div className="h-4 w-1/3 bg-muted rounded" />
          <div className="h-48 bg-muted rounded-2xl mt-6" />
          <div className="h-32 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="container mx-auto px-4 py-20 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-semibold">Job not found</h1>
          <Button asChild className="mt-4">
            <Link to="/jobs">Browse jobs</Link>
          </Button>
        </div>
      </div>
    );
  }

  const co = (job as any).companies;
  const applyMethod: string = (job as any).apply_method ?? 'internal';
  const applyEmail: string | null = (job as any).apply_email ?? null;
  const applyUrl: string | null = (job as any).apply_url ?? null;
  const requirements: string | null = (job as any).requirements ?? null;
  const responsibilities: string | null = (job as any).responsibilities ?? null;
  const isExpired = job.deadline && new Date(job.deadline) < new Date();
  const isOwner = user?.id === co?.owner_id;

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      <SiteHeader />

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Back */}
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link to="/jobs">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to jobs
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* ── Left column — main content ──────────────────────── */}
          <div className="space-y-5 min-w-0">
            {/* Job header card */}
            <Card className="p-6">
              <div className="flex items-start gap-4">
                {/* Company logo */}
                <Link to="/companies/$id" params={{ id: co?.id ?? '' }}>
                  {co?.logo_url ? (
                    <img
                      src={co.logo_url}
                      alt={co.name}
                      className="h-16 w-16 rounded-xl border border-border object-cover hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-accent/10 grid place-items-center font-display font-bold text-xl text-accent border border-border">
                      {co?.name?.[0]?.toUpperCase() ?? 'C'}
                    </div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <h1 className="font-display text-2xl md:text-3xl font-bold leading-tight">
                    {job.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Link
                      to="/companies/$id"
                      params={{ id: co?.id ?? '' }}
                      className="text-muted-foreground hover:text-accent transition-colors font-medium text-sm"
                    >
                      {co?.name}
                    </Link>
                    {co?.verified && <BadgeCheck className="h-4 w-4 text-accent shrink-0" />}
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {job.views_count ?? 0} views
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> {applicantCount ?? 0} applied
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-cream border border-border gap-1">
                  <MapPin className="h-3 w-3" /> {job.region ?? job.location}
                </Badge>
                <Badge variant="secondary" className="bg-cream border border-border gap-1">
                  <Briefcase className="h-3 w-3" /> {job.contract_type}
                </Badge>
                {job.position_level && (
                  <Badge variant="secondary" className="bg-cream border border-border">
                    {job.position_level}
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-cream border border-border">
                  {industryLabel(job.industry)}
                </Badge>
                {job.deadline && (
                  <Badge
                    variant="secondary"
                    className={`gap-1 ${isExpired ? 'bg-red-100 text-red-700 border-red-200' : 'bg-cream border border-border'}`}
                  >
                    <Calendar className="h-3 w-3" />
                    {isExpired
                      ? 'Expired'
                      : `Deadline ${new Date(job.deadline).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-cream border border-border gap-1">
                  <Clock className="h-3 w-3" /> {timeAgo(job.created_at)}
                </Badge>
              </div>

              {/* Salary */}
              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                    Salary
                  </p>
                  <p className="font-display text-xl font-bold">
                    {formatSalary(
                      job.salary_min,
                      job.salary_max,
                      job.currency ?? 'TZS',
                      job.salary_negotiable ?? false,
                    )}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={handleSave} className="h-9">
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="h-4 w-4 text-accent" /> Saved
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-4 w-4" /> Save
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare} className="h-9">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReportOpen(true)}
                    className="h-9 text-muted-foreground"
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* ── How to apply ───────────────────────────────────── */}
            <Card className={`p-6 ${isExpired ? 'opacity-60' : 'border-accent/30 bg-accent/5'}`}>
              <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-accent" />
                How to apply
              </h2>

              {isExpired ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  This job listing has expired. The application deadline was{' '}
                  {new Date(job.deadline!).toLocaleDateString('en-TZ', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  .
                </div>
              ) : applyMethod === 'email' && applyEmail ? (
                <div className="space-y-4">
                  <p className="text-sm text-foreground/80">
                    Send your CV and cover letter directly to the employer's email address below.
                    Make sure to mention the job title <strong>{job.title}</strong> in the subject
                    line.
                  </p>
                  <div className="rounded-xl border border-border bg-background p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-accent/10 grid place-items-center shrink-0">
                        <Mail className="h-5 w-5 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Email your application to</p>
                        <p className="font-semibold text-sm truncate">{applyEmail}</p>
                      </div>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      className="bg-accent hover:bg-accent/90 text-accent-foreground shrink-0"
                    >
                      <a
                        href={`mailto:${applyEmail}?subject=Application: ${encodeURIComponent(job.title)}`}
                      >
                        <Mail className="h-4 w-4 mr-1.5" /> Send email
                      </a>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Attach your resume as a PDF. You can also apply through Talentra below to track
                    your application.
                  </p>
                  <ApplyDialog
                    jobId={id}
                    jobTitle={job.title}
                    companyName={co?.name ?? ''}
                    hasApplied={!!hasApplied}
                  />
                </div>
              ) : applyMethod === 'url' && applyUrl ? (
                <div className="space-y-4">
                  <p className="text-sm text-foreground/80">
                    This job uses an external application portal. Click the button below to apply on
                    the company's website.
                  </p>
                  <div className="rounded-xl border border-border bg-background p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-accent/10 grid place-items-center shrink-0">
                        <Globe2 className="h-5 w-5 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">External application portal</p>
                        <p className="font-semibold text-sm truncate">
                          {new URL(applyUrl).hostname.replace('www.', '')}
                        </p>
                      </div>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      className="bg-accent hover:bg-accent/90 text-accent-foreground shrink-0"
                    >
                      <a href={applyUrl} target="_blank" rel="noreferrer">
                        Apply now <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                      </a>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can also apply through Talentra to keep track of this application.
                  </p>
                  <ApplyDialog
                    jobId={id}
                    jobTitle={job.title}
                    companyName={co?.name ?? ''}
                    hasApplied={!!hasApplied}
                  />
                </div>
              ) : (
                /* Internal — apply via Talentra */
                <div className="space-y-4">
                  <p className="text-sm text-foreground/80">
                    Apply directly through Talentra. Your profile, CV, and cover message will be
                    sent to <strong>{co?.name}</strong>. The employer will review your application
                    and contact you if shortlisted.
                  </p>
                  <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                      <div className="space-y-1 text-sm text-foreground/80">
                        <p className="font-medium">Before you apply:</p>
                        <ul className="space-y-1 mt-1">
                          {[
                            {
                              text: 'Complete your profile (name, location, headline)',
                              done: !!(
                                profile?.full_name &&
                                profile?.location &&
                                profile?.headline
                              ),
                            },
                            { text: 'Add your skills', done: (profile?.skills?.length ?? 0) >= 3 },
                            { text: 'Upload your resume', done: !!profile?.resumeUrl },
                            {
                              text: 'Build your CV in CV Builder',
                              done: !!(profile as any)?.cv_summary,
                            },
                          ].map(({ text, done }) => (
                            <li key={text} className="flex items-center gap-2">
                              <CheckCircle2
                                className={`h-3.5 w-3.5 shrink-0 ${done ? 'text-emerald-500' : 'text-muted-foreground/30'}`}
                              />
                              <span className={done ? 'line-through text-muted-foreground' : ''}>
                                {text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <ApplyDialog
                      jobId={id}
                      jobTitle={job.title}
                      companyName={co?.name ?? ''}
                      hasApplied={!!hasApplied}
                    />
                    {!profile?.resumeUrl && (
                      <Button asChild variant="outline" size="sm">
                        <Link to={'/cv-builder' as never}>Build CV first →</Link>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Description */}
            {job.description && (
              <Card className="p-6">
                <Section title="Job description">
                  <div className="prose prose-sm max-w-none text-foreground/90 whitespace-pre-wrap leading-relaxed text-sm">
                    {job.description}
                  </div>
                </Section>
              </Card>
            )}

            {/* Responsibilities */}
            {responsibilities && (
              <Card className="p-6">
                <Section title="Responsibilities">
                  <BulletList text={responsibilities} />
                </Section>
              </Card>
            )}

            {/* Requirements */}
            {requirements && (
              <Card className="p-6">
                <Section title="Requirements & qualifications">
                  <BulletList text={requirements} />
                </Section>
              </Card>
            )}

            {/* About company */}
            {co && (
              <Card className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  {co.logo_url ? (
                    <img
                      src={co.logo_url}
                      alt={co.name}
                      className="h-12 w-12 rounded-xl border border-border object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-accent/10 grid place-items-center font-bold text-accent border border-border shrink-0">
                      {co.name[0]}
                    </div>
                  )}
                  <div>
                    <h2 className="font-display font-semibold flex items-center gap-1.5">
                      {co.name}
                      {co.verified && <BadgeCheck className="h-4 w-4 text-accent" />}
                    </h2>
                    {co.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {co.location}
                      </p>
                    )}
                  </div>
                </div>
                {co.description && (
                  <p className="text-sm text-foreground/80 mb-4">{co.description}</p>
                )}
                <div className="flex gap-2 flex-wrap">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/companies/$id" params={{ id: co.id }}>
                      <Building2 className="h-3.5 w-3.5 mr-1.5" /> View company
                    </Link>
                  </Button>
                  {!isOwner && (
                    <FollowButton targetCompanyId={co.id} targetType="company" size="sm" />
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* ── Right sidebar ────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Sticky apply card */}
            <Card className="p-5 sticky top-20">
              <p className="font-display font-semibold text-lg mb-1">{job.title}</p>
              <p className="text-sm text-muted-foreground mb-3">{co?.name}</p>
              <Separator className="mb-4" />
              <div className="space-y-2.5 text-sm mb-5">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{job.region ?? job.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{job.contract_type}</span>
                </div>
                <div className="flex items-center gap-2 font-semibold">
                  <span className="text-accent">
                    {formatSalary(
                      job.salary_min,
                      job.salary_max,
                      job.currency ?? 'TZS',
                      job.salary_negotiable ?? false,
                    )}
                  </span>
                </div>
                {job.deadline && !isExpired && (
                  <div className="flex items-center gap-2 text-amber-700">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>
                      Deadline:{' '}
                      {new Date(job.deadline).toLocaleDateString('en-TZ', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <ApplyDialog
                  jobId={id}
                  jobTitle={job.title}
                  companyName={co?.name ?? ''}
                  hasApplied={!!hasApplied}
                />
                <Button variant="outline" size="sm" className="w-full" onClick={handleSave}>
                  {isSaved ? (
                    <>
                      <BookmarkCheck className="h-4 w-4 mr-1.5 text-accent" /> Saved
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4 mr-1.5" /> Save job
                    </>
                  )}
                </Button>
              </div>

              {/* Profile match */}
              {user && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium">Your match</p>
                    <span
                      className={`text-xs font-bold ${match.score >= 75 ? 'text-emerald-600' : match.score >= 50 ? 'text-amber-600' : 'text-muted-foreground'}`}
                    >
                      {match.score}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full ${match.score >= 75 ? 'bg-emerald-500' : match.score >= 50 ? 'bg-amber-500' : 'bg-muted-foreground/40'}`}
                      style={{ width: `${match.score}%` }}
                    />
                  </div>
                  <div className="space-y-1">
                    {match.items.map(({ label, ok }) => (
                      <div key={label} className="flex items-center gap-1.5 text-[11px]">
                        <CheckCircle2
                          className={`h-3 w-3 shrink-0 ${ok ? 'text-emerald-500' : 'text-muted-foreground/30'}`}
                        />
                        <span className={ok ? 'text-foreground' : 'text-muted-foreground'}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                  {match.score < 75 && (
                    <Button
                      asChild
                      variant="link"
                      size="sm"
                      className="mt-2 h-auto p-0 text-xs text-accent"
                    >
                      <Link to={'/cv-builder' as never}>Improve your profile →</Link>
                    </Button>
                  )}
                </div>
              )}
            </Card>

            {/* Similar jobs link */}
            <Card className="p-4">
              <p className="text-sm font-medium mb-3">More in {industryLabel(job.industry)}</p>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/jobs" search={{ industry: job.industry } as never}>
                  Browse {industryLabel(job.industry)} jobs{' '}
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Mobile sticky bottom apply bar ───────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-background/95 backdrop-blur-md border-t border-border px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{job.title}</p>
          <p className="text-xs text-muted-foreground truncate">{co?.name}</p>
        </div>
        <ApplyDialog
          jobId={id}
          jobTitle={job.title}
          companyName={co?.name ?? ''}
          hasApplied={!!hasApplied}
        />
      </div>

      {/* ── Report dialog ─────────────────────────────────────────── */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report this job</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose the issue that best describes why this listing should be reviewed.
            </p>
            <div>
              <label htmlFor="report-reason" className="block text-sm font-medium mb-1.5">
                Reason
              </label>
              <select
                id="report-reason"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="scam">Scam / fraudulent</option>
                <option value="fake_salary">Fake salary information</option>
                <option value="suspicious_company">Suspicious company details</option>
                <option value="misleading">Misleading job description</option>
                <option value="duplicate">Duplicate listing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Additional details{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={4}
                placeholder="Describe the issue in more detail…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={reporting || !!existingReport}
              onClick={async () => {
                if (!user) return navigate({ to: '/auth' });
                if (existingReport) return toast.info('You have already reported this job.');
                setReporting(true);
                const { error } = await supabase.from('job_reports').insert({
                  job_id: id,
                  reporter_id: user.id,
                  reason: reportReason,
                  details: reportDetails || null,
                });
                setReporting(false);
                if (error) toast.error(error.message);
                else {
                  toast.success('Report submitted. Our team will review it.');
                  setReportOpen(false);
                }
              }}
            >
              {reporting ? 'Submitting…' : existingReport ? 'Already reported' : 'Submit report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
}
