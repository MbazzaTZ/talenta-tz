/**
 * EmployeeProfile — lets any logged-in user register as an employee of a company,
 * and lets employees manage incoming reference requests from job seekers.
 */
import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  Star,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CompanyEmployee {
  id: string;
  company_id: string;
  job_title: string;
  department: string | null;
  start_date: string | null;
  is_current: boolean;
  verified: boolean;
  companies: { name: string; logo_url: string | null; location: string | null } | null;
}

interface ReferenceRequest {
  id: string;
  seeker_id: string;
  company_id: string;
  job_title: string | null;
  relationship: string | null;
  message: string | null;
  status: 'pending' | 'accepted' | 'completed' | 'declined' | 'withdrawn';
  recommendation: string | null;
  rating: number | null;
  requested_at: string;
  profiles: { full_name: string | null; headline: string | null; location: string | null } | null;
}

interface Company {
  id: string;
  name: string;
  location: string | null;
  industry: string | null;
  verified: boolean;
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ReferenceRequest['status'] }) {
  const map = {
    pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-800' },
    accepted: { label: 'Accepted', cls: 'bg-blue-100 text-blue-800' },
    completed: { label: 'Completed', cls: 'bg-emerald-100 text-emerald-800' },
    declined: { label: 'Declined', cls: 'bg-red-100 text-red-800' },
    withdrawn: { label: 'Withdrawn', cls: 'bg-muted text-muted-foreground' },
  };
  const s = map[status];
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>;
}

// ── Main component ────────────────────────────────────────────────────────────

