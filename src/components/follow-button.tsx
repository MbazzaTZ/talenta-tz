import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserPlus, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

type FollowTargetType = 'job_seeker' | 'employer' | 'employee' | 'company' | 'agency';

interface FollowButtonProps {
  targetUserId?: string;
  targetCompanyId?: string;
  targetType: FollowTargetType;
  size?: 'sm' | 'default';
}

export function FollowButton({
  targetUserId,
  targetCompanyId,
  targetType,
  size = 'sm',
}: FollowButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = React.useState(false);

  const qKey = ['follow-status', user?.id, targetUserId ?? targetCompanyId];

  const { data: isFollowing } = useQuery({
    queryKey: qKey,
    enabled: !!user && !!(targetUserId ?? targetCompanyId),
    queryFn: async () => {
      const query = (supabase as any).from('follows').select('id').eq('follower_id', user!.id);

      if (targetUserId) query.eq('target_user_id', targetUserId);
      else if (targetCompanyId) query.eq('target_company_id', targetCompanyId);

      const { data } = await query.maybeSingle();
      return !!data;
    },
  });

  // Don't show for own profile
  if (user?.id === targetUserId) return null;

  const handleToggle = async () => {
    if (!user) {
      toast.error('Sign in to follow');
      return;
    }
    setLoading(true);
    try {
      if (isFollowing) {
        const query = (supabase as any).from('follows').delete().eq('follower_id', user.id);
        if (targetUserId) query.eq('target_user_id', targetUserId);
        else if (targetCompanyId) query.eq('target_company_id', targetCompanyId);
        await query;
        toast.success('Unfollowed');
      } else {
        await (supabase as any).from('follows').insert({
          follower_id: user.id,
          target_user_id: targetUserId ?? null,
          target_company_id: targetCompanyId ?? null,
          target_type: targetType,
        });
        toast.success('Following!');
      }
      queryClient.invalidateQueries({ queryKey: qKey });
      queryClient.invalidateQueries({ queryKey: ['follow-counts'] });
    } catch (e) {
      toast.error((e as Error).message || 'Could not update follow');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size={size}
      variant={isFollowing ? 'outline' : 'default'}
      onClick={handleToggle}
      disabled={loading}
      className={isFollowing ? '' : 'bg-accent hover:bg-accent/90 text-accent-foreground'}
    >
      {isFollowing ? (
        <>
          <UserCheck className="h-3.5 w-3.5 mr-1.5" /> Following
        </>
      ) : (
        <>
          <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Follow
        </>
      )}
    </Button>
  );
}
