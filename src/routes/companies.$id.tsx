import * as React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  Globe,
  BadgeCheck,
  Users,
  Briefcase,
  Building2,
  ExternalLink,
  Edit2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { SiteHeader, SiteFooter, MobileBottomNav } from '@/components/site-chrome';
import { JobCard, type JobCardData } from '@/components/job-card';
import { supabase } from '@/integrations/supabase/client';
import { RequestReference } from '@/components/request-reference';
import { FollowButton } from '@/components/follow-button';
import { CompanyPosts } from '@/components/company-posts';
import { industryLabel } from '@/lib/kazi-data';
import { useAuth } from '@/lib/auth';

export const Route = createFileRoute('/companies/$id')({ component: CompanyPage });

function CompanyPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();

  const { data: co, isLoading } = useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      const { data } = await supabase.from('companies').select('*').eq('id', id).maybeSingle();
      return data;
    },
  });

  const { data: jobs } = useQuery({
    queryKey: ['company-jobs', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('jobs')
        .select(
          'id,title,location,region,industry,contract_type,salary_min,salary_max,salary_negotiable,currency,created_at,deadline,featured,companies(name,logo_url,verified)',
        )
        .eq('company_id', id)
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      return (data ?? []) as unknown as JobCardData[];
    },
  });

  const { data: followerCount } = useQuery({
    queryKey: ['company-followers', id],
    queryFn: async () => {
      const { data } = await (supabase as any).rpc('get_company_follower_count', {
        p_company_id: id,
      });
      return (data as number) ?? 0;
    },
  });

  const { data: verifiedEmployees } = useQuery({
    queryKey: ['company-verified-employees', id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('company_employees')
        .select('id,job_title,department,profiles!user_id(full_name,headline,avatar_url)')
        .eq('company_id', id)
        .eq('verified', true)
        .eq('is_current', true)
        .limit(12);
      return (data ?? []) as Array<{
        id: string;
        job_title: string;
        department: string | null;
        profiles: {
          full_name: string | null;
          headline: string | null;
          avatar_url: string | null;
        } | null;
      }>;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="animate-pulse">
          <div className="h-48 bg-muted" />
          <div className="container mx-auto px-4 py-8 max-w-5xl space-y-4">
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="h-4 w-48 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!co) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="container mx-auto px-4 py-20 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="font-display text-2xl">Company not found</h1>
          <Button asChild className="mt-4">
            <Link to="/jobs">Browse jobs</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === co.owner_id;

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <SiteHeader />

      {/* ── Hero banner ──────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary via-primary/90 to-accent/60 text-primary-foreground">
        <div className="container mx-auto px-4 py-10 max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            {/* Logo */}
            <div className="shrink-0">
              {co.logo_url ? (
                <img
                  src={co.logo_url}
                  alt={co.name}
                  className="h-24 w-24 rounded-2xl border-4 border-background/30 object-cover shadow-lg"
                />
              ) : (
                <div className="h-24 w-24 rounded-2xl bg-background/10 border-4 border-background/20 grid place-items-center font-display font-bold text-4xl shadow-lg">
                  {co.name[0]}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-3xl font-bold flex items-center gap-2 flex-wrap">
                {co.name}
                {co.verified && <BadgeCheck className="h-6 w-6 text-accent" />}
              </h1>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-primary-foreground/80">
                {co.industry && (
                  <Badge className="bg-accent/80 text-accent-foreground">
                    {industryLabel(co.industry)}
                  </Badge>
                )}
                {co.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {co.location}
                  </span>
                )}
                {co.employees_count && (
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> {co.employees_count} employees
                  </span>
                )}
                {co.website && (
                  <a
                    href={co.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {isOwner ? (
                <Button
                  asChild
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Link to={'/employer-dashboard' as never}>
                    <Edit2 className="h-4 w-4 mr-1.5" /> Manage
                  </Link>
                </Button>
              ) : (
                <>
                  <FollowButton targetCompanyId={id} targetType="company" />
                  <RequestReference companyId={id} companyName={co.name} />
                </>
              )}
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex gap-6 mt-6 pt-5 border-t border-white/10 text-sm">
            <div className="text-center">
              <div className="font-display font-bold text-xl">{jobs?.length ?? 0}</div>
              <div className="text-primary-foreground/60 text-xs">Open jobs</div>
            </div>
            <div className="text-center">
              <div className="font-display font-bold text-xl">{followerCount ?? 0}</div>
              <div className="text-primary-foreground/60 text-xs">Followers</div>
            </div>
            <div className="text-center">
              <div className="font-display font-bold text-xl">{verifiedEmployees?.length ?? 0}</div>
              <div className="text-primary-foreground/60 text-xs">Verified staff</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Tabs defaultValue="overview">
          <TabsList className="h-10 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="jobs">Jobs {jobs?.length ? `(${jobs.length})` : ''}</TabsTrigger>
            <TabsTrigger value="people">People</TabsTrigger>
          </TabsList>

          {/* ── Overview ───────────────────────────────────────── */}
          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
              <div className="space-y-5">
                {/* About */}
                {co.description && (
                  <Card className="p-6">
                    <h2 className="font-display font-semibold mb-3">About {co.name}</h2>
                    <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
                      {co.description}
                    </p>
                  </Card>
                )}

                {/* Latest jobs */}
                {(jobs?.length ?? 0) > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-display font-semibold">Latest openings</h2>
                      {(jobs?.length ?? 0) > 3 && (
                        <button
                          onClick={() =>
                            document
                              .querySelector('[data-value="jobs"]')
                              ?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
                          }
                          className="text-sm text-accent hover:underline"
                        >
                          View all {jobs?.length} →
                        </button>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      {jobs!.slice(0, 4).map((j) => (
                        <JobCard key={j.id} job={j} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Company details */}
                <Card className="p-5">
                  <h3 className="font-display font-semibold text-sm mb-3">Company details</h3>
                  <div className="space-y-2.5 text-sm">
                    {co.industry && (
                      <div className="flex items-start gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <span>{industryLabel(co.industry)}</span>
                      </div>
                    )}
                    {co.location && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <span>{co.location}</span>
                      </div>
                    )}
                    {co.employees_count && (
                      <div className="flex items-start gap-2">
                        <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <span>{co.employees_count} employees</span>
                      </div>
                    )}
                    {co.website && (
                      <div className="flex items-start gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <a
                          href={co.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent hover:underline truncate"
                        >
                          {co.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Verified employees preview */}
                {(verifiedEmployees?.length ?? 0) > 0 && (
                  <Card className="p-5">
                    <h3 className="font-display font-semibold text-sm mb-3">
                      Verified staff ({verifiedEmployees!.length})
                    </h3>
                    <div className="space-y-2.5">
                      {verifiedEmployees!.slice(0, 5).map((emp) => (
                        <div key={emp.id} className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-accent/10 grid place-items-center shrink-0 overflow-hidden">
                            {emp.profiles?.avatar_url ? (
                              <img
                                src={emp.profiles.avatar_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-bold text-accent">
                                {emp.profiles?.full_name?.[0]?.toUpperCase() ?? 'U'}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">
                              {emp.profiles?.full_name}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {emp.job_title}
                            </p>
                          </div>
                          <BadgeCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── Posts ──────────────────────────────────────────── */}
          <TabsContent value="posts">
            <CompanyPosts
              companyId={id}
              companyName={co.name}
              companyLogoUrl={co.logo_url}
              isOwner={isOwner}
            />
          </TabsContent>

          {/* ── Jobs ───────────────────────────────────────────── */}
          <TabsContent value="jobs">
            {jobs?.length ? (
              <div className="grid md:grid-cols-2 gap-3">
                {jobs.map((j) => (
                  <JobCard key={j.id} job={j} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <Briefcase className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-display font-semibold">No open roles right now</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Follow this company to be notified when they hire.
                </p>
                {!isOwner && (
                  <div className="mt-4">
                    <FollowButton targetCompanyId={id} targetType="company" />
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── People ─────────────────────────────────────────── */}
          <TabsContent value="people">
            {(verifiedEmployees?.length ?? 0) > 0 ? (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {verifiedEmployees!.map((emp) => (
                  <Card key={emp.id} className="p-4 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-accent/10 grid place-items-center overflow-hidden shrink-0">
                      {emp.profiles?.avatar_url ? (
                        <img
                          src={emp.profiles.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-bold text-lg text-accent">
                          {emp.profiles?.full_name?.[0]?.toUpperCase() ?? 'U'}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{emp.profiles?.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {emp.job_title}
                        {emp.department ? ` · ${emp.department}` : ''}
                      </p>
                      {emp.profiles?.headline && (
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {emp.profiles.headline}
                        </p>
                      )}
                    </div>
                    <BadgeCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-12 text-center">
                <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-display font-semibold">No verified staff yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Employees who add this company to their CV and get verified will appear here.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
