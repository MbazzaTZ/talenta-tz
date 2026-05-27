import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { Bookmark, MapPin, Clock, Briefcase, BadgeCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatSalary, industryLabel, timeAgo } from '@/lib/kazi-data';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export type JobCardData = {
  id: string;
  title: string;
  location: string;
  region?: string | null;
  industry: string;
  contract_type: string;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_negotiable?: boolean | null;
  currency?: string | null;
  created_at: string;
  deadline?: string | null;
  featured?: boolean;
  companies?: {
    name: string;
    logo_url?: string | null;
    verified?: boolean | null;
  } | null;
};

export const JobCard = React.memo(function JobCard({ job }: { job: JobCardData }) {
  const co = job.companies;
  const { user } = useAuth();
  const [saved, setSaved] = React.useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Sign in to save jobs');
      return;
    }
    setSaved(true);
    const { error } = await supabase
      .from('saved_jobs')
      .insert({ user_id: user.id, job_id: job.id });
    if (error) {
      if (error.message.includes('duplicate')) {
        toast.info('Already saved');
      } else {
        toast.error('Could not save job');
        setSaved(false);
      }
    } else {
      toast.success('Saved to your list');
    }
  };

  return (
    <Link to="/job/$id" params={{ id: job.id }} className="group block">
      <Card className="p-4 hover:shadow-md hover:border-accent/40 transition-all duration-150">
        <div className="flex gap-3">
          <div className="shrink-0">
            {co?.logo_url ? (
              <img
                src={co.logo_url}
                alt={co.name}
                loading="lazy"
                className="h-11 w-11 rounded-lg object-cover border border-border"
              />
            ) : (
              <div className="h-11 w-11 rounded-lg bg-cream grid place-items-center font-display font-bold text-primary border border-border text-base">
                {co?.name?.[0]?.toUpperCase() ?? 'T'}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-display text-sm font-semibold leading-tight text-foreground group-hover:text-accent transition-colors truncate">
                  {job.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                  {co?.name ?? 'Company'}
                  {co?.verified && <BadgeCheck className="inline h-3 w-3 text-accent shrink-0" />}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSave}
                className={`shrink-0 transition-colors ${saved ? 'text-accent' : 'text-muted-foreground hover:text-accent'}`}
                aria-label="Save job"
              >
                <Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge
                variant="secondary"
                className="bg-cream text-foreground/75 border border-border font-normal text-[11px] px-1.5 py-0"
              >
                <MapPin className="h-2.5 w-2.5 mr-0.5" />
                {job.region ?? job.location}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-cream text-foreground/75 border border-border font-normal text-[11px] px-1.5 py-0"
              >
                <Briefcase className="h-2.5 w-2.5 mr-0.5" />
                {job.contract_type}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-cream text-foreground/75 border border-border font-normal text-[11px] px-1.5 py-0"
              >
                {industryLabel(job.industry)}
              </Badge>
              {job.featured && (
                <Badge className="bg-accent text-accent-foreground text-[11px] px-1.5 py-0">
                  Featured
                </Badge>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground text-xs">
                {formatSalary(
                  job.salary_min,
                  job.salary_max,
                  job.currency ?? 'TZS',
                  job.salary_negotiable ?? false,
                )}
              </span>
              <span className="inline-flex items-center gap-0.5 shrink-0">
                <Clock className="h-2.5 w-2.5" />
                {timeAgo(job.created_at)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
});

export function JobCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex gap-3 animate-pulse">
        <div className="h-11 w-11 rounded-lg bg-muted shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-3/4 bg-muted rounded" />
          <div className="h-3 w-1/3 bg-muted rounded" />
          <div className="flex gap-1.5 mt-2">
            <div className="h-4 w-16 bg-muted rounded" />
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-4 w-14 bg-muted rounded" />
          </div>
          <div className="flex justify-between mt-1">
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-3 w-12 bg-muted rounded" />
          </div>
        </div>
      </div>
    </Card>
  );
}
