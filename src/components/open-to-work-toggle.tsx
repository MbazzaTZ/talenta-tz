import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toggleOpenToWork, getOpenToWorkStatus } from '@/lib/supabase-alerts';
import { useAuth } from '@/lib/auth';

export function OpenToWorkToggle() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch current status
  const statusQuery = useQuery({
    queryKey: ['openToWork', user?.id],
    enabled: !!user?.id,
    queryFn: () => (user?.id ? getOpenToWorkStatus(user.id) : Promise.resolve(false)),
  });

  // Toggle mutation
  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not found');
      const currentStatus = statusQuery.data ?? false;
      return toggleOpenToWork(user.id, !currentStatus);
    },
    onSuccess: (success) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['openToWork', user?.id] });
        const newStatus = !(statusQuery.data ?? false);
        toast.success(
          newStatus ? 'You are now visible to employers!' : 'Your profile is now private'
        );
      } else {
        toast.error('Failed to update profile visibility');
      }
    },
    onError: () => {
      toast.error('Failed to update profile visibility');
    },
  });

  const isOpen = statusQuery.data ?? false;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Open to Work
            </CardTitle>
            <CardDescription>
              {isOpen
                ? 'Your profile is visible to employers looking for candidates'
                : 'Your profile is private. Employers cannot search for you.'}
            </CardDescription>
          </div>
          {isOpen && (
            <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Active
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            When enabled, your profile becomes discoverable to employers searching for qualified
            candidates in your field. This allows for direct recruitment opportunities without
            having to apply to job postings.
          </p>

          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            💡 Tip: Enabling this increases your chances of being contacted by employers and
            recruiters with opportunities that match your skills.
          </div>

          <Button
            onClick={() => toggleMutation.mutate()}
            disabled={toggleMutation.isPending || statusQuery.isLoading}
            variant={isOpen ? 'destructive' : 'default'}
            className="w-full"
          >
            {toggleMutation.isPending ? 'Updating...' : isOpen ? 'Disable Profile Visibility' : 'Make Profile Visible'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