export function EmployeeProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Register form state
  const [companySearch, setCompanySearch] = React.useState('');
  const [selectedCompany, setSelectedCompany] = React.useState<Company | null>(null);
  const [jobTitle, setJobTitle] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [isCurrent, setIsCurrent] = React.useState(true);
  const [registering, setRegistering] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);

  // Response dialog
  const [respondingTo, setRespondingTo] = React.useState<ReferenceRequest | null>(null);
  const [recommendation, setRecommendation] = React.useState('');
  const [rating, setRating] = React.useState<number>(5);
  const [responding, setResponding] = React.useState(false);

  if (!user) return null;

  // Fetch user's employee records
  const { data: employeeRecords } = useQuery({
    queryKey: ['employee-records', user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('company_employees')
        .select(
          'id,company_id,job_title,department,start_date,is_current,verified,companies(name,logo_url,location)',
        )
        .eq('user_id', user.id)
        .order('is_current', { ascending: false });
      return (data ?? []) as CompanyEmployee[];
    },
  });

  // Fetch incoming reference requests
  const { data: incomingRequests } = useQuery({
    queryKey: ['incoming-reference-requests', user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('reference_requests')
        .select(
          'id,seeker_id,company_id,job_title,relationship,message,status,recommendation,rating,requested_at,profiles!seeker_id(full_name,headline,location)',
        )
        .eq('employee_id', user.id)
        .order('requested_at', { ascending: false });
      return (data ?? []) as ReferenceRequest[];
    },
  });

  // Search companies
  const { data: companyResults } = useQuery({
    queryKey: ['company-search', companySearch],
    enabled: companySearch.length >= 2,
    queryFn: async () => {
      const { data } = await supabase
        .from('companies')
        .select('id,name,location,industry,verified')
        .ilike('name', `%${companySearch}%`)
        .eq('suspended', false)
        .limit(8);
      return (data ?? []) as Company[];
    },
  });

  const handleRegister = async () => {
    if (!selectedCompany) {
      toast.error('Please search and select a company first');
      return;
    }
    if (!jobTitle.trim()) {
      toast.error('Please enter your job title at this company');
      return;
    }
    setRegistering(true);
    try {
      const { error } = await (supabase as any).from('company_employees').insert({
        user_id: user.id,
        company_id: selectedCompany.id,
        job_title: jobTitle.trim(),
        department: department.trim() || null,
        start_date: startDate || null,
        is_current: isCurrent,
      });
      if (error) {
        if (error.message.includes('duplicate')) {
          toast.info('You already have a record at this company');
        } else {
          toast.error(error.message);
        }
        return;
      }
      toast.success('Registered! The company owner can now verify you.');
      // Also ensure employee role is set
      await supabase.from('user_roles').insert({ user_id: user.id, role: 'employee' }).select();
      queryClient.invalidateQueries({ queryKey: ['employee-records', user.id] });
      setSelectedCompany(null);
      setJobTitle('');
      setDepartment('');
      setStartDate('');
      setCompanySearch('');
    } finally {
      setRegistering(false);
    }
  };

  const handleAccept = async (req: ReferenceRequest) => {
    const { error } = await supabase
      .from('reference_requests')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', req.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Request accepted. Write your recommendation when ready.');
    queryClient.invalidateQueries({ queryKey: ['incoming-reference-requests', user.id] });
  };

  const handleDecline = async (req: ReferenceRequest) => {
    const { error } = await supabase
      .from('reference_requests')
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .eq('id', req.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Request declined.');
    queryClient.invalidateQueries({ queryKey: ['incoming-reference-requests', user.id] });
  };

  const handleSubmitRecommendation = async () => {
    if (!respondingTo || !recommendation.trim()) {
      toast.error('Please write your recommendation');
      return;
    }
    setResponding(true);
    try {
      // Get this employee's job title for the record
      const empRecord = employeeRecords?.find((e) => e.company_id === respondingTo.company_id);
      const { error } = await supabase
        .from('reference_requests')
        .update({
          status: 'completed',
          recommendation: recommendation.trim(),
          rating,
          recommender_title: empRecord?.job_title || null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', respondingTo.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Recommendation submitted! The job seeker has been notified.');
      setRespondingTo(null);
      setRecommendation('');
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ['incoming-reference-requests', user.id] });
    } finally {
      setResponding(false);
    }
  };

  const pending = incomingRequests?.filter((r) => r.status === 'pending') ?? [];
  const accepted = incomingRequests?.filter((r) => r.status === 'accepted') ?? [];
  const completed = incomingRequests?.filter((r) => r.status === 'completed') ?? [];

  return (
    <div className="space-y-6 mt-4">
      {/* ── Register at a company ─────────────────────────────────── */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-9 w-9 rounded-xl bg-accent/10 grid place-items-center text-accent">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display font-semibold">Your employer</h3>
            <p className="text-xs text-muted-foreground">
              Link your account to a company so seekers can request references from you
            </p>
          </div>
        </div>

        {/* Current records */}
        {(employeeRecords?.length ?? 0) > 0 && (
          <div className="space-y-3 mb-5">
            {employeeRecords!.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between rounded-xl border border-border p-3 gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-cream border border-border grid place-items-center shrink-0 text-sm font-bold text-primary">
                    {rec.companies?.name?.[0]?.toUpperCase() ?? 'C'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{rec.job_title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {rec.companies?.name} {rec.department ? `· ${rec.department}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {rec.verified ? (
                    <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                      <BadgeCheck className="h-3 w-3 mr-0.5" /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Pending verification
                    </Badge>
                  )}
                  {rec.is_current && (
                    <Badge variant="outline" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add new employer */}
        <div className="space-y-4">
          <div>
            <Label>Search company</Label>
            <div className="relative mt-1">
              <Input
                value={companySearch}
                onChange={(e) => {
                  setCompanySearch(e.target.value);
                  setShowSearch(true);
                }}
                onFocus={() => setShowSearch(true)}
                placeholder="Start typing a company name…"
              />
              {showSearch && companySearch.length >= 2 && (companyResults?.length ?? 0) > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-xl border border-border bg-background shadow-lg overflow-hidden">
                  {companyResults!.map((co) => (
                    <button
                      key={co.id}
                      type="button"
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted text-left transition-colors"
                      onClick={() => {
                        setSelectedCompany(co);
                        setCompanySearch(co.name);
                        setShowSearch(false);
                      }}
                    >
                      <div className="h-7 w-7 rounded-lg bg-cream border border-border grid place-items-center text-xs font-bold text-primary shrink-0">
                        {co.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{co.name}</p>
                        <p className="text-xs text-muted-foreground">{co.location ?? 'Tanzania'}</p>
                      </div>
                      {co.verified && (
                        <BadgeCheck className="h-4 w-4 text-accent ml-auto shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedCompany && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Your job title *</Label>
                <Input
                  className="mt-1"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>
              <div>
                <Label>Department</Label>
                <Input
                  className="mt-1"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Engineering, Finance"
                />
              </div>
              <div>
                <Label>Start date</Label>
                <Input
                  className="mt-1"
                  type="month"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={isCurrent} onCheckedChange={setIsCurrent} id="is-current" />
                <Label htmlFor="is-current" className="cursor-pointer">
                  Currently working here
                </Label>
              </div>
            </div>
          )}

          <Button
            onClick={handleRegister}
            disabled={registering || !selectedCompany || !jobTitle.trim()}
            size="sm"
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {registering ? 'Registering…' : 'Register at this company'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          The company owner will verify your employment. Once verified, job seekers can request
          references from you.
        </p>
      </Card>

      {/* ── Incoming reference requests ───────────────────────────── */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-accent/10 grid place-items-center text-accent">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display font-semibold">Reference requests</h3>
              <p className="text-xs text-muted-foreground">
                Job seekers asking for your recommendation
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {pending.length > 0 && (
              <Badge className="bg-amber-100 text-amber-800">{pending.length} pending</Badge>
            )}
            {accepted.length > 0 && (
              <Badge className="bg-blue-100 text-blue-800">{accepted.length} in progress</Badge>
            )}
          </div>
        </div>

        {(incomingRequests?.length ?? 0) === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">No reference requests yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Once you're verified at a company, job seekers can send you requests.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {incomingRequests!.map((req) => (
              <div key={req.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">
                        {req.profiles?.full_name ?? 'Job seeker'}
                      </p>
                      <StatusBadge status={req.status} />
                    </div>
                    {req.profiles?.headline && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {req.profiles.headline}
                      </p>
                    )}
                    {req.job_title && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Applying for: <span className="text-foreground">{req.job_title}</span>
                      </p>
                    )}
                    {req.relationship && (
                      <p className="text-xs text-muted-foreground">
                        Relationship: <span className="text-foreground">{req.relationship}</span>
                      </p>
                    )}
                    {req.message && (
                      <p className="text-xs text-foreground/70 mt-2 italic line-clamp-2">
                        "{req.message}"
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {req.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-accent hover:bg-accent/90 text-accent-foreground h-7 text-xs"
                          onClick={() => handleAccept(req)}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleDecline(req)}
                        >
                          <XCircle className="h-3 w-3 mr-1" /> Decline
                        </Button>
                      </>
                    )}
                    {req.status === 'accepted' && (
                      <Button
                        size="sm"
                        className="bg-accent hover:bg-accent/90 text-accent-foreground h-7 text-xs"
                        onClick={() => {
                          setRespondingTo(req);
                          setRecommendation('');
                          setRating(5);
                        }}
                      >
                        Write recommendation
                      </Button>
                    )}
                    {req.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => {
                          setRespondingTo(req);
                          setRecommendation(req.recommendation ?? '');
                          setRating(req.rating ?? 5);
                        }}
                      >
                        View / Edit
                      </Button>
                    )}
                  </div>
                </div>

                {req.status === 'completed' && req.recommendation && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Recommendation submitted
                      {req.rating && (
                        <span className="ml-1 flex items-center gap-0.5">
                          {Array.from({ length: req.rating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                          ))}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-foreground/70 line-clamp-3 italic">
                      "{req.recommendation}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Write recommendation dialog ───────────────────────────── */}
      <Dialog open={!!respondingTo} onOpenChange={(o) => !o && setRespondingTo(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {respondingTo?.status === 'completed'
                ? 'Your recommendation'
                : 'Write recommendation'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              For {respondingTo?.profiles?.full_name ?? 'the applicant'}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Your recommendation *</Label>
              <Textarea
                className="mt-1"
                rows={6}
                placeholder="Describe the person's skills, work ethic, character, and why you'd recommend them for this role…"
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right mt-1">
                {recommendation.length}/2000
              </p>
            </div>

            <div>
              <Label>Overall rating</Label>
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-6 w-6 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                    />
                  </button>
                ))}
                <span className="text-sm text-muted-foreground ml-1">
                  {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][rating]}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondingTo(null)}>
              Cancel
            </Button>
            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={handleSubmitRecommendation}
              disabled={responding || !recommendation.trim()}
            >
              {responding
                ? 'Submitting…'
                : respondingTo?.status === 'completed'
                  ? 'Update'
                  : 'Submit recommendation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
