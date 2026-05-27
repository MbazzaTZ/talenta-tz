import * as React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Search, X, SlidersHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { SiteHeader, SiteFooter, MobileBottomNav } from '@/components/site-chrome';
import { JobCard, JobCardSkeleton, type JobCardData } from '@/components/job-card';
import { supabase } from '@/integrations/supabase/client';
import {
  REGIONS,
  INDUSTRIES,
  POSITION_LEVELS,
  CONTRACT_TYPES,
  QUALIFICATIONS,
  SALARY_BANDS,
} from '@/lib/kazi-data';

const PAGE_SIZE = 20;

type JobsSearch = {
  q?: string;
  region?: string;
  industry?: string;
  level?: string;
  contract?: string;
  qualification?: string;
  salary?: string;
};

export const Route = createFileRoute('/jobs')({
  validateSearch: (s: Record<string, unknown>): JobsSearch => ({
    q: typeof s.q === 'string' ? s.q : undefined,
    region: typeof s.region === 'string' ? s.region : undefined,
    industry: typeof s.industry === 'string' ? s.industry : undefined,
    level: typeof s.level === 'string' ? s.level : undefined,
    contract: typeof s.contract === 'string' ? s.contract : undefined,
    qualification: typeof s.qualification === 'string' ? s.qualification : undefined,
    salary: typeof s.salary === 'string' ? s.salary : undefined,
  }),
  component: JobsPage,
});

function JobsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = React.useState(search.q ?? '');
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    setQ(search.q ?? '');
    setPage(1);
  }, [search.q]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [
    search.region,
    search.industry,
    search.level,
    search.contract,
    search.qualification,
    search.salary,
  ]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['jobs', search, page],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select(
          'id,title,location,region,industry,contract_type,salary_min,salary_max,salary_negotiable,currency,created_at,deadline,featured,companies(name,logo_url,verified)',
        )
        .eq('status', 'published')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (search.q) {
        query = query.or(
          `title.ilike.%${search.q}%,location.ilike.%${search.q}%,industry.ilike.%${search.q}%`,
        );
      }
      if (search.region) query = query.eq('region', search.region);
      if (search.industry) query = query.eq('industry', search.industry);
      if (search.level) query = query.eq('position_level', search.level as never);
      if (search.contract) query = query.eq('contract_type', search.contract as never);
      if (search.qualification) query = query.eq('qualification', search.qualification as never);
      if (search.salary) {
        const band = SALARY_BANDS.find((b) => b.value === search.salary);
        if (band?.min) query = query.gte('salary_min', band.min);
        if (band?.max) query = query.lte('salary_max', band.max);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as JobCardData[];
    },
    placeholderData: (prev) => prev,
  });

  const update = (patch: Partial<JobsSearch>) =>
    navigate({ search: (prev: JobsSearch) => ({ ...prev, ...patch }) });
  const clear = () => navigate({ search: {} });
  const activeCount = Object.values(search).filter(Boolean).length;
  const hasMore = (data?.length ?? 0) === PAGE_SIZE;

  const FilterPanel = (
    <div className="space-y-4">
      {[
        {
          label: 'Region',
          value: search.region,
          key: 'region' as const,
          options: REGIONS.map((r) => ({ value: r, label: r })),
        },
        {
          label: 'Industry',
          value: search.industry,
          key: 'industry' as const,
          options: INDUSTRIES.map((i) => ({ value: i.value, label: i.en })),
        },
        {
          label: 'Level',
          value: search.level,
          key: 'level' as const,
          options: POSITION_LEVELS.map((p) => ({ value: p.value, label: p.label })),
        },
        {
          label: 'Contract',
          value: search.contract,
          key: 'contract' as const,
          options: CONTRACT_TYPES.map((c) => ({ value: c.value, label: c.label })),
        },
        {
          label: 'Qualification',
          value: search.qualification,
          key: 'qualification' as const,
          options: QUALIFICATIONS.map((q) => ({ value: q.value, label: q.label })),
        },
        {
          label: 'Salary',
          value: search.salary,
          key: 'salary' as const,
          options: SALARY_BANDS.slice(1).map((b) => ({ value: b.value, label: b.label })),
        },
      ].map(({ label, value, key, options }) => (
        <div key={key}>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
          <Select
            value={value ?? '_all'}
            onValueChange={(v) => update({ [key]: v === '_all' ? undefined : v })}
          >
            <SelectTrigger className="mt-1 h-8 text-sm">
              <SelectValue placeholder={`Any ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Any {label.toLowerCase()}</SelectItem>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}

      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clear}
          className="w-full text-destructive hover:text-destructive"
        >
          <X className="h-3 w-3 mr-1" /> Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <SiteHeader />

      <div className="bg-cream/60 border-b border-border">
        <div className="container mx-auto px-4 py-5">
          <h1 className="font-display text-2xl md:text-3xl font-semibold">Find your next role</h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              update({ q: q || undefined });
            }}
            className="mt-3 flex gap-2 max-w-2xl"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Job title, skill, or company"
                className="pl-9 bg-background h-9 text-sm"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Search
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="md:hidden relative">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {activeCount > 0 && (
                    <Badge className="absolute -top-1.5 -right-1.5 h-4 w-4 p-0 text-[10px] bg-accent text-accent-foreground flex items-center justify-center rounded-full">
                      {activeCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">{FilterPanel}</div>
              </SheetContent>
            </Sheet>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 grid md:grid-cols-[240px_1fr] gap-6">
        <aside className="hidden md:block">
          <div className="sticky top-20 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-sm">Filters</h2>
              {activeCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeCount} active
                </Badge>
              )}
            </div>
            {FilterPanel}
          </div>
        </aside>

        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
                </span>
              ) : (
                `${data?.length ?? 0}${hasMore ? '+' : ''} jobs found`
              )}
            </p>
            {isFetching && !isLoading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="grid gap-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)
            ) : data && data.length > 0 ? (
              <>
                {data.map((j) => (
                  <JobCard key={j.id} job={j} />
                ))}
                {hasMore && (
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={isFetching}
                  >
                    {isFetching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading…
                      </>
                    ) : (
                      'Load more jobs'
                    )}
                  </Button>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-10 text-center">
                <p className="font-display text-lg font-semibold">No jobs match your filters</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try clearing some filters, or be the first to post a job.
                </p>
                <div className="mt-4 flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={clear}>
                    Clear filters
                  </Button>
                  <Button asChild size="sm">
                    <Link to="/post-job">Post a job</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
