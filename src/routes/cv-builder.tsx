import * as React from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Download,
  Eye,
  EyeOff,
  GripVertical,
  Briefcase,
  GraduationCap,
  Award,
  Users,
  Globe2,
  User2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { SiteHeader, SiteFooter } from '@/components/site-chrome';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { getUserProfile, saveUserProfile } from '@/lib/supabase-data';
import { REGIONS } from '@/lib/kazi-data';
import { CVCompanySearch } from '@/components/cv-company-search';
import { CVReferenceSearch } from '@/components/cv-reference-search';

export const Route = createFileRoute('/cv-builder')({ component: CVBuilderPage });

// ── Schemas ──────────────────────────────────────────────────────────────────

const workSchema = z.object({
  title: z.string().min(1, 'Job title required'),
  company: z.string().min(1, 'Company required'),
  location: z.string().optional(),
  start_date: z.string().min(1, 'Start date required'),
  end_date: z.string().optional(),
  current: z.boolean(),
  description: z.string().max(1000).optional(),
});

const educationSchema = z.object({
  institution: z.string().min(1, 'Institution required'),
  degree: z.string().min(1, 'Degree required'),
  field: z.string().optional(),
  start_year: z.string().optional(),
  end_year: z.string().optional(),
  current: z.boolean(),
  grade: z.string().optional(),
});

const certSchema = z.object({
  name: z.string().min(1, 'Name required'),
  issuer: z.string().optional(),
  issue_date: z.string().optional(),
  expiry_date: z.string().optional(),
  credential_id: z.string().optional(),
  url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

const referenceSchema = z.object({
  name: z.string().min(1, 'Name required'),
  title: z.string().optional(),
  company: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  relationship: z.string().optional(),
});

const langSchema = z.object({
  language: z.string().min(1),
  proficiency: z.enum(['basic', 'conversational', 'fluent', 'native']),
});

const cvSchema = z.object({
  full_name: z.string().min(2, 'Full name required'),
  headline: z.string().max(150).optional(),
  cv_summary: z.string().max(800).optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  github_url: z.string().url().optional().or(z.literal('')),
  portfolio_url: z.string().url().optional().or(z.literal('')),
  nationality: z.string().optional(),
  skills: z.array(z.string()),
  work_experience: z.array(workSchema),
  education_items: z.array(educationSchema),
  certifications: z.array(certSchema),
  references_list: z.array(referenceSchema),
  languages: z.array(langSchema),
});

type CVFormValues = z.infer<typeof cvSchema>;

// ── Helpers ──────────────────────────────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-accent/10 grid place-items-center text-accent">
            <Icon className="h-4 w-4" />
          </div>
          <span className="font-display font-semibold">{title}</span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="px-5 pb-6 pt-1 border-t border-border">{children}</div>}
    </Card>
  );
}

