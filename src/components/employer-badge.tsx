/**
 * EmployerBadge — shows the verified company logo badge on a user's profile.
 * Fetches the user's current verified employer from profiles + companies.
 */
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EmployerBadgeProps {
  userId: string;
  size?: 'sm' | 'md';
}

interface EmployerData {
  current_job_title: string | null;
  current_department: string | null;
  show_employer_badge: boolean;
  companies: {
    id: string;
    name: string;
    logo_url: string | null;
    verified: boolean;
  } | null;
}

export function EmployerBadge({ userId, size = 'md' }: EmployerBadgeProps) {
  const { data } = useQuery({
    queryKey: ['employer-badge', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select(
          'current_job_title,current_department,show_employer_badge,companies:current_company_id(id,name,logo_url,verified)',
        )
        .eq('id', userId)
        .single();
      return data as EmployerData | null;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!data?.companies || !data.show_employer_badge) return null;
  if (!data.companies.verified) return null;

  const co = data.companies;
  const logoSize = size === 'sm' ? 'h-5 w-5' : 'h-7 w-7';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 ${textSize}`}
    >
      {co.logo_url ? (
        <img
          src={co.logo_url}
          alt={co.name}
          className={`${logoSize} rounded-full object-cover border border-white shadow-sm`}
        />
      ) : (
        <div
          className={`${logoSize} rounded-full bg-accent/10 border border-white grid place-items-center text-[10px] font-bold text-accent`}
        >
          {co.name[0]}
        </div>
      )}
      <span className="font-medium text-emerald-800">{co.name}</span>
      <BadgeCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
    </div>
  );
}
