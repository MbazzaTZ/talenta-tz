/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GripVertical, ExternalLink, Calendar, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type ApplicationWithJob = {
  id: string;
  job_id: string;
  status: Database['public']['Enums']['application_status'];
  created_at: string;
  job?: {
    title: string;
    company?: { name: string } | null;
  };
};

const STATUS_COLUMNS = [
  { id: 'applied', label: 'Applied', color: 'bg-blue-50 border-blue-200' },
  { id: 'under_review', label: 'Under Review', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'shortlisted', label: 'Shortlisted', color: 'bg-purple-50 border-purple-200' },
  { id: 'interview', label: 'Interview', color: 'bg-indigo-50 border-indigo-200' },
  { id: 'offer', label: 'Offer', color: 'bg-green-50 border-green-200' },
  { id: 'hired', label: 'Hired', color: 'bg-emerald-100 border-emerald-300' },
  { id: 'rejected', label: 'Rejected', color: 'bg-red-50 border-red-200' },
] as const;

interface ApplicationCard {
  id: string;
  job_id: string;
  status: string;
  created_at: string;
  job_title?: string;
  company_name?: string;
}

interface KanbanColumn {
  id: string;
  label: string;
  color: string;
  applications: ApplicationCard[];
}

export function ApplicationKanbanBoard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [draggedCard, setDraggedCard] = React.useState<ApplicationCard | null>(null);
  const [columns, setColumns] = React.useState<KanbanColumn[]>([]);

  // Fetch applications
  const applicationsQuery = useQuery({
    queryKey: ['kanban-applications', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('applications')
        .select(
          `
          id,
          job_id,
          status,
          created_at,
          jobs:job_id(
            title,
            companies:company_id(name)
          )
        `
        )
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        return [];
      }

      // Transform and return
      return (data || []).map((app: any) => ({
        id: app.id,
        job_id: app.job_id,
        status: app.status,
        created_at: app.created_at,
        job_title: app.jobs?.title || 'Job',
        company_name: app.jobs?.companies?.name || 'Company',
      }));
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      applicationId,
      newStatus,
    }: {
      applicationId: string;
      newStatus: string;
    }) => {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus as Database['public']['Enums']['application_status'] })
        .eq('id', applicationId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Application status updated');
      queryClient.invalidateQueries({ queryKey: ['kanban-applications', user?.id] });
    },
    onError: () => {
      toast.error('Failed to update application');
    },
  });

  // Build columns from applications
  React.useEffect(() => {
    if (applicationsQuery.data) {
      const newColumns: KanbanColumn[] = STATUS_COLUMNS.map((col) => ({
        id: col.id,
        label: col.label,
        color: col.color,
        applications: applicationsQuery.data.filter((app) => app.status === col.id),
      }));
      setColumns(newColumns);
    }
  }, [applicationsQuery.data]);

  const handleDragStart = (e: React.DragEvent, card: ApplicationCard) => {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    if (draggedCard && draggedCard.status !== targetStatus) {
      updateStatusMutation.mutate({
        applicationId: draggedCard.id,
        newStatus: targetStatus,
      });
    }
    setDraggedCard(null);
  };

  const totalApplications = applicationsQuery.data?.length || 0;
  const stats = {
    applied: columns.find((c) => c.id === 'applied')?.applications.length || 0,
    shortlisted: columns.find((c) => c.id === 'shortlisted')?.applications.length || 0,
    interviews: columns.find((c) => c.id === 'interview')?.applications.length || 0,
    offers: columns.find((c) => c.id === 'offer')?.applications.length || 0,
  };

  return (
    <div className="w-full space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{totalApplications}</div>
          <div className="text-sm text-gray-600">Total Applications</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{stats.shortlisted}</div>
          <div className="text-sm text-gray-600">Shortlisted</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{stats.interviews}</div>
          <div className="text-sm text-gray-600">Interviews</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{stats.offers}</div>
          <div className="text-sm text-gray-600">Offers</div>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {columns.map((column) => (
            <div key={column.id} className="flex flex-col w-80 flex-shrink-0">
              {/* Column Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{column.label}</h3>
                  <Badge variant="outline" className="text-xs">
                    {column.applications.length}
                  </Badge>
                </div>
                <div className="h-1 bg-gradient-to-r rounded-full" 
                  style={{
                    background: column.id === 'applied' ? '#3b82f6' :
                               column.id === 'under_review' ? '#eab308' :
                               column.id === 'shortlisted' ? '#a855f7' :
                               column.id === 'interview' ? '#6366f1' :
                               column.id === 'offer' ? '#22c55e' :
                               column.id === 'hired' ? '#10b981' : '#ef4444'
                  }}
                />
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
                className={`flex-1 rounded-lg border-2 border-dashed transition-colors ${
                  draggedCard && draggedCard.status !== column.id
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                } space-y-3 p-3 min-h-96`}
              >
                {column.applications.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    No applications
                  </div>
                ) : (
                  column.applications.map((app) => (
                    <ApplicationCard
                      key={app.id}
                      card={app}
                      onDragStart={handleDragStart}
                      isDragging={draggedCard?.id === app.id}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {totalApplications === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">No applications yet</div>
          <div className="text-sm text-gray-500">
            Start applying to jobs to track them here
          </div>
        </div>
      )}
    </div>
  );
}

interface ApplicationCardProps {
  card: ApplicationCard;
  onDragStart: (e: React.DragEvent, card: ApplicationCard) => void;
  isDragging: boolean;
}

function ApplicationCard({ card, onDragStart, isDragging }: ApplicationCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, card)}
      className={`rounded-lg border bg-white p-3 cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'hover:shadow-md'
      }`}
    >
      <div className="flex gap-2 items-start">
        <GripVertical className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-gray-900 truncate">{card.job_title}</h4>
          <p className="text-xs text-gray-600 truncate flex items-center gap-1 mt-1">
            <Building2 className="h-3 w-3" />
            {card.company_name}
          </p>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-2">
            <Calendar className="h-3 w-3" />
            {format(new Date(card.created_at), 'MMM d, yyyy')}
          </p>
        </div>
      </div>
    </div>
  );
}