function FieldErr({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-destructive mt-1">{msg}</p> : null;
}

// ── CV Preview (what gets printed/downloaded) ─────────────────────────────────

function CVPreview({ data, email }: { data: CVFormValues; email: string }) {
  return (
    <div
      id="cv-preview"
      className="bg-white text-slate-900 p-8 max-w-3xl mx-auto text-sm leading-relaxed font-sans"
    >
      {/* Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-5">
        <h1 className="text-2xl font-bold tracking-tight">{data.full_name || 'Your Name'}</h1>
        {data.headline && <p className="text-base text-slate-600 mt-1">{data.headline}</p>}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
          {email && <span>{email}</span>}
          {data.phone && <span>{data.phone}</span>}
          {data.location && <span>{data.location}</span>}
          {data.nationality && <span>{data.nationality}</span>}
          {data.linkedin_url && <span>{data.linkedin_url}</span>}
          {data.portfolio_url && <span>{data.portfolio_url}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.cv_summary && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
            Professional Summary
          </h2>
          <p className="text-slate-700">{data.cv_summary}</p>
        </div>
      )}

      {/* Work Experience */}
      {data.work_experience.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            Work Experience
          </h2>
          <div className="space-y-4">
            {data.work_experience.map((w, i) => (
              <div key={i}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{w.title}</p>
                    <p className="text-slate-600">
                      {w.company}
                      {w.location ? ` · ${w.location}` : ''}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 shrink-0 ml-4">
                    {w.start_date} – {w.current ? 'Present' : w.end_date || ''}
                  </p>
                </div>
                {w.description && <p className="text-slate-600 mt-1 text-xs">{w.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education_items.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            Education
          </h2>
          <div className="space-y-3">
            {data.education_items.map((e, i) => (
              <div key={i} className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">
                    {e.degree}
                    {e.field ? ` in ${e.field}` : ''}
                  </p>
                  <p className="text-slate-600">
                    {e.institution}
                    {e.grade ? ` · ${e.grade}` : ''}
                  </p>
                </div>
                <p className="text-xs text-slate-400 shrink-0 ml-4">
                  {e.start_year} – {e.current ? 'Present' : e.end_year || ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
            Skills
          </h2>
          <p className="text-slate-700">{data.skills.join(' · ')}</p>
        </div>
      )}

      {/* Certifications */}
      {data.certifications.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            Certifications
          </h2>
          <div className="space-y-2">
            {data.certifications.map((c, i) => (
              <div key={i} className="flex justify-between">
                <div>
                  <p className="font-medium">{c.name}</p>
                  {c.issuer && (
                    <p className="text-slate-500 text-xs">
                      {c.issuer}
                      {c.credential_id ? ` · ID: ${c.credential_id}` : ''}
                    </p>
                  )}
                </div>
                {c.issue_date && <p className="text-xs text-slate-400">{c.issue_date}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {data.languages.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
            Languages
          </h2>
          <p className="text-slate-700">
            {data.languages.map((l) => `${l.language} (${l.proficiency})`).join(' · ')}
          </p>
        </div>
      )}

      {/* References */}
      {data.references_list.length > 0 && (
        <div className="mb-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            References
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {data.references_list.map((r, i) => (
              <div key={i}>
                <p className="font-semibold">{r.name}</p>
                {r.title && (
                  <p className="text-slate-600 text-xs">
                    {r.title}
                    {r.company ? `, ${r.company}` : ''}
                  </p>
                )}
                {r.email && <p className="text-slate-500 text-xs">{r.email}</p>}
                {r.phone && <p className="text-slate-500 text-xs">{r.phone}</p>}
                {r.relationship && (
                  <p className="text-slate-400 text-xs italic">{r.relationship}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CVBuilderPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [previewMode, setPreviewMode] = React.useState(false);
  const [skillInput, setSkillInput] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!loading && !user) navigate({ to: '/auth' });
  }, [user, loading, navigate]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['supabase-profile', user?.id],
    enabled: !!user?.id,
    queryFn: () => getUserProfile(user!.id),
  });

  const form = useForm<CVFormValues>({
    resolver: zodResolver(cvSchema),
    defaultValues: {
      full_name: '',
      headline: '',
      cv_summary: '',
      phone: '',
      location: '',
      linkedin_url: '',
      github_url: '',
      portfolio_url: '',
      nationality: '',
      skills: [],
      work_experience: [],
      education_items: [],
      certifications: [],
      references_list: [],
      languages: [],
    },
  });

  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;
  const values = watch();

  // Load profile into form
  React.useEffect(() => {
    if (!profile) return;
    reset({
      full_name: profile.full_name ?? '',
      headline: profile.headline ?? '',
      cv_summary: (profile as never as { cv_summary?: string }).cv_summary ?? '',
      phone: profile.phone ?? '',
      location: profile.location ?? '',
      linkedin_url: (profile as never as { linkedin_url?: string }).linkedin_url ?? '',
      github_url: (profile as never as { github_url?: string }).github_url ?? '',
      portfolio_url: profile.portfolioUrl ?? '',
      nationality: (profile as never as { nationality?: string }).nationality ?? '',
      skills: profile.skills ?? [],
      work_experience:
        (profile as never as { work_experience?: z.infer<typeof workSchema>[] }).work_experience ??
        [],
      education_items:
        (profile as never as { education_items?: z.infer<typeof educationSchema>[] })
          .education_items ?? [],
      certifications:
        (profile as never as { certifications?: z.infer<typeof certSchema>[] }).certifications ??
        [],
      references_list:
        (profile as never as { references_list?: z.infer<typeof referenceSchema>[] })
          .references_list ?? [],
      languages: (profile as never as { languages?: z.infer<typeof langSchema>[] }).languages ?? [],
    });
  }, [profile, user, reset]);

  const workFields = useFieldArray({ control, name: 'work_experience' });
  const eduFields = useFieldArray({ control, name: 'education_items' });
  const certFields = useFieldArray({ control, name: 'certifications' });
  const refFields = useFieldArray({ control, name: 'references_list' });
  const langFields = useFieldArray({ control, name: 'languages' });

  const onSave = async (data: CVFormValues) => {
    if (!user) return;
    setSaving(true);
    try {
      await saveUserProfile(user.id, {
        full_name: data.full_name,
        headline: data.headline,
        phone: data.phone,
        location: data.location,
        portfolioUrl: data.portfolio_url,
        skills: data.skills,
      });
      // Save extended fields directly
      await supabase
        .from('profiles')
        .update({
          cv_summary: data.cv_summary || null,
          linkedin_url: data.linkedin_url || null,
          github_url: data.github_url || null,
          nationality: data.nationality || null,
          work_experience: data.work_experience,
          education_items: data.education_items,
          certifications: data.certifications,
          references_list: data.references_list,
          languages: data.languages,
        } as never)
        .eq('id', user.id);
      queryClient.invalidateQueries({ queryKey: ['supabase-profile', user.id] });
      toast.success('CV saved successfully');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    window.print();
    toast.info('Use your browser\'s "Save as PDF" option when printing.');
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s || values.skills.includes(s)) return;
    setValue('skills', [...values.skills, s]);
    setSkillInput('');
  };

  if (loading || isLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="container mx-auto px-4 py-12 animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const completionFields = [
    values.full_name,
    values.headline,
    values.cv_summary,
    values.phone,
    values.location,
    values.skills.length > 0,
    values.work_experience.length > 0,
    values.education_items.length > 0,
  ];
  const completionPct = Math.round(
    (completionFields.filter(Boolean).length / completionFields.length) * 100,
  );

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body > *:not(#print-root) { display: none !important; }
          #print-root { display: block !important; }
          #cv-preview { margin: 0; padding: 20px; }
        }
        @media screen { #print-root { display: none; } }
      `}</style>
      <div id="print-root">
        <CVPreview data={values} email={user.email ?? ''} />
      </div>

      <div className="min-h-screen flex flex-col pb-16 md:pb-0">
        <SiteHeader />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold">CV Builder</h1>
              <p className="text-muted-foreground mt-1">
                Build your professional CV — used when applying to jobs on Talentra
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                <span className="text-muted-foreground">{completionPct}% complete</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setPreviewMode((p) => !p)}>
                {previewMode ? (
                  <EyeOff className="h-4 w-4 mr-1" />
                ) : (
                  <Eye className="h-4 w-4 mr-1" />
                )}
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-1" /> Download PDF
              </Button>
              <Button
                size="sm"
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={handleSubmit(onSave)}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save CV'}
              </Button>
            </div>
          </div>

          {previewMode ? (
            <div className="border border-border rounded-2xl overflow-hidden shadow-sm">
              <CVPreview data={values} email={user.email ?? ''} />
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSave)} className="grid lg:grid-cols-[1fr_340px] gap-6">
              <div className="space-y-4">
                {/* Personal Info */}
                <Section title="Personal Information" icon={User2}>
                  <div className="grid gap-4 sm:grid-cols-2 mt-4">
                    <div>
                      <Label>Full name *</Label>
                      <Input className="mt-1" {...register('full_name')} />
                      <FieldErr msg={errors.full_name?.message} />
                    </div>
                    <div>
                      <Label>Professional headline</Label>
                      <Input
                        className="mt-1"
                        placeholder="e.g. Senior Software Engineer"
                        {...register('headline')}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        className="mt-1"
                        placeholder="+255 7XX XXX XXX"
                        {...register('phone')}
                      />
                    </div>
                    <div>
                      <Label>Location / Region</Label>
                      <Select
                        value={values.location}
                        onValueChange={(v) => setValue('location', v)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          {REGIONS.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Nationality</Label>
                      <Input
                        className="mt-1"
                        placeholder="Tanzanian"
                        {...register('nationality')}
                      />
                    </div>
                    <div>
                      <Label>LinkedIn URL</Label>
                      <Input
                        className="mt-1"
                        placeholder="https://linkedin.com/in/..."
                        {...register('linkedin_url')}
                      />
                      <FieldErr msg={errors.linkedin_url?.message} />
                    </div>
                    <div>
                      <Label>Portfolio / Website</Label>
                      <Input
                        className="mt-1"
                        placeholder="https://"
                        {...register('portfolio_url')}
                      />
                    </div>
                    <div>
                      <Label>GitHub URL</Label>
                      <Input
                        className="mt-1"
                        placeholder="https://github.com/..."
                        {...register('github_url')}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Professional summary</Label>
                      <Textarea
                        className="mt-1"
                        rows={4}
                        placeholder="2–4 sentences summarising your experience, strengths, and career goals."
                        {...register('cv_summary')}
                      />
                      <p className="text-xs text-muted-foreground mt-1 text-right">
                        {(values.cv_summary ?? '').length}/800
                      </p>
                    </div>
                  </div>
                </Section>

                {/* Work Experience */}
                <Section title="Work Experience" icon={Briefcase}>
                  <div className="space-y-6 mt-4">
                    {workFields.fields.map((field, idx) => (
                      <div
                        key={field.id}
                        className="relative rounded-xl border border-border p-4 bg-muted/20"
                      >
                        <button
                          type="button"
                          onClick={() => workFields.remove(idx)}
                          className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <Label>Job title *</Label>
                            <Input className="mt-1" {...register(`work_experience.${idx}.title`)} />
                            <FieldErr msg={errors.work_experience?.[idx]?.title?.message} />
                          </div>
                          <div>
                            <Label>Company *</Label>
                            <Input
                              className="mt-1"
                              {...register(`work_experience.${idx}.company`)}
                            />
                          </div>
                          <div>
                            <Label>Location</Label>
                            <Input
                              className="mt-1"
                              placeholder="City, Country"
                              {...register(`work_experience.${idx}.location`)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label>Start date *</Label>
                              <Input
                                className="mt-1"
                                type="month"
                                {...register(`work_experience.${idx}.start_date`)}
                              />
                            </div>
                            <div>
                              <Label>End date</Label>
                              <Input
                                className="mt-1"
                                type="month"
                                disabled={watch(`work_experience.${idx}.current`)}
                                {...register(`work_experience.${idx}.end_date`)}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:col-span-2">
                            <Switch
                              checked={watch(`work_experience.${idx}.current`)}
                              onCheckedChange={(v) => setValue(`work_experience.${idx}.current`, v)}
                            />
                            <Label className="cursor-pointer">Currently working here</Label>
                          </div>
                          <div className="sm:col-span-2">
                            <Label>Responsibilities & achievements</Label>
                            <Textarea
                              className="mt-1"
                              rows={3}
                              placeholder="Key responsibilities, achievements, and impact..."
                              {...register(`work_experience.${idx}.description`)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        workFields.append({
                          title: '',
                          company: '',
                          location: '',
                          start_date: '',
                          end_date: '',
                          current: false,
                          description: '',
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add position
                    </Button>
                  </div>
                </Section>

                {/* Education */}
                <Section title="Education" icon={GraduationCap}>
                  <div className="space-y-6 mt-4">
                    {eduFields.fields.map((field, idx) => (
                      <div
                        key={field.id}
                        className="relative rounded-xl border border-border p-4 bg-muted/20"
                      >
                        <button
                          type="button"
                          onClick={() => eduFields.remove(idx)}
                          className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <Label>Institution *</Label>
                            <Input
                              className="mt-1"
                              {...register(`education_items.${idx}.institution`)}
                            />
                          </div>
                          <div>
                            <Label>Degree / Certificate *</Label>
                            <Input
                              className="mt-1"
                              placeholder="Bachelor of Science"
                              {...register(`education_items.${idx}.degree`)}
                            />
                          </div>
                          <div>
                            <Label>Field of study</Label>
                            <Input
                              className="mt-1"
                              placeholder="Computer Science"
                              {...register(`education_items.${idx}.field`)}
                            />
                          </div>
                          <div>
                            <Label>Grade / GPA</Label>
                            <Input
                              className="mt-1"
                              placeholder="3.8 / 4.0 or Upper Second"
                              {...register(`education_items.${idx}.grade`)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label>Start year</Label>
                              <Input
                                className="mt-1"
                                placeholder="2018"
                                {...register(`education_items.${idx}.start_year`)}
                              />
                            </div>
                            <div>
                              <Label>End year</Label>
                              <Input
                                className="mt-1"
                                placeholder="2022"
                                disabled={watch(`education_items.${idx}.current`)}
                                {...register(`education_items.${idx}.end_year`)}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={watch(`education_items.${idx}.current`)}
                              onCheckedChange={(v) => setValue(`education_items.${idx}.current`, v)}
                            />
                            <Label>Currently studying</Label>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        eduFields.append({
                          institution: '',
                          degree: '',
                          field: '',
                          start_year: '',
                          end_year: '',
                          current: false,
                          grade: '',
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add education
                    </Button>
                  </div>
                </Section>

                {/* Certifications */}
                <Section title="Certifications & Awards" icon={Award} defaultOpen={false}>
                  <div className="space-y-4 mt-4">
                    {certFields.fields.map((field, idx) => (
                      <div
                        key={field.id}
                        className="relative rounded-xl border border-border p-4 bg-muted/20"
                      >
                        <button
                          type="button"
                          onClick={() => certFields.remove(idx)}
                          className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <Label>Certification name *</Label>
                            <Input className="mt-1" {...register(`certifications.${idx}.name`)} />
                          </div>
                          <div>
                            <Label>Issuing organisation</Label>
                            <Input className="mt-1" {...register(`certifications.${idx}.issuer`)} />
                          </div>
                          <div>
                            <Label>Issue date</Label>
                            <Input
                              className="mt-1"
                              type="month"
                              {...register(`certifications.${idx}.issue_date`)}
                            />
                          </div>
                          <div>
                            <Label>Expiry date</Label>
                            <Input
                              className="mt-1"
                              type="month"
                              {...register(`certifications.${idx}.expiry_date`)}
                            />
                          </div>
                          <div>
                            <Label>Credential ID</Label>
                            <Input
                              className="mt-1"
                              {...register(`certifications.${idx}.credential_id`)}
                            />
                          </div>
                          <div>
                            <Label>Verification URL</Label>
                            <Input
                              className="mt-1"
                              placeholder="https://"
                              {...register(`certifications.${idx}.url`)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        certFields.append({
                          name: '',
                          issuer: '',
                          issue_date: '',
                          expiry_date: '',
                          credential_id: '',
                          url: '',
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add certification
                    </Button>
                  </div>
                </Section>

                {/* References */}
                <Section title="References" icon={Users} defaultOpen={false}>
                  <p className="text-xs text-muted-foreground mt-3 mb-4">
                    References are shared with employers only when you tick "Share references" on
                    your application.
                  </p>
                  <div className="space-y-4">
                    {refFields.fields.map((field, idx) => (
                      <div
                        key={field.id}
                        className="relative rounded-xl border border-border p-4 bg-muted/20"
                      >
                        <button
                          type="button"
                          onClick={() => refFields.remove(idx)}
                          className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <Label>Full name *</Label>
                            <div className="mt-1">
                              <CVReferenceSearch
                                value={values.references_list?.[idx]?.name ?? ''}
                                userId={
                                  (values.references_list?.[idx] as Record<string, string>)?.user_id
                                }
                                verificationStatus={
                                  ((values.references_list?.[idx] as Record<string, string>)
                                    ?.verification_status as 'none' | 'pending' | 'approved') ??
                                  'none'
                                }
                                jobApplyingFor={undefined}
                                relationship={
                                  values.references_list?.[idx]?.relationship ?? undefined
                                }
                                onChange={(name) => setValue(`references_list.${idx}.name`, name)}
                                onSelect={(name, id) => {
                                  setValue(`references_list.${idx}.name`, name);
                                  setValue(`references_list.${idx}.user_id` as never, id as never);
                                  setValue(
                                    `references_list.${idx}.verification_status` as never,
                                    'pending' as never,
                                  );
                                }}
                                onClear={() => {
                                  setValue(`references_list.${idx}.user_id` as never, '' as never);
                                  setValue(
                                    `references_list.${idx}.verification_status` as never,
                                    'none' as never,
                                  );
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Job title</Label>
                            <Input className="mt-1" {...register(`references_list.${idx}.title`)} />
                          </div>
                          <div>
                            <Label>Company / Organisation</Label>
                            <Input
                              className="mt-1"
                              {...register(`references_list.${idx}.company`)}
                            />
                          </div>
                          <div>
                            <Label>Relationship to you</Label>
                            <Input
                              className="mt-1"
                              placeholder="Former manager, colleague…"
                              {...register(`references_list.${idx}.relationship`)}
                            />
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input
                              className="mt-1"
                              type="email"
                              {...register(`references_list.${idx}.email`)}
                            />
                          </div>
                          <div>
                            <Label>Phone</Label>
                            <Input className="mt-1" {...register(`references_list.${idx}.phone`)} />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        refFields.append({
                          name: '',
                          title: '',
                          company: '',
                          email: '',
                          phone: '',
                          relationship: '',
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add reference
                    </Button>
                  </div>
                </Section>

                {/* Languages */}
                <Section title="Languages" icon={Globe2} defaultOpen={false}>
                  <div className="space-y-3 mt-4">
                    {langFields.fields.map((field, idx) => (
                      <div key={field.id} className="flex gap-3 items-start">
                        <div className="flex-1">
                          <Input
                            placeholder="Language"
                            {...register(`languages.${idx}.language`)}
                          />
                        </div>
                        <Select
                          value={watch(`languages.${idx}.proficiency`)}
                          onValueChange={(v) =>
                            setValue(`languages.${idx}.proficiency`, v as never)
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(['basic', 'conversational', 'fluent', 'native'] as const).map((p) => (
                              <SelectItem key={p} value={p}>
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button
                          type="button"
                          onClick={() => langFields.remove(idx)}
                          className="text-muted-foreground hover:text-destructive mt-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        langFields.append({ language: '', proficiency: 'conversational' })
                      }
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add language
                    </Button>
                  </div>
                </Section>
              </div>

              {/* Right sidebar — Skills + quick actions */}
              <div className="space-y-4">
                <Card className="p-5 sticky top-20">
                  <h3 className="font-display font-semibold mb-4">Skills</h3>
                  <div className="flex gap-2">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      placeholder="Add a skill"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                    />
                    <Button type="button" variant="secondary" size="sm" onClick={addSkill}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {values.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                        onClick={() =>
                          setValue(
                            'skills',
                            values.skills.filter((s) => s !== skill),
                          )
                        }
                      >
                        {skill} ×
                      </Badge>
                    ))}
                    {values.skills.length === 0 && (
                      <p className="text-xs text-muted-foreground">No skills added yet</p>
                    )}
                  </div>
                </Card>

                {/* CV completeness */}
                <Card className="p-5">
                  <h3 className="font-display font-semibold mb-3">CV strength</h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Full name', done: !!values.full_name },
                      { label: 'Headline', done: !!values.headline },
                      { label: 'Summary', done: !!values.cv_summary },
                      { label: 'Phone & location', done: !!(values.phone && values.location) },
                      { label: 'Work experience', done: values.work_experience.length > 0 },
                      { label: 'Education', done: values.education_items.length > 0 },
                      { label: 'Skills (3+)', done: values.skills.length >= 3 },
                      { label: 'References', done: values.references_list.length > 0 },
                    ].map(({ label, done }) => (
                      <div key={label} className="flex items-center gap-2 text-sm">
                        <CheckCircle2
                          className={`h-4 w-4 shrink-0 ${done ? 'text-emerald-500' : 'text-muted-foreground/40'}`}
                        />
                        <span className={done ? 'text-foreground' : 'text-muted-foreground'}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-5 space-y-3">
                  <h3 className="font-display font-semibold">Quick actions</h3>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link to="/jobs">Browse jobs</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link to="/dashboard">My applications</Link>
                  </Button>
                </Card>
              </div>
            </form>
          )}
        </div>
        <SiteFooter />
      </div>
    </>
  );
}
