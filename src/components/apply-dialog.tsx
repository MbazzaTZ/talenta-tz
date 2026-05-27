import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, FileText, Users, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { getUserProfile } from '@/lib/supabase-data';
import { useAuth } from '@/lib/auth';

interface ApplyDialogProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  hasApplied: boolean;
}

export function ApplyDialog({ jobId, jobTitle, companyName, hasApplied }: ApplyDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState(1);
  const [submitting, setSubmitting] = React.useState(false);

  // Application fields
  const [remarks, setRemarks] = React.useState('');
  const [qualifications, setQualifications] = React.useState('');
  const [experienceNote, setExperienceNote] = React.useState('');
  const [shareReferences, setShareReferences] = React.useState(false);
  const [backgroundCheck, setBackgroundCheck] = React.useState(false);
  const [testimonies, setTestimonies] = React.useState<
    { name: string; contact: string; message: string }[]
  >([]);

  const { data: profile } = useQuery({
    queryKey: ['supabase-profile', user?.id],
    enabled: !!user?.id && open,
    queryFn: () => getUserProfile(user!.id),
  });

  const profileStrength = React.useMemo(() => {
    if (!profile) return { score: 0, missing: [] as string[] };
    const checks = [
      { label: 'Headline', ok: !!profile.headline },
      { label: 'Summary', ok: !!(profile as never as { cv_summary?: string }).cv_summary },
      { label: 'Skills', ok: (profile.skills?.length ?? 0) > 0 },
      {
        label: 'Work experience',
        ok:
          ((profile as never as { work_experience?: unknown[] }).work_experience?.length ?? 0) > 0,
      },
      {
        label: 'Education',
        ok:
          ((profile as never as { education_items?: unknown[] }).education_items?.length ?? 0) > 0,
      },
      { label: 'Resume uploaded', ok: !!profile.resumeUrl },
      { label: 'Phone', ok: !!profile.phone },
    ];
    const missing = checks.filter((c) => !c.ok).map((c) => c.label);
    return {
      score: Math.round((checks.filter((c) => c.ok).length / checks.length) * 100),
      missing,
    };
  }, [profile]);

  const handleApply = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      // Snapshot the CV at time of application
      const cvSnapshot = profile
        ? {
            full_name: profile.full_name,
            headline: profile.headline,
            skills: profile.skills,
            work_experience: (profile as never as { work_experience?: unknown }).work_experience,
            education_items: (profile as never as { education_items?: unknown }).education_items,
            certifications: (profile as never as { certifications?: unknown }).certifications,
            resume_url: profile.resumeUrl,
          }
        : null;

      const { error } = await supabase.from('applications').insert({
        job_id: jobId,
        applicant_id: user.id,
        cover_letter: remarks || null,
        remarks: remarks || null,
        qualifications: qualifications || null,
        experience_note: experienceNote || null,
        testimonies: testimonies.length > 0 ? testimonies : null,
        background_check: backgroundCheck,
        references_shared: shareReferences,
        cv_snapshot: cvSnapshot,
      } as never);

      if (error) {
        if (error.message.includes('duplicate')) toast.info("You've already applied to this job");
        else toast.error(error.message);
        return;
      }

      toast.success('Application submitted! The employer will be in touch.');
      queryClient.invalidateQueries({ queryKey: ['application', jobId, user.id] });
      setOpen(false);
      setStep(1);
    } finally {
      setSubmitting(false);
    }
  };

  const addTestimony = () => {
    setTestimonies((t) => [...t, { name: '', contact: '', message: '' }]);
  };

  const updateTestimony = (idx: number, field: 'name' | 'contact' | 'message', value: string) => {
    setTestimonies((t) => t.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  if (!user) {
    return (
      <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
        <Link to="/auth">Sign in to apply</Link>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
          disabled={hasApplied}
        >
          {hasApplied ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Applied
            </>
          ) : (
            'Apply now'
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Apply — {jobTitle}</DialogTitle>
          <p className="text-sm text-muted-foreground">{companyName}</p>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 my-2">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`h-6 w-6 rounded-full text-xs font-semibold flex items-center justify-center transition-colors ${
                  step >= s ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-accent' : 'bg-muted'}`} />}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mb-4">
          <span>Your profile</span>
          <span>Application</span>
          <span>Confirm</span>
        </div>

        {/* Step 1 — Profile overview */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Profile strength</h3>
                <Badge
                  variant={profileStrength.score >= 70 ? 'default' : 'secondary'}
                  className={profileStrength.score >= 70 ? 'bg-emerald-500' : ''}
                >
                  {profileStrength.score}%
                </Badge>
              </div>
              {profile ? (
                <div className="space-y-1">
                  {[
                    { label: profile.headline || 'No headline', ok: !!profile.headline },
                    {
                      label: `${profile.skills?.length ?? 0} skills listed`,
                      ok: (profile.skills?.length ?? 0) > 0,
                    },
                    {
                      label: profile.resumeUrl ? 'Resume uploaded ✓' : 'No resume uploaded',
                      ok: !!profile.resumeUrl,
                    },
                    {
                      label:
                        ((profile as never as { work_experience?: unknown[] }).work_experience
                          ?.length ?? 0) > 0
                          ? 'Work experience added ✓'
                          : 'No work experience',
                      ok:
                        ((profile as never as { work_experience?: unknown[] }).work_experience
                          ?.length ?? 0) > 0,
                    },
                    {
                      label:
                        ((profile as never as { education_items?: unknown[] }).education_items
                          ?.length ?? 0) > 0
                          ? 'Education added ✓'
                          : 'No education',
                      ok:
                        ((profile as never as { education_items?: unknown[] }).education_items
                          ?.length ?? 0) > 0,
                    },
                  ].map(({ label, ok }) => (
                    <div key={label} className="flex items-center gap-2 text-xs">
                      <CheckCircle2
                        className={`h-3.5 w-3.5 shrink-0 ${ok ? 'text-emerald-500' : 'text-muted-foreground/30'}`}
                      />
                      <span className={ok ? '' : 'text-muted-foreground'}>{label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Loading profile…</p>
              )}
              {profileStrength.missing.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    Complete your profile to stand out
                  </p>
                  <Link to={'/cv-builder' as never} className="text-xs text-accent hover:underline">
                    Open CV Builder → {profileStrength.missing.slice(0, 3).join(', ')}
                    {profileStrength.missing.length > 3 ? ' …' : ''}
                  </Link>
                </div>
              )}
            </div>

            {profile?.resumeUrl && (
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-accent hover:underline"
              >
                <FileText className="h-4 w-4" />
                View your uploaded resume
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {/* Step 2 — Application details */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <Label className="font-semibold">Cover message / Remarks</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Why are you the right fit? What excites you about this role?
              </p>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Tell the employer why you're interested and what you bring to the table…"
              />
              <p className="text-xs text-muted-foreground text-right mt-1">{remarks.length}/2000</p>
            </div>

            <Separator />

            <div>
              <Label className="font-semibold">Relevant qualifications</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Highlight degrees, certifications, or training relevant to this role
              </p>
              <Textarea
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="e.g. BSc Computer Science (UDSM), AWS Solutions Architect certification…"
              />
            </div>

            <div>
              <Label className="font-semibold">Relevant experience</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Specific experience directly applicable to this position
              </p>
              <Textarea
                value={experienceNote}
                onChange={(e) => setExperienceNote(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="e.g. 3 years managing ICT teams at NMB Bank, delivered 4 digital transformation projects…"
              />
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Label className="font-semibold">Testimonies</Label>
                  <p className="text-xs text-muted-foreground">
                    Optional written endorsements from colleagues or clients
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addTestimony}>
                  <Users className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>
              <div className="space-y-3">
                {testimonies.map((t, i) => (
                  <div key={i} className="rounded-xl border border-border p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="text-sm border border-input rounded-md px-2 py-1"
                        placeholder="Person's name"
                        value={t.name}
                        onChange={(e) => updateTestimony(i, 'name', e.target.value)}
                      />
                      <input
                        className="text-sm border border-input rounded-md px-2 py-1"
                        placeholder="Email or phone"
                        value={t.contact}
                        onChange={(e) => updateTestimony(i, 'contact', e.target.value)}
                      />
                    </div>
                    <Textarea
                      rows={2}
                      placeholder="Their endorsement or testimonial…"
                      value={t.message}
                      onChange={(e) => updateTestimony(i, 'message', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setTestimonies((ts) => ts.filter((_, j) => j !== i))}
                      className="text-xs text-destructive hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Confirm & permissions */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="rounded-xl border border-border p-4 space-y-1">
              <p className="font-semibold text-sm">Application summary</p>
              <p className="text-sm text-muted-foreground">
                Applying as:{' '}
                <span className="text-foreground">{profile?.full_name || user.email}</span>
              </p>
              {remarks && <p className="text-xs text-muted-foreground line-clamp-2">"{remarks}"</p>}
              {testimonies.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {testimonies.length} testimon{testimonies.length > 1 ? 'ies' : 'y'} included
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-border p-4">
                <Switch
                  id="share-refs"
                  checked={shareReferences}
                  onCheckedChange={setShareReferences}
                />
                <div>
                  <Label htmlFor="share-refs" className="cursor-pointer font-medium">
                    Share my references
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Allow the employer to contact your references listed in your CV profile
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border p-4">
                <Switch
                  id="bg-check"
                  checked={backgroundCheck}
                  onCheckedChange={setBackgroundCheck}
                />
                <div>
                  <Label htmlFor="bg-check" className="cursor-pointer font-medium">
                    Consent to background check
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    I consent to the employer conducting a background verification if shortlisted
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              By submitting, a snapshot of your current CV profile will be sent to {companyName}.
              Your personal data is handled in accordance with our privacy policy.
            </p>
          </div>
        )}

        <DialogFooter className="mt-4 gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={() => setStep((s) => s + 1)}
            >
              Continue
            </Button>
          ) : (
            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={handleApply}
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : 'Submit application'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
