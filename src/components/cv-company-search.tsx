/**
 * CVCompanySearch — inline company search for work experience entries.
 * When a company is selected from Talentra, auto-creates a company_employee
 * record and notifies the company owner for verification.
 */
import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Building2, BadgeCheck, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface Company {
  id: string;
  name: string;
  location: string | null;
  verified: boolean;
  owner_id: string;
}

interface CVCompanySearchProps {
  value: string; // current company name text
  companyId?: string; // linked company id if any
  verificationStatus: 'none' | 'pending' | 'verified';
  jobTitle: string;
  onSelect: (name: string, id: string) => void;
  onClear: () => void;
  onChange: (name: string) => void;
}

export function CVCompanySearch({
  value,
  companyId,
  verificationStatus,
  jobTitle,
  onSelect,
  onClear,
  onChange,
}: CVCompanySearchProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [requesting, setRequesting] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { data: results } = useQuery({
    queryKey: ['company-search-cv', value],
    enabled: open && value.length >= 2 && !companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from('companies')
        .select('id,name,location,verified,owner_id')
        .ilike('name', `%${value}%`)
        .limit(6);
      return (data ?? []) as Company[];
    },
  });

  const handleSelect = async (co: Company) => {
    onSelect(co.name, co.id);
    setOpen(false);

    if (!user || !jobTitle.trim()) return;

    setRequesting(true);
    try {
      // Create company_employee record (pending verification)
      const { data: empRecord, error } = await (supabase as any)
        .from('company_employees')
        .upsert(
          {
            user_id: user.id,
            company_id: co.id,
            job_title: jobTitle.trim(),
            is_current: true,
            verified: false,
          },
          { onConflict: 'user_id,company_id' },
        )
        .select('id')
        .single();

      if (error) throw error;

      // Get employee's name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Notify company owner
      await (supabase as any).rpc('notify_employment_verification', {
        p_company_owner_id: co.owner_id,
        p_employee_name: profile?.full_name ?? user.email ?? 'Someone',
        p_company_name: co.name,
        p_employee_record_id: empRecord.id,
      });

      toast.success(`Verification request sent to ${co.name}. You'll get a badge once approved.`);
      queryClient.invalidateQueries({ queryKey: ['employee-records', user.id] });
    } catch (e) {
      // Non-critical — company link still saved
      console.warn('Could not send verification request:', e);
    } finally {
      setRequesting(false);
    }
  };

  const statusBadge = {
    none: null,
    pending: (
      <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 gap-0.5">
        <Loader2 className="h-2.5 w-2.5 animate-spin" /> Pending
      </Badge>
    ),
    verified: (
      <Badge className="text-[10px] bg-emerald-100 text-emerald-800 gap-0.5">
        <BadgeCheck className="h-2.5 w-2.5" /> Verified
      </Badge>
    ),
  }[verificationStatus];

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Company name"
            className={companyId ? 'pr-8 border-emerald-300 bg-emerald-50/30' : ''}
          />
          {companyId && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {statusBadge}
        {requesting && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
      </div>

      {/* Company is linked */}
      {companyId && verificationStatus !== 'none' && (
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Building2 className="h-3 w-3" />
          {verificationStatus === 'pending'
            ? 'Awaiting employer verification — badge will appear once approved'
            : 'Verified by employer — badge active on your profile'}
        </p>
      )}

      {/* Dropdown */}
      {open && !companyId && (results?.length ?? 0) > 0 && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 rounded-xl border border-border bg-background shadow-lg overflow-hidden">
          <p className="text-[10px] text-muted-foreground px-3 pt-2 pb-1 font-medium uppercase tracking-wide">
            Talentra companies — select to request verification
          </p>
          {results!.map((co) => (
            <button
              key={co.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(co);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted text-left transition-colors"
            >
              <div className="h-7 w-7 rounded-lg bg-accent/10 grid place-items-center text-xs font-bold text-accent shrink-0">
                {co.name[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{co.name}</p>
                {co.location && <p className="text-xs text-muted-foreground">{co.location}</p>}
              </div>
              {co.verified && <BadgeCheck className="h-4 w-4 text-accent ml-auto shrink-0" />}
            </button>
          ))}
          <p className="text-[10px] text-muted-foreground px-3 py-2 border-t border-border">
            Not listed? Type the company name manually — no verification request will be sent.
          </p>
        </div>
      )}
    </div>
  );
}
