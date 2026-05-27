import * as React from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SiteHeader, SiteFooter } from '@/components/site-chrome';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/lib/auth';
import { timeAgo } from '@/lib/kazi-data';

export const Route = createFileRoute('/admin')({ component: AdminPage });

type JobUpdate = Database['public']['Tables']['jobs']['Update'];
type CompanyUpdate = Database['public']['Tables']['companies']['Update'];
type JobReportUpdate = Database['public']['Tables']['job_reports']['Update'];

function AdminPage() {
  const { user, loading, roles } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdmin = roles.includes('admin');

  React.useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate({ to: '/auth' });
      } else if (!isAdmin) {
        navigate({ to: '/dashboard' });
      }
    }
  }, [user, loading, isAdmin, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const [
        jobsCountRes,
        applicationsCountRes,
        employerCountRes,
        seekerCountRes,
        reportCountRes,
        jobsRes,
        companiesRes,
        reportsRes,
      ] = await Promise.all([
        supabase.from('jobs').select('*', { count: 'exact', head: true }),
        supabase.from('applications').select('*', { count: 'exact', head: true }),
        supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'employer'),
        supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'job_seeker'),
        supabase.from('job_reports').select('*', { count: 'exact', head: true }),
        supabase
          .from('jobs')
          .select(
            'id,title,status,featured,created_at,created_by_role,company_id,companies(id,name,verified),posted_by',
          )
          .order('created_at', { ascending: false })
          .limit(12),
        supabase
          .from('companies')
          .select('id,name,verified,suspended,owner_id,website')
          .order('created_at', { ascending: false })
          .limit(12),
        supabase
          .from('job_reports')
          .select('id,reason,status,details,created_at,job_id,jobs(id,title,companies(name))')
          .order('created_at', { ascending: false })
          .limit(12),
      ]);

      return {
        totalJobs: jobsCountRes.count ?? 0,
        totalApplications: applicationsCountRes.count ?? 0,
        employerCount: employerCountRes.count ?? 0,
        seekerCount: seekerCountRes.count ?? 0,
        reportCount: reportCountRes.count ?? 0,
        jobs: jobsRes.data ?? [],
        companies: companiesRes.data ?? [],
        reports: reportsRes.data ?? [],
      };
    },
  });

  const handleJobAction = async (jobId: string, patch: JobUpdate) => {
    const { error } = await supabase.from('jobs').update(patch).eq('id', jobId);
    if (error) return toast.error(error.message);
    toast.success('Job updated');
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };

  const handleCompanyAction = async (companyId: string, patch: CompanyUpdate) => {
    const { error } = await supabase.from('companies').update(patch).eq('id', companyId);
    if (error) return toast.error(error.message);
    toast.success('Company updated');
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };

  const handleReportAction = async (reportId: string, patch: JobReportUpdate) => {
    const { error } = await supabase.from('job_reports').update(patch).eq('id', reportId);
    if (error) return toast.error(error.message);
    toast.success('Report updated');
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };

  if (loading || isLoading || !user || !isAdmin) return null;

  const summary = data ?? {
    totalJobs: 0,
    totalApplications: 0,
    employerCount: 0,
    seekerCount: 0,
    reportCount: 0,
    jobs: [],
    companies: [],
    reports: [],
  };

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <SiteHeader />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto space-y-10">
          <section className="rounded-3xl border border-border bg-card p-10 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-accent">Admin console</p>
                <h1 className="mt-4 font-display text-4xl font-bold">Talentra platform controls</h1>
                <p className="mt-3 text-muted-foreground max-w-2xl">
                  Review reports, manage employers, and keep the marketplace safe and productive.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Link to="/post-job">Post job</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/dashboard">View dashboard</Link>
                </Button>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Published jobs</p>
              <h2 className="mt-3 text-3xl font-semibold">{summary.totalJobs}</h2>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Active employers</p>
              <h2 className="mt-3 text-3xl font-semibold">{summary.employerCount}</h2>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Job seekers</p>
              <h2 className="mt-3 text-3xl font-semibold">{summary.seekerCount}</h2>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">Open reports</p>
              <h2 className="mt-3 text-3xl font-semibold">{summary.reportCount}</h2>
            </Card>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-semibold">Recent jobs</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Review and moderate the latest published roles.
                  </p>
                </div>
                <Badge variant="secondary">{summary.jobs.length} jobs</Badge>
              </div>

              <div className="mt-6 space-y-4">
                {summary.jobs.length ? (
                  summary.jobs.map((job) => (
                    <div key={job.id} className="rounded-3xl border border-border p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold">{job.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {job.companies?.name} · {job.created_by_role} ·{' '}
                            {timeAgo(job.created_at)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant={job.status === 'published' ? 'secondary' : 'outline'}
                            className="uppercase text-[10px]"
                          >
                            {job.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleJobAction(job.id, {
                                featured: !job.featured,
                              })
                            }
                          >
                            {job.featured ? 'Unfeature' : 'Feature'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleJobAction(job.id, {
                                status: job.status === 'closed' ? 'published' : 'closed',
                              })
                            }
                          >
                            {job.status === 'closed' ? 'Reopen' : 'Close'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-border p-6 text-sm text-muted-foreground">
                    No jobs found yet.
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="font-display text-2xl font-semibold">Employer profiles</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Verify trusted employers and suspend suspicious accounts.
              </p>
              <div className="mt-6 space-y-4">
                {summary.companies.length ? (
                  summary.companies.map((company) => (
                    <div key={company.id} className="rounded-3xl border border-border p-4">
                      <p className="font-semibold">{company.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {company.website ?? 'No website'}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge
                          variant="secondary"
                          className={company.verified ? 'bg-green-100 text-green-800' : undefined}
                        >
                          {company.verified ? 'Verified' : 'Not verified'}
                        </Badge>
                        <Badge variant={company.suspended ? 'destructive' : 'secondary'}>
                          {company.suspended ? 'Suspended' : 'Active'}
                        </Badge>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleCompanyAction(company.id, {
                              verified: !company.verified,
                            })
                          }
                        >
                          {company.verified ? 'Unverify' : 'Verify'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleCompanyAction(company.id, {
                              suspended: !company.suspended,
                            })
                          }
                        >
                          {company.suspended ? 'Unsuspend' : 'Suspend'}
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-border p-6 text-sm text-muted-foreground">
                    No employer profiles available.
                  </div>
                )}
              </div>
            </Card>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-semibold">Recent reports</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Review flagged jobs and mark reports as handled.
                </p>
              </div>
              <Badge variant="secondary">{summary.reports.length} items</Badge>
            </div>

            <div className="mt-6 space-y-4">
              {summary.reports.length ? (
                summary.reports.map((report) => (
                  <div key={report.id} className="rounded-3xl border border-border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">{report.jobs?.title || 'Reported job'}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {report.reason} · {report.jobs?.companies?.name ?? 'Unknown employer'}
                        </p>
                        {report.details ? (
                          <p className="text-sm mt-2 text-foreground/80">"{report.details}"</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={report.status === 'open' ? 'destructive' : 'secondary'}>
                          {report.status}
                        </Badge>
                        {report.status !== 'reviewed' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleReportAction(report.id, {
                                status: 'reviewed',
                              })
                            }
                          >
                            Mark reviewed
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-border p-6 text-sm text-muted-foreground">
                  No new reports at the moment.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
