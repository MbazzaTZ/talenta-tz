import * as React from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  User2,
  Bookmark,
  FileText,
  Bell,
  MapPin,
  Phone,
  Globe2,
  Pencil,
  ChevronRight,
  Clock,
  BarChart3,
  Send,
  Star,
  Upload,
  X,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SiteHeader, SiteFooter, MobileBottomNav } from '@/components/site-chrome';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/lib/auth';
import {
  fetchSavedJobs,
  fetchUserApplications,
  getUserProfile,
  saveUserProfile,
  uploadResumeFile,
  SeekerProfile,
} from '@/lib/supabase-data';
import { EmployeeProfile } from '@/components/employee-profile';
import { EmployerBadge } from '@/components/employer-badge';
import { AvatarUpload } from '@/components/avatar-upload';
import { FollowStats } from '@/components/follow-stats';
import { ProfilePosts } from '@/components/profile-posts';
import { FollowButton } from '@/components/follow-button';
import { REGIONS } from '@/lib/kazi-data';

export const Route = createFileRoute('/dashboard')({ component: Dashboard });

type EmployerJob = Pick<
  Database['public']['Tables']['jobs']['Row'],
  'id' | 'title' | 'status' | 'created_at'
> & { companies: { name: string } | null };

// ─── Status colour map ────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  applied: 'bg-blue-100 text-blue-800',
  under_review: 'bg-amber-100 text-amber-800',
  shortlisted: 'bg-purple-100 text-purple-800',
  interview: 'bg-indigo-100 text-indigo-800',
  offer: 'bg-emerald-100 text-emerald-800',
  hired: 'bg-emerald-200 text-emerald-900',
  rejected: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  applied: 'Applied',
  under_review: 'Under review',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired 🎉',
  rejected: 'Not selected',
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
function Dashboard() {
  const { user, loading, roles } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!loading && !user) navigate({ to: '/auth' });
  }, [user, loading, navigate]);

  const isEmployer = roles.includes('employer') || roles.includes('admin');

  const { data: profile } = useQuery({
    queryKey: ['supabase-profile', user?.id],
    enabled: !!user?.id,
    queryFn: () => getUserProfile(user!.id),
  });

  if (loading || !user) return null;

  // Display name: full_name > metadata name > email prefix
  const displayName =
    profile?.full_name ||
    (user.user_metadata as Record<string, string> | undefined)?.full_name ||
    user.email?.split('@')[0] ||
    'My Account';

  const roleLabel = roles.includes('admin')
    ? 'Admin'
    : roles.includes('employer')
      ? 'Employer'
      : roles.includes('employee')
        ? 'Employee'
        : 'Job seeker';

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0 bg-background">
      <SiteHeader />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <AvatarUpload
              avatarUrl={profile?.avatarUrl}
              name={displayName}
              size="lg"
              editable={true}
            />
            <div>
              <h1 className="font-display text-2xl font-bold leading-tight">{displayName}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {roleLabel}
                </Badge>
                <EmployerBadge userId={user.id} size="sm" />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/cv-builder">
                <FileText className="h-3.5 w-3.5 mr-1.5" /> CV Builder
              </Link>
            </Button>
            {isEmployer && (
              <Button
                asChild
                size="sm"
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Link to="/post-job">
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Post a job
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="h-10">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">My profile</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="saved">Saved jobs</TabsTrigger>
            <TabsTrigger value="employee">Employee</TabsTrigger>
            {isEmployer && <TabsTrigger value="employer">Employer</TabsTrigger>}
          </TabsList>

          {/* Overview tab */}
          <TabsContent value="overview">
            <OverviewTab
              user={user}
              profile={profile ?? null}
              roles={roles}
              isEmployer={isEmployer}
              refetch={() =>
                queryClient.invalidateQueries({ queryKey: ['supabase-profile', user.id] })
              }
            />
          </TabsContent>

          {/* Profile tab */}
          <TabsContent value="profile">
            <ProfileTab
              user={user}
              profile={profile ?? null}
              onSave={() =>
                queryClient.invalidateQueries({ queryKey: ['supabase-profile', user.id] })
              }
            />
          </TabsContent>

          {/* Applications tab */}
          <TabsContent value="applications">
            <ApplicationsTab userId={user.id} />
          </TabsContent>

          {/* Saved jobs tab */}
          <TabsContent value="saved">
            <SavedJobsTab userId={user.id} />
          </TabsContent>

          {/* Employee tab */}
          <TabsContent value="employee">
            <EmployeeProfile />
          </TabsContent>

          {/* Employer tab */}
          {isEmployer && (
            <TabsContent value="employer">
              <EmployerView userId={user.id} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({
  user,
  profile,
  roles,
  isEmployer,
  refetch,
}: {
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> };
  profile: SeekerProfile | null;
  roles: string[];
  isEmployer: boolean;
  refetch: () => void;
}) {
  const { data: applications } = useQuery({
    queryKey: ['supabase-applications', user.id],
    queryFn: () => fetchUserApplications(user.id),
    enabled: !!user.id,
  });
  const { data: savedJobs } = useQuery({
    queryKey: ['supabase-saved-jobs', user.id],
    queryFn: () => fetchSavedJobs(user.id),
    enabled: !!user.id,
  });

  // Profile completion
  const completionItems = [
    { label: 'Full name', done: !!profile?.full_name },
    { label: 'Headline', done: !!profile?.headline },
    { label: 'Bio', done: !!profile?.bio },
    { label: 'Phone', done: !!profile?.phone },
    { label: 'Location', done: !!profile?.location },
    { label: 'Skills (3+)', done: (profile?.skills?.length ?? 0) >= 3 },
    { label: 'Resume', done: !!profile?.resumeUrl },
  ];
  const completionPct = Math.round(
    (completionItems.filter((i) => i.done).length / completionItems.length) * 100,
  );

  const recentApps = applications?.slice(0, 3) ?? [];

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Left column */}
      <div className="lg:col-span-2 space-y-5">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Send, value: applications?.length ?? 0, label: 'Applied' },
            { icon: Bookmark, value: savedJobs?.length ?? 0, label: 'Saved' },
            {
              icon: Star,
              value: applications?.filter((a) => a.status === 'shortlisted').length ?? 0,
              label: 'Shortlisted',
            },
          ].map(({ icon: Icon, value, label }) => (
            <Card key={label} className="p-4 text-center">
              <Icon className="h-5 w-5 text-accent mx-auto mb-1" />
              <div className="font-display text-2xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </Card>
          ))}
        </div>

        {/* Recent applications */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold">Recent applications</h3>
            <Button asChild variant="ghost" size="sm" className="text-accent h-7">
              <Link to="/dashboard" search={{ tab: 'applications' } as never}>
                View all
              </Link>
            </Button>
          </div>
          {recentApps.length > 0 ? (
            <div className="space-y-3">
              {recentApps.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{app.jobTitle}</p>
                    <p className="text-xs text-muted-foreground">{app.companyName}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[app.status] ?? 'bg-muted text-muted-foreground'}`}
                  >
                    {STATUS_LABELS[app.status] ?? app.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <Briefcase className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No applications yet</p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to="/jobs">Browse jobs</Link>
              </Button>
            </div>
          )}
        </Card>

        {/* Posts feed */}
        <ProfilePosts
          profileUserId={user.id}
          isOwner={true}
          ownerName={profile?.full_name || user.email?.split('@')[0] || 'Me'}
          ownerAvatarUrl={profile?.avatarUrl}
        />

        {/* Profile incomplete warning */}
        {completionPct < 80 && (
          <Card className="p-5 border-amber-200 bg-amber-50/50">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-amber-900">Complete your profile</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {completionPct}% done — employers are {100 - completionPct}% less likely to
                  contact incomplete profiles.
                </p>
                <div className="mt-3 space-y-1.5">
                  {completionItems
                    .filter((i) => !i.done)
                    .map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-2 text-xs text-amber-800"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                        {item.label} missing
                      </div>
                    ))}
                </div>
                <Button
                  asChild
                  size="sm"
                  className="mt-3 bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Link to="/dashboard">Complete profile →</Link>
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Right column */}
      <div className="space-y-5">
        {/* Profile card */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <AvatarUpload
              avatarUrl={profile?.avatarUrl}
              name={profile?.full_name ?? 'U'}
              size="sm"
            />
            <div>
              <p className="font-semibold text-sm">{profile?.full_name || 'Add your name'}</p>
              <p className="text-xs text-muted-foreground">
                {profile?.headline || 'Add a headline'}
              </p>
            </div>
          </div>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            {profile?.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 shrink-0" /> {profile.location}
              </div>
            )}
            {profile?.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 shrink-0" /> {profile.phone}
              </div>
            )}
            {profile?.portfolioUrl && (
              <div className="flex items-center gap-1.5">
                <Globe2 className="h-3 w-3 shrink-0" />
                <a
                  href={profile.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline truncate"
                >
                  Portfolio
                </a>
              </div>
            )}
          </div>
          {/* Completion ring */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium">Profile strength</span>
              <span className="text-xs text-muted-foreground">{completionPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${completionPct >= 80 ? 'bg-emerald-500' : completionPct >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-4 w-full">
            <Link to="/dashboard">
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit profile
            </Link>
          </Button>
        </Card>

        {/* Follow stats */}
        <Card className="p-5">
          <FollowStats userId={user.id} />
        </Card>

        {/* Email verification */}
        <VerificationCard user={user} profile={profile} />

        {/* Quick links */}
        <Card className="p-5">
          <h3 className="font-display font-semibold text-sm mb-3">Quick links</h3>
          <div className="space-y-1">
            {[
              { label: 'CV Builder', to: '/cv-builder', icon: FileText },
              { label: 'Browse jobs', to: '/jobs', icon: Briefcase },
            ].map(({ label, to, icon: Icon }) => (
              <Link
                key={label}
                to={to as never}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {label}
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Verification Card ────────────────────────────────────────────────────────
function VerificationCard({
  user,
  profile,
}: {
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> };
  profile: SeekerProfile | null;
}) {
  const verified =
    profile?.verified ||
    (user.user_metadata as Record<string, boolean> | undefined)?.email_confirmed;

  const sendVerification = async () => {
    if (!user.email) return;
    const { error } = await supabase.auth.resend({ type: 'signup', email: user.email });
    if (error) toast.error(error.message);
    else toast.success('Verification email sent. Check your inbox.');
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck
            className={`h-5 w-5 ${verified ? 'text-emerald-500' : 'text-muted-foreground/40'}`}
          />
          <div>
            <p className="text-sm font-medium">Email verified</p>
            <p className="text-xs text-muted-foreground">
              {verified ? 'Account is verified' : 'Verify to build trust'}
            </p>
          </div>
        </div>
        {verified ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
        ) : (
          <Badge variant="outline" className="text-xs">
            Pending
          </Badge>
        )}
      </div>
      {!verified && (
        <Button onClick={sendVerification} size="sm" variant="outline" className="mt-3 w-full">
          Send verification email
        </Button>
      )}
    </Card>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab({
  user,
  profile,
  onSave,
}: {
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> };
  profile: SeekerProfile | null;
  onSave: () => void;
}) {
  const metaName = (user.user_metadata as Record<string, string> | undefined)?.full_name ?? '';
  const metaPhone = (user.user_metadata as Record<string, string> | undefined)?.phone ?? '';

  const [fullName, setFullName] = React.useState(profile?.full_name || metaName || '');
  const [headline, setHeadline] = React.useState(profile?.headline ?? '');
  const [phone, setPhone] = React.useState(profile?.phone || metaPhone || '');
  const [location, setLocation] = React.useState(profile?.location ?? '');
  const [bio, setBio] = React.useState(profile?.bio ?? '');
  const [portfolioUrl, setPortfolioUrl] = React.useState(profile?.portfolioUrl ?? '');
  const [skillInput, setSkillInput] = React.useState('');
  const [skills, setSkills] = React.useState<string[]>(profile?.skills ?? []);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!profile) return;
    if (profile.full_name) setFullName(profile.full_name);
    if (profile.phone) setPhone(profile.phone);
    if (profile.headline) setHeadline(profile.headline);
    if (profile.location) setLocation(profile.location);
    if (profile.bio) setBio(profile.bio);
    if (profile.portfolioUrl) setPortfolioUrl(profile.portfolioUrl);
    if (profile.skills?.length) setSkills(profile.skills);
  }, [profile]);

  const completionItems = [
    { label: 'Full name', done: !!fullName },
    { label: 'Headline', done: !!headline },
    { label: 'Bio', done: !!bio },
    { label: 'Phone', done: !!phone },
    { label: 'Location', done: !!location },
    { label: 'Skills (3+)', done: skills.length >= 3 },
    { label: 'Resume', done: !!profile?.resumeUrl },
  ];
  const completionPct = Math.round(
    (completionItems.filter((i) => i.done).length / completionItems.length) * 100,
  );

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s || skills.includes(s)) return;
    setSkills([...skills, s]);
    setSkillInput('');
  };

  const saveProfile = async () => {
    if (!fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    setBusy(true);
    try {
      await saveUserProfile(user.id, {
        full_name: fullName.trim(),
        headline,
        bio,
        location,
        phone,
        portfolioUrl,
        skills,
      });
      toast.success('Profile saved');
      onSave();
    } catch (e) {
      toast.error((e as Error).message || 'Unable to save profile');
    } finally {
      setBusy(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      await uploadResumeFile(user.id, file);
      toast.success('Resume uploaded');
      onSave();
    } catch (err) {
      toast.error((err as Error).message || 'Upload failed');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5">
        {/* Personal info */}
        <Card className="p-6">
          <h3 className="font-display font-semibold mb-5">Personal information</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Full name *</Label>
              <Input
                className="mt-1"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Amina Juma"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                className="mt-1"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+255 7XX XXX XXX"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Professional headline</Label>
              <Input
                className="mt-1"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Senior Software Engineer with 5 years in fintech"
                maxLength={150}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{headline.length}/150</p>
            </div>
            <div>
              <Label>Location / Region</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your region" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Portfolio / Website</Label>
              <Input
                className="mt-1"
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Professional bio</Label>
              <Textarea
                className="mt-1"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Summarize your experience, strengths, and career goals..."
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{bio.length}/500</p>
            </div>
          </div>
        </Card>

        {/* Skills */}
        <Card className="p-6">
          <h3 className="font-display font-semibold mb-4">Skills</h3>
          <div className="flex gap-2">
            <Input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="Type a skill and press Enter"
            />
            <Button type="button" variant="secondary" size="sm" onClick={addSkill}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {skills.map((s) => (
              <Badge key={s} variant="secondary" className="gap-1 pr-1.5">
                {s}
                <button
                  onClick={() => setSkills(skills.filter((x) => x !== s))}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {skills.length === 0 && (
              <p className="text-sm text-muted-foreground">No skills added yet</p>
            )}
          </div>
        </Card>

        {/* Resume */}
        <Card className="p-6">
          <h3 className="font-display font-semibold mb-4">Resume / CV</h3>
          {profile?.resumeUrl ? (
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm font-medium">Resume uploaded</p>
                  <a
                    href={profile.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-accent hover:underline"
                  >
                    View file ↗
                  </a>
                </div>
              </div>
              <Label htmlFor="resume-upload" className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-3.5 w-3.5 mr-1.5" /> Replace
                  </span>
                </Button>
              </Label>
            </div>
          ) : (
            <Label htmlFor="resume-upload" className="cursor-pointer">
              <div className="rounded-xl border-2 border-dashed border-border p-8 text-center hover:border-accent/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-medium">Upload your resume</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX — max 5 MB</p>
              </div>
            </Label>
          )}
          <input
            id="resume-upload"
            type="file"
            accept=".pdf,.doc,.docx"
            className="sr-only"
            onChange={handleResumeUpload}
          />
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Or{' '}
              <Link to={'/cv-builder' as never} className="text-accent hover:underline">
                build a CV with our CV builder →
              </Link>
            </p>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={saveProfile}
            disabled={busy}
            className="bg-accent hover:bg-accent/90 text-accent-foreground px-8"
          >
            {busy ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <Card className="p-5 sticky top-20">
          <h3 className="font-display font-semibold text-sm mb-4">Profile strength</h3>
          <div className="flex items-center gap-3 mb-3">
            <div className="relative h-16 w-16 shrink-0">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-muted"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  strokeWidth="3"
                  stroke={
                    completionPct >= 80 ? '#10b981' : completionPct >= 50 ? '#f59e0b' : '#ef4444'
                  }
                  strokeDasharray={`${completionPct} ${100 - completionPct}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                {completionPct}%
              </span>
            </div>
            <div>
              <p className="font-semibold text-sm">
                {completionPct >= 80
                  ? 'Strong profile'
                  : completionPct >= 50
                    ? 'Getting there'
                    : 'Needs work'}
              </p>
              <p className="text-xs text-muted-foreground">
                {completionItems.filter((i) => !i.done).length} items missing
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {completionItems.map(({ label, done }) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <CheckCircle2
                  className={`h-3.5 w-3.5 shrink-0 ${done ? 'text-emerald-500' : 'text-muted-foreground/30'}`}
                />
                <span className={done ? 'text-foreground' : 'text-muted-foreground line-through'}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Applications Tab ─────────────────────────────────────────────────────────
function ApplicationsTab({ userId }: { userId: string }) {
  const { data: applications, isLoading } = useQuery({
    queryKey: ['supabase-applications', userId],
    queryFn: () => fetchUserApplications(userId),
  });

  if (isLoading)
    return (
      <div className="space-y-3 mt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );

  if (!applications?.length)
    return (
      <div className="mt-8 rounded-xl border border-dashed border-border p-12 text-center">
        <Briefcase className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="font-display font-semibold">No applications yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Start applying to jobs to track them here.
        </p>
        <Button asChild className="mt-4 bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link to="/jobs">Browse jobs</Link>
        </Button>
      </div>
    );

  return (
    <div className="mt-4 space-y-3">
      {applications.map((app) => (
        <Card key={app.id} className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{app.jobTitle}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{app.companyName}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                {new Date(app.created_at).toLocaleDateString('en-TZ', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[app.status] ?? 'bg-muted text-muted-foreground'}`}
            >
              {STATUS_LABELS[app.status] ?? app.status}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Saved Jobs Tab ───────────────────────────────────────────────────────────
function SavedJobsTab({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const { data: savedJobs, isLoading } = useQuery({
    queryKey: ['supabase-saved-jobs', userId],
    queryFn: () => fetchSavedJobs(userId),
  });

  const removeSaved = async (savedId: string) => {
    await supabase.from('saved_jobs').delete().eq('id', savedId);
    queryClient.invalidateQueries({ queryKey: ['supabase-saved-jobs', userId] });
    toast.success('Removed from saved jobs');
  };

  if (isLoading)
    return (
      <div className="space-y-3 mt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );

  if (!savedJobs?.length)
    return (
      <div className="mt-8 rounded-xl border border-dashed border-border p-12 text-center">
        <Bookmark className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="font-display font-semibold">No saved jobs</p>
        <p className="text-sm text-muted-foreground mt-1">
          Bookmark jobs you like to revisit them here.
        </p>
        <Button asChild className="mt-4 bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link to="/jobs">Browse jobs</Link>
        </Button>
      </div>
    );

  return (
    <div className="mt-4 space-y-3">
      {savedJobs.map((job) => (
        <Card key={job.id} className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <Link
                to="/jobs/$id"
                params={{ id: job.job_id }}
                className="font-semibold text-sm hover:text-accent transition-colors truncate block"
              >
                {job.jobTitle}
              </Link>
              <p className="text-xs text-muted-foreground">{job.companyName}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                <Link to="/job/$id" params={{ id: job.job_id }}>
                  View
                </Link>
              </Button>
              <button
                onClick={() => removeSaved(job.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Remove"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Employer View ────────────────────────────────────────────────────────────
function EmployerView({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  const { data: pendingEmployees } = useQuery({
    queryKey: ['pending-employees', userId],
    queryFn: async () => {
      const { data: companies } = await supabase
        .from('companies')
        .select('id,name,logo_url')
        .eq('owner_id', userId);
      if (!companies?.length) return [];
      const companyIds = companies.map((c: { id: string }) => c.id);
      const { data } = await (supabase as any)
        .from('company_employees')
        .select(
          'id,user_id,job_title,department,verified,company_id,profiles!user_id(full_name,headline)',
        )
        .in('company_id', companyIds)
        .order('verified', { ascending: true });
      return (data ?? []).map((e: any) => ({
        ...e,
        companyName: companies.find((c: any) => c.id === e.company_id)?.name ?? '',
      }));
    },
  });

  const { data: jobs } = useQuery({
    queryKey: ['employer-jobs', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('jobs')
        .select('id,title,status,created_at,companies(name)')
        .eq('posted_by', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      return (data ?? []) as EmployerJob[];
    },
  });

  const handleVerifyEmployee = async (employeeId: string, verify: boolean) => {
    await (supabase as any)
      .from('company_employees')
      .update({ verified: verify })
      .eq('id', employeeId);
    toast.success(verify ? 'Employee verified — badge awarded!' : 'Verification removed');
    queryClient.invalidateQueries({ queryKey: ['pending-employees', userId] });
  };

  return (
    <div className="mt-4 space-y-5">
      {/* Employee verification */}
      {(pendingEmployees?.length ?? 0) > 0 && (
        <Card className="p-5">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" /> Employee verification
          </h3>
          <div className="space-y-3">
            {pendingEmployees!.map((emp: any) => (
              <div
                key={emp.id}
                className="flex items-center justify-between rounded-xl border border-border p-3 gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm">{emp.profiles?.full_name ?? 'User'}</p>
                  <p className="text-xs text-muted-foreground">
                    {emp.job_title}
                    {emp.department ? ` · ${emp.department}` : ''} at {emp.companyName}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {emp.verified ? (
                    <>
                      <Badge className="bg-emerald-100 text-emerald-800 text-xs">Verified</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleVerifyEmployee(emp.id, false)}
                      >
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
                        onClick={() => handleVerifyEmployee(emp.id, true)}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Verify
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Job listings */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-accent" /> Your job listings
          </h3>
          <Button
            asChild
            size="sm"
            className="bg-accent hover:bg-accent/90 text-accent-foreground h-7"
          >
            <Link to="/post-job">Post new job</Link>
          </Button>
        </div>
        {jobs?.length ? (
          <div className="space-y-2">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between rounded-xl border border-border p-3 gap-3"
              >
                <div className="min-w-0">
                  <Link
                    to="/job/$id"
                    params={{ id: job.id }}
                    className="font-medium text-sm hover:text-accent transition-colors block truncate"
                  >
                    {job.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">{job.companies?.name}</p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs shrink-0 ${job.status === 'published' ? 'border-emerald-300 text-emerald-700' : ''}`}
                >
                  {job.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">No job listings yet.</p>
            <Button
              asChild
              size="sm"
              className="mt-3 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Link to="/post-job">Post your first job</Link>
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
