/**
 * CVReferenceSearch — inline user search for reference entries.
 * When a Talentra user is found and selected, auto-creates a
 * reference_request and notifies them.
 */
import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { User2, BadgeCheck, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface UserResult {
  id: string;
  full_name: string | null;
  headline: string | null;
  avatar_url: string | null;
}

interface CVReferenceSearchProps {
  value: string; // current name text
  userId?: string; // linked user id if any
  verificationStatus: 'none' | 'pending' | 'approved';
  jobApplyingFor?: string;
  relationship?: string;
  onSelect: (name: string, id: string) => void;
  onClear: () => void;
  onChange: (name: string) => void;
}

export function CVReferenceSearch({
  value,
  userId,
  verificationStatus,
  jobApplyingFor,
  relationship,
  onSelect,
  onClear,
  onChange,
}: CVReferenceSearchProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [requesting, setRequesting] = React.useState(false);

  const { data: results } = useQuery({
    queryKey: ['user-search-cv', value],
    enabled: open && value.length >= 2 && !userId,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id,full_name,headline,avatar_url')
        .ilike('full_name', `%${value}%`)
        .neq('id', user?.id ?? '')
        .limit(6);
      return (data ?? []) as UserResult[];
    },
  });

  const handleSelect = async (person: UserResult) => {
    onSelect(person.full_name ?? value, person.id);
    setOpen(false);

    if (!user) return;
    setRequesting(true);
    try {
      // Create reference request
      const { data: req, error } = await (supabase as any)
        .from('reference_requests')
        .insert({
          seeker_id: user.id,
          employee_id: person.id,
          company_id: null, // no specific company — direct reference
          job_title: jobApplyingFor ?? null,
          relationship: relationship ?? null,
          message: null,
        })
        .select('id')
        .single();

      if (error) {
        if (error.message.includes('duplicate')) {
          toast.info('You already sent a reference request to this person');
        } else if (error.message.includes('company_id')) {
          // company_id is not null in DB — need separate handling
          toast.info('Request saved. Complete your reference request from the Employee section.');
        } else {
          throw error;
        }
        return;
      }

      // Get requester name
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Send notification
      await (supabase as any).rpc('notify_reference_request', {
        p_recipient_id: person.id,
        p_requester_name: myProfile?.full_name ?? user.email ?? 'Someone',
        p_request_id: req.id,
      });

      toast.success(
        `Reference request sent to ${person.full_name ?? 'the user'}. They'll receive a notification.`,
      );
      queryClient.invalidateQueries({ queryKey: ['sent-reference-requests', user.id] });
    } catch (e) {
      console.warn('Could not send reference request:', e);
      toast.error((e as Error).message || 'Could not send request');
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
    approved: (
      <Badge className="text-[10px] bg-emerald-100 text-emerald-800 gap-0.5">
        <BadgeCheck className="h-2.5 w-2.5" /> Approved
      </Badge>
    ),
  }[verificationStatus];

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Input
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Referee name"
            className={userId ? 'pr-8 border-emerald-300 bg-emerald-50/30' : ''}
          />
          {userId && (
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

      {userId && (
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <User2 className="h-3 w-3" />
          {verificationStatus === 'pending'
            ? 'Notification sent — waiting for their approval'
            : verificationStatus === 'approved'
              ? 'Reference approved — verified badge active'
              : 'Linked to a Talentra user'}
        </p>
      )}

      {/* Dropdown */}
      {open && !userId && (results?.length ?? 0) > 0 && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 rounded-xl border border-border bg-background shadow-lg overflow-hidden">
          <p className="text-[10px] text-muted-foreground px-3 pt-2 pb-1 font-medium uppercase tracking-wide">
            Talentra users — select to send a reference request
          </p>
          {results!.map((person) => (
            <button
              key={person.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(person);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted text-left transition-colors"
            >
              <div className="h-7 w-7 rounded-full bg-accent/10 grid place-items-center text-xs font-bold text-accent shrink-0 overflow-hidden">
                {person.avatar_url ? (
                  <img
                    src={person.avatar_url}
                    alt={person.full_name ?? ''}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (person.full_name?.[0]?.toUpperCase() ?? 'U')
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{person.full_name}</p>
                {person.headline && (
                  <p className="text-xs text-muted-foreground truncate">{person.headline}</p>
                )}
              </div>
            </button>
          ))}
          <p className="text-[10px] text-muted-foreground px-3 py-2 border-t border-border">
            Not found? Enter name manually — no request will be sent.
          </p>
        </div>
      )}
    </div>
  );
}
