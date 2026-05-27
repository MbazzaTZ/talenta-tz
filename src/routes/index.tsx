import * as React from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Search, MapPin, ArrowRight, BadgeCheck,
  Briefcase, Users, Sparkles, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SiteHeader, SiteFooter, MobileBottomNav } from '@/components/site-chrome';
import { JobCard, JobCardSkeleton, type JobCardData } from '@/components/job-card';
import { supabase } from '@/integrations/supabase/client';
import { REGIONS, INDUSTRIES } from '@/lib/kazi-data';
import { useT, useLang } from '@/lib/i18n';

export const Route = createFileRoute('/')({ component: LandingPage });

const POPULAR_SEARCHES = ['Dar es Salaam', 'ICT', 'NGO', 'Banking', 'Remote', 'Arusha'];

const STATS = [
  { icon: Briefcase, value: '12,500+', label: 'Active jobs' },
  { icon: Users, value: '800+', label: 'Verified employers' },
  { icon: TrendingUp, value: '50k+', label: 'Job seekers' },
  { icon: BadgeCheck, value: '26', label: 'Regions covered' },
];

function LandingPage() {
  const t = useT();
  const { lang } = useLang();
  const navigate = useNavigate();
  const [q, setQ] = React.useState('');
  const [region, setRegion] = React.useState<string>('');

  const { data: featured, isLoading } = useQuery({
    queryKey: ['featured-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select(
          'id,title,location,region,industry,contract_type,salary_min,salary_max,salary_negotiable,currency,created_at,deadline,featured,companies(name,logo_url,verified)',
        )
        .eq('status', 'published')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as unknown as JobCardData[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: '/jobs',
      search: { q: q || undefined, region: region || undefined } as never,
    });
  };

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-cream/60 to-background min-h-[480px]">
        <div className="container mx-auto px-4 py-12 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <Badge variant="secondary" className="bg-cream border border-border text-foreground/80">
              <Sparkles className="h-3 w-3 mr-1 text-accent" /> {t('tagline')}
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05]">
              {t('hero_title_1')}{' '}
              <span className="relative whitespace-nowrap">
                <span className="text-accent">{t('hero_title_2')}</span>
                <span className="absolute -bottom-1 left-0 right-0 h-2 bg-peach/40 -z-10 rounded" />
              </span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
              {t('hero_sub')}
            </p>

            {/* Search bar */}
            <form
              onSubmit={handleSearch}
              className="bg-card border border-border rounded-2xl shadow-sm p-2 flex flex-col sm:flex-row gap-2 relative z-10"
            >
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t('search_title')}
                  className="border-0 shadow-none focus-visible:ring-0 px-0 h-9"
                />
              </div>
              <div className="sm:w-44 flex items-center gap-2 px-3 sm:border-l border-border">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="border-0 shadow-none focus:ring-0 px-0 h-auto text-sm w-full">
                    <SelectValue placeholder={t('search_location')} />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="bg-accent hover:bg-accent/90 text-accent-foreground shrink-0"
              >
                {t('search_btn')}
              </Button>
            </form>

            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
              <span className="text-muted-foreground">Popular:</span>
              {POPULAR_SEARCHES.map((tag) => (
                <Link
                  key={tag}
                  to="/jobs"
                  search={{ q: tag } as never}
                  className="text-foreground/70 hover:text-accent underline-offset-4 hover:underline transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Hero image */}
          <div className="relative hidden md:block">
            <div className="absolute -inset-4 bg-gradient-to-tr from-accent/15 via-peach/15 to-primary/10 rounded-[2rem] blur-2xl" />
            <img
              src="/hero-kazi.jpg"
              alt="Tanzanian professionals — software engineer, finance manager, field engineers, agronomist"
              width={800}
              height={800}
              className="relative rounded-3xl shadow-xl object-cover aspect-square w-full border-4 border-background"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border/60 bg-card">
        <div className="container mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 min-h-[80px]">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-accent/10 grid place-items-center text-accent shrink-0">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="font-display font-bold text-lg leading-none">{value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Industries */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-end justify-between mb-5">
          <h2 className="font-display text-xl md:text-2xl font-semibold">Browse by industry</h2>
          <Link
            to="/jobs"
            className="text-sm text-accent hover:underline inline-flex items-center gap-1"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {INDUSTRIES.slice(0, 8).map((i) => (
            <Link
              key={i.value}
              to="/jobs"
              search={{ industry: i.value } as never}
              className="group rounded-xl border border-border bg-card p-3.5 hover:border-accent/50 hover:shadow-sm transition-all"
            >
              <div className="font-display font-semibold text-sm text-foreground group-hover:text-accent transition-colors">
                {lang === 'sw' ? i.sw : i.en}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {lang === 'sw' ? i.en : i.sw}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured jobs */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-semibold">Latest opportunities</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Fresh listings from Tanzania's top employers
            </p>
          </div>
          <Link
            to="/jobs"
            className="text-sm text-accent hover:underline inline-flex items-center gap-1"
          >
            All jobs <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <JobCardSkeleton key={i} />)
          ) : featured && featured.length > 0 ? (
            featured.map((j) => <JobCard key={j.id} job={j} />)
          ) : (
            <EmptyState />
          )}
        </div>
        {featured && featured.length > 0 && (
          <div className="mt-6 text-center">
            <Button asChild variant="outline">
              <Link to="/jobs">
                Browse all jobs <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-10">
        <div className="rounded-3xl bg-primary text-primary-foreground p-8 md:p-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <Badge className="bg-accent text-accent-foreground mb-3">
              <BadgeCheck className="h-3 w-3 mr-1" /> For employers
            </Badge>
            <h3 className="font-display text-2xl md:text-3xl font-semibold leading-tight">
              Hire the right talent across Tanzania, faster.
            </h3>
            <p className="mt-2 text-primary-foreground/75 text-sm">
              Post your first job free. Reach verified candidates in every region.
            </p>
          </div>
          <div className="flex md:justify-end">
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link to="/post-job">
                Post a job <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="md:col-span-2 rounded-xl border border-dashed border-border p-10 text-center">
      <p className="font-display text-lg font-semibold">No jobs posted yet</p>
      <p className="text-sm text-muted-foreground mt-1">
        Be the first to post — your listing will appear here.
      </p>
      <Button asChild className="mt-4" size="sm">
        <Link to="/post-job">Post a job</Link>
      </Button>
    </div>
  );
}
