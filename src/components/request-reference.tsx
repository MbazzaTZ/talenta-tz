/**
 * RequestReference — lets a job seeker browse verified employees at a company
 * and send them a reference request.
 */
import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Users, Star, BadgeCheck, Send, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface Employee {
  id: string;
  user_id: string;
  job_title: string;
  department: string | null;
  profiles: { full_name: string | null; headline: string | null } | null;
}

interface SentRequest {
  id: string;
  employee_id: string;
  company_id: string;
  status: string;
  recommendation: string | null;
  rating: number | null;
  requested_at: string;
  company_employees: {
    job_title: string;
    profiles: { full_name: string | null } | null;
  } | null;
  companies: { name: string } | null;
}

interface RequestReferenceProps {
  companyId: string;
  companyName: string;
}

export function RequestReference({ companyId, companyName }: RequestReferenceProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null);
  const [jobTitle, setJobTitle] = React.useState('');
  const [relationship, setRelationship] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [sending, setSending] = React.useState(false);

  // Verified employees at this company
  const { data: employees } = useQuery({
    queryKey: ['company-verified-employees', companyId],
    enabled: open && !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from('company_employees')
        .select('id,user_id,job_title,department,profiles!user_id(full_name,headline)')
        .eq('company_id', companyId)
        .eq('verified', true)
        .eq('is_current', true)
        .neq('user_id', user?.id ?? '');
      return (data ?? []) as Employee[];
    },
  });

  // Already sent requests for this company
  const { data: existingRequests } = useQuery({
    queryKey: ['sent-references-company', user?.id, companyId],
    enabled: !!user && open,
    queryFn: async () => {
      const { data } = await supabase
        .from('reference_requests')
        .select('id,employee_id,company_id,status,recommendation,rating,requested_at')
        .eq('seeker_id', user!.id)
        .eq('company_id', companyId);
      return (data ?? []) as SentRequest[];
    },
  });

  const handleSend = async () => {
    if (!user || !selectedEmployee) return;
    setSending(true);
    try {
      const { error } = await (supabase as any).from('reference_requests').insert({
        seeker_id: user.id,
        employee_id: selectedEmployee.user_id,
        company_id: companyId,
        job_title: jobTitle.trim() || null,
        relationship: relationship.trim() || null,
        message: message.trim() || null,
      });
      if (error) {
        if (error.message.includes('duplicate')) {
          toast.info('You already sent a request to this person at this company');
        } else {
          toast.error(error.message);
        }
        return;
      }
      toast.success('Reference request sent!');
      queryClient.invalidateQueries({ queryKey: ['sent-references-company', user.id, companyId] });
      setSelectedEmployee(null);
      setJobTitle('');
      setRelationship('');
      setMessage('');
      setOpen(false);
    } finally {
      setSending(false);
    }
  };

  const alreadyRequested = (employeeUserId: string) =>
    existingRequests?.some(
      (r) =>
        r.employee_id === employeeUserId && r.status !== 'declined' && r.status !== 'withdrawn',
    );

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-1" /> Request reference
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request a reference</DialogTitle>
          <p className="text-sm text-muted-foreground">
            From a verified employee at <strong>{companyName}</strong>
          </p>
        </DialogHeader>

        {/* Employees list */}
        {!selectedEmployee ? (
          <div className="space-y-3 py-2">
            {(employees?.length ?? 0) === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No verified employees found at {companyName}.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Employees must register and be verified by the company owner first.
                </p>
              </div>
            ) : (
              employees!.map((emp) => {
                const requested = alreadyRequested(emp.user_id);
                return (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between rounded-xl border border-border p-3 gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{emp.profiles?.full_name ?? 'Employee'}</p>
                      <p className="text-xs text-muted-foreground">
                        {emp.job_title}
                        {emp.department ? ` · ${emp.department}` : ''}
                      </p>
                      {emp.profiles?.headline && (
                        <p className="text-xs text-muted-foreground truncate">
                          {emp.profiles.headline}
                        </p>
                      )}
                    </div>
                    {requested ? (
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-0.5 text-emerald-500" /> Requested
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        className="shrink-0 h-7 text-xs bg-accent hover:bg-accent/90 text-accent-foreground"
                        onClick={() => setSelectedEmployee(emp)}
                      >
                        Request
                      </Button>
                    )}
                  </div>
                );
              })
            )}

            {/* Show existing requests */}
            {(existingRequests?.length ?? 0) > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Your requests at {companyName}
                </p>
                {existingRequests!.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between text-xs py-2 border-b border-border/50 last:border-0"
                  >
                    <span className="text-foreground/70">
                      {req.company_employees?.profiles?.full_name ?? 'Employee'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-medium ${
                        req.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'accepted'
                            ? 'bg-blue-100 text-blue-800'
                            : req.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Compose request */
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
              <p className="font-medium text-sm">{selectedEmployee.profiles?.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedEmployee.job_title} at {companyName}
              </p>
            </div>

            <div>
              <Label>
                Job you're applying for <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                className="mt-1"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Developer at TechCorp"
              />
            </div>

            <div>
              <Label>
                Your relationship <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                className="mt-1"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="e.g. Former colleague, direct report, project partner"
              />
            </div>

            <div>
              <Label>
                Personal message <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                className="mt-1"
                rows={4}
                maxLength={500}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="A short note explaining why you're asking them specifically and what role you're applying for…"
              />
              <p className="text-xs text-muted-foreground text-right mt-1">{message.length}/500</p>
            </div>
          </div>
        )}

        <DialogFooter>
          {selectedEmployee ? (
            <>
              <Button variant="outline" onClick={() => setSelectedEmployee(null)}>
                Back
              </Button>
              <Button
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? (
                  'Sending…'
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" /> Send request
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
