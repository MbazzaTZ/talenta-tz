/**
 * FollowStats — Instagram-style following/followers counts on a profile.
 * Shows breakdown by target type (companies, employers, employees, seekers, agencies).
 */
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FollowCounts {
  following_total: number;
  following_seekers: number;
  following_employers: number;
  following_employees: number;
  following_companies: number;
  following_agencies: number;
  followers_total: number;
}

interface FollowStatsProps {
  userId: string;
}

export function FollowStats({ userId }: FollowStatsProps) {
  const { data: counts } = useQuery<FollowCounts>({
    queryKey: ['follow-counts', userId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_follow_counts', {
        p_user_id: userId,
      });
      if (error) throw error;
      return data as FollowCounts;
    },
    staleTime: 30_000,
  });

  const c = counts ?? {
    following_total: 0,
    following_seekers: 0,
    following_employers: 0,
    following_employees: 0,
    following_companies: 0,
    following_agencies: 0,
    followers_total: 0,
  };

  const BREAKDOWN = [
    { label: 'Companies', value: c.following_companies },
    { label: 'Employers', value: c.following_employers },
    { label: 'Employees', value: c.following_employees },
    { label: 'Agencies', value: c.following_agencies },
    { label: 'Job seekers', value: c.following_seekers },
  ];

  return (
    <div className="space-y-4">
      {/* Top-level counts — Instagram style */}
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="font-display text-xl font-bold leading-none">{c.following_total}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Following</div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="text-center">
          <div className="font-display text-xl font-bold leading-none">{c.followers_total}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Followers</div>
        </div>
      </div>

      {/* Following breakdown */}
      {c.following_total > 0 && (
        <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Following breakdown
          </p>
          {BREAKDOWN.filter((b) => b.value > 0).map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
