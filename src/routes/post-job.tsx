import * as React from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  ArrowRight,
  ArrowLeft,
  CloudUpload,
  ShieldCheck,
  Briefcase,
  Mail,
  Sparkles,
  Globe,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SiteHeader, SiteFooter } from '@/components/site-chrome';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/lib/auth';
import { INDUSTRIES, REGIONS } from '@/lib/kazi-data';
import { getUserProfile } from '@/lib/supabase-data';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import * as z from 'zod';

const DRAFT_KEY = 'talentra-job-draft';

type CompanyOption = Pick<
  Database['public']['Tables']['companies']['Row'],
  | 'id'
  | 'name'
  | 'logo_url'
  | 'website'
  | 'industry'
  | 'location'
  | 'verified'
  | 'suspended'
  | 'premium'
  | 'description'
> & {
  jobs?: Pick<Database['public']['Tables']['jobs']['Row'], 'status'>[];
};

const JOB_TYPES = [
  { value: 'full_time', label: 'Full-Time' },
  { value: 'part_time', label: 'Part-Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'remote', label: 'Remote' },
  { value: 'freelance', label: 'Freelance' },
] as const;

const JOB_CATEGORIES = [
  { value: 'software', label: 'Software & IT' },
  { value: 'sales', label: 'Sales & Business Development' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'operations', label: 'Operations' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'hr', label: 'HR & Recruitment' },
] as const;

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'executive', label: 'Executive' },
] as const;

const EDUCATION_LEVELS = [
  { value: 'certificate', label: 'Certificate' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelors', label: "Bachelor's" },
  { value: 'masters', label: "Master's" },
  { value: 'phd', label: 'PhD' },
  { value: 'professional', label: 'Professional' },
] as const;

const CURRENCIES = ['TZS', 'USD', 'KES', 'UGX', 'EUR'] as const;

const SALARY_TYPES = [
  { value: 'exact', label: 'Exact' },
  { value: 'range', label: 'Range' },
  { value: 'undisclosed', label: 'Undisclosed' },
] as const;

const APPLY_METHODS = [
  { value: 'email', label: 'Apply via Email' },
  { value: 'url', label: 'External URL' },
  { value: 'internal', label: 'Internal Platform' },
] as const;

const JOB_TYPE_TO_CONTRACT: Record<(typeof JOB_TYPES)[number]['value'], string> = {
  full_time: 'permanent',
  part_time: 'contract',
  contract: 'contract',
  internship: 'internship',
  remote: 'permanent',
  freelance: 'freelance',
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const numberOnly = (value: string) => value.replace(/[^0-9]/g, '');

const formatDisplayNumber = (value: string) => {
  const number = Number(numberOnly(value));
  if (!number) return '';
  return new Intl.NumberFormat('en-US').format(number);
};

const schema = z
  .object({
    companyId: z.string().min(1),
    companyName: z.string().optional(),
    companyLogo: z.string().optional(),
    companyWebsite: z.string().optional(),
    industry: z.string().optional(),
    companyLocation: z.string().optional(),
    companyDescription: z.string().max(2000).optional(),
    jobTitle: z.string().min(3),
    slug: z.string(),
    category: z.string().min(1),
    jobType: z.enum(JOB_TYPES.map((item) => item.value) as [string, ...string[]]),
    location: z.string().min(2),
    salaryType: z.enum(SALARY_TYPES.map((item) => item.value) as [string, ...string[]]),
    salary: z.string().optional(),
    salaryMin: z.string().optional(),
    salaryMax: z.string().optional(),
    currency: z.enum(CURRENCIES),
    description: z.string().min(30),
    requirements: z.string().min(20),
    responsibilities: z.string().min(20),
    experienceLevel: z.enum(EXPERIENCE_LEVELS.map((item) => item.value) as [string, ...string[]]),
    educationLevel: z.enum(EDUCATION_LEVELS.map((item) => item.value) as [string, ...string[]]),
    deadline: z.string().optional(),
    applyMethod: z.enum(APPLY_METHODS.map((item) => item.value) as [string, ...string[]]),
    applyEmail: z.string().optional(),
    applyUrl: z.string().optional(),
    featured: z.boolean(),
    urgent: z.boolean(),
    remoteFriendly: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const today = new Date();
    if (data.companyId === 'new') {
      if (!data.companyName?.trim()) {
        ctx.addIssue({
          path: ['companyName'],
          code: z.ZodIssueCode.custom,
          message: 'Company name is required for a new employer profile.',
        });
      }
      if (!data.industry?.trim()) {
        ctx.addIssue({
          path: ['industry'],
          code: z.ZodIssueCode.custom,
          message: 'Industry is required when creating a company.',
        });
      }
      if (!data.companyLocation?.trim()) {
        ctx.addIssue({
          path: ['companyLocation'],
          code: z.ZodIssueCode.custom,
          message: 'Please select the company region.',
        });
      }
    }

    if (data.salaryType === 'exact' && !numberOnly(data.salary || '')) {
      ctx.addIssue({
        path: ['salary'],
        code: z.ZodIssueCode.custom,
        message: 'Enter the exact salary amount.',
      });
    }

    if (data.salaryType === 'range') {
      const min = Number(numberOnly(data.salaryMin || ''));
      const max = Number(numberOnly(data.salaryMax || ''));
      if (!min) {
        ctx.addIssue({
          path: ['salaryMin'],
          code: z.ZodIssueCode.custom,
          message: 'Enter the minimum salary.',
        });
      }
      if (!max) {
        ctx.addIssue({
          path: ['salaryMax'],
          code: z.ZodIssueCode.custom,
          message: 'Enter the maximum salary.',
        });
      }
      if (min && max && min > max) {
        ctx.addIssue({
          path: ['salaryMax'],
          code: z.ZodIssueCode.custom,
          message: 'Maximum salary must be greater than minimum salary.',
        });
      }
    }

    if (data.applyMethod === 'email' && !data.applyEmail?.trim()) {
      ctx.addIssue({
        path: ['applyEmail'],
        code: z.ZodIssueCode.custom,
        message: 'Email is required for application by email.',
      });
    }

    if (data.applyMethod === 'url' && !data.applyUrl?.trim()) {
      ctx.addIssue({
        path: ['applyUrl'],
        code: z.ZodIssueCode.custom,
        message: 'Application URL is required.',
      });
    }

    if (data.applyUrl?.trim() && data.applyMethod === 'url') {
      try {
        new URL(data.applyUrl);
      } catch {
        ctx.addIssue({
          path: ['applyUrl'],
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid URL.',
        });
      }
    }

    if (
      data.applyEmail?.trim() &&
      data.applyMethod === 'email' &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.applyEmail)
    ) {
      ctx.addIssue({
        path: ['applyEmail'],
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid email address.',
      });
    }

    if (data.deadline) {
      const selected = new Date(data.deadline + 'T00:00:00');
      if (selected < new Date(today.toISOString().split('T')[0] + 'T00:00:00')) {
        ctx.addIssue({
          path: ['deadline'],
          code: z.ZodIssueCode.custom,
          message: 'Deadline cannot be in the past.',
        });
      }
    }
  });

export const Route = createFileRoute('/post-job')({ component: PostJobPage });

function PostJobPage() {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = React.useState(1);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [logoProgress, setLogoProgress] = React.useState(0);
  const [draftSavedAt, setDraftSavedAt] = React.useState('');
  const [dragging, setDragging] = React.useState(false);

  const { data: companies, isLoading: companiesLoading } = useQuery({
    queryKey: ['my-companies'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select(
          'id,name,logo_url,website,industry,location,description,verified,suspended,premium,jobs(status)',
        )
        .eq('owner_id', user!.id);
      if (error) throw error;
      return (data ?? []) as CompanyOption[];
    },
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      companyId: 'new',
      companyName: '',
      companyLogo: '',
      companyWebsite: '',
      industry: '',
      companyLocation: '',
      companyDescription: '',
      jobTitle: '',
      slug: '',
      category: 'software',
      jobType: 'full_time',
      location: '',
      salaryType: 'undisclosed',
      salary: '',
      salaryMin: '',
      salaryMax: '',
      currency: 'TZS',
      description: '',
      requirements: '',
      responsibilities: '',
      experienceLevel: 'mid',
      educationLevel: 'bachelors',
      deadline: '',
      applyMethod: 'email',
      applyEmail: '',
      applyUrl: '',
      featured: false,
      urgent: false,
      remoteFriendly: false,
    },
  });

  const { control, register, handleSubmit, watch, setValue, reset, trigger, formState } = form;
  const values = watch();

  React.useEffect(() => {
    if (!loading && !user) {
      navigate({ to: '/auth' });
    }
  }, [user, loading, navigate]);

  React.useEffect(() => {
    if (
      !companiesLoading &&
      companies?.length &&
      values.companyId === 'new' &&
      !localStorage.getItem(DRAFT_KEY)
    ) {
      setValue('companyId', companies[0].id);
    }
  }, [companies, companiesLoading, values.companyId, setValue]);

  React.useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return;
    try {
      const draft = JSON.parse(saved);
      reset(draft);
      if (draft.slug) {
        setValue('slug', draft.slug);
      }
    } catch {
      // ignore invalid saved draft
    }
  }, [reset, setValue]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      // Strip the base64 logo from draft to avoid bloating localStorage
      const { companyLogo: _logo, ...draftWithoutLogo } = values;
      const draft = { ...draftWithoutLogo, updatedAt: new Date().toISOString() };
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setDraftSavedAt(new Date().toLocaleTimeString());
      } catch {
        // localStorage quota exceeded — silently skip
      }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [values]);

  React.useEffect(() => {
    const subscription = watch((value) => {
      const title = value.jobTitle || '';
      setValue('slug', slugify(title));
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  const selectedCompany = React.useMemo(
    () => companies?.find((company) => company.id === values.companyId),
    [companies, values.companyId],
  );

  // Fetch employer profile for pre-filling new company fields
  const { data: employerProfile } = useQuery({
    queryKey: ['supabase-profile', user?.id],
    enabled: !!user?.id,
    queryFn: () => getUserProfile(user!.id),
  });

  // Pre-fill new company fields from profile when switching to 'new'
  React.useEffect(() => {
    if (values.companyId !== 'new' || !employerProfile) return;
    if (!values.companyName && employerProfile.full_name) {
      // Don't auto-fill company name from personal name — employer should enter it
    }
    if (!values.companyLocation && employerProfile.location) {
      setValue('companyLocation', employerProfile.location);
    }
  }, [values.companyId, employerProfile, values.companyName, values.companyLocation, setValue]);

  const isNewCompany = values.companyId === 'new';
  const salaryValue = numberOnly(values.salary || '');
  const salaryMinValue = numberOnly(values.salaryMin || '');
  const salaryMaxValue = numberOnly(values.salaryMax || '');
  const deadlineMin = new Date().toISOString().split('T')[0];

  const stepLabels = ['Company', 'Job details', 'Applications', 'Extras'];

  // Fields to validate per step — only check the current step's required fields
  const STEP_FIELDS: Record<number, string[]> = {
    1: ['companyId', 'companyName', 'companyWebsite', 'industry', 'companyLocation'],
    2: ['jobTitle', 'category', 'jobType', 'location', 'description'],
    3: ['applyMethod'],
    4: [],
  };

  const goNext = async () => {
    const fields = STEP_FIELDS[step] ?? [];
    // Cast to any to bypass RHF's strict generic typing — field names are correct
    const success = fields.length > 0
      ? await trigger(fields as Parameters<typeof trigger>[0])
      : true;
    if (!success) {
      toast.error('Please complete all required fields before continuing.');
      return;
    }
    setStep((current) => Math.min(current + 1, 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setStep((current) => Math.max(current - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file.');
      return;
    }

    // Limit to 2 MB to avoid bloating localStorage draft
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2 MB. Please resize and try again.');
      return;
    }

    setLogoProgress(0);
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        setLogoProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    reader.onload = () => {
      const result = reader.result as string;
      setValue('companyLogo', result);
      setLogoProgress(100);
      toast.success('Logo ready for your company profile.');
    };
    reader.readAsDataURL(file);
  };

  const renderPreview = (data: z.infer<typeof schema>) => {
    const salaryText =
      data.salaryType === 'undisclosed'
        ? 'Undisclosed'
        : data.salaryType === 'exact'
          ? `${formatDisplayNumber(data.salary ?? '')} ${data.currency}`
          : `${formatDisplayNumber(data.salaryMin ?? '')} - ${formatDisplayNumber(data.salaryMax ?? '')} ${data.currency}`;

    return (
      <Card className="mt-4 rounded-3xl border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Preview</p>
            <h3 className="mt-2 text-2xl font-semibold">{data.jobTitle || 'Job title preview'}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.companyName || selectedCompany?.name || 'Employer name'}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4 text-accent" /> {data.category}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-border bg-background p-4 text-sm">
            <p className="text-muted-foreground">Location</p>
            <p className="mt-2 font-medium">{data.location || 'Tanzania'}</p>
          </div>
          <div className="rounded-3xl border border-border bg-background p-4 text-sm">
            <p className="text-muted-foreground">Salary</p>
            <p className="mt-2 font-medium">{salaryText}</p>
          </div>
          <div className="rounded-3xl border border-border bg-background p-4 text-sm">
            <p className="text-muted-foreground">Deadline</p>
            <p className="mt-2 font-medium">{data.deadline || 'Flexible'}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <div className="rounded-3xl border border-border bg-background p-4">
            <p className="text-sm font-semibold">Why this role matters</p>
            <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">
              {data.description || 'Describe the impact and mission of this role.'}
            </p>
          </div>
          <div className="space-y-4">
            <div className="rounded-3xl border border-border bg-background p-4">
              <p className="text-sm font-semibold">Requirements</p>
              <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">
                {data.requirements || 'List the key skills and qualifications.'}
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-background p-4">
              <p className="text-sm font-semibold">Responsibilities</p>
              <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">
                {data.responsibilities || 'Explain the core responsibilities of the role.'}
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card className="rounded-4xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-accent">Section A</p>
                <h2 className="mt-2 text-2xl font-semibold">Company information</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create or choose a polished employer profile for this opening.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-accent" /> Employer branding first
              </div>
            </div>

            {companies?.length ? (
              <FormField
                control={control}
                name="companyId"
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel>Employer profile</FormLabel>
                    <FormControl asChild>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company or create new" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="new">Create new company</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Pick an existing company or create a fresh employer profile for this listing.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {isNewCompany ? (
              <div className="mt-6 space-y-6">
                <FormField
                  control={control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company name</FormLabel>
                      <FormControl asChild>
                        <Input placeholder="TanzaTech Global" {...field} />
                      </FormControl>
                      <FormDescription>
                        Company name shown to candidates and in search results.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none">Company logo</label>
                      <div
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(event) => {
                          event.preventDefault();
                          setDragging(false);
                          const file = event.dataTransfer.files?.[0];
                          if (file) handleLogoUpload(file);
                        }}
                        className={`group relative overflow-hidden rounded-3xl border-2 border-dashed ${dragging ? 'border-accent bg-accent/10' : 'border-border bg-background'} transition-all duration-200`}
                      >
                        <div className="min-h-50 p-6 text-center">
                          {values.companyLogo ? (
                            <img
                              src={values.companyLogo}
                              alt="Logo preview"
                              className="mx-auto h-28 w-28 rounded-3xl object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-3 py-10 text-sm text-muted-foreground">
                              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-accent">
                                <CloudUpload className="h-6 w-6" />
                              </div>
                              <p className="font-medium text-foreground">Drag & drop or browse</p>
                              <p>Upload a square logo for a polished company listing.</p>
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          aria-label="Upload company logo"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) handleLogoUpload(file);
                          }}
                        />
                      </div>
                      {logoProgress > 0 && logoProgress < 100 ? (
                        <progress
                          aria-label="Logo upload progress"
                          className="logo-upload-progress mt-3 block h-2 w-full overflow-hidden rounded-full"
                          max={100}
                          value={logoProgress}
                        />
                      ) : null}
                      <p className="text-sm text-muted-foreground">
                        Optional logo upload for stronger employer recognition.
                      </p>
                    </div>

                    <FormField
                      control={control}
                      name="companyWebsite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website or company link</FormLabel>
                          <FormControl asChild>
                            <Input placeholder="https://talentra.co" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-6">
                    <FormField
                      control={control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry</FormLabel>
                          <FormControl asChild>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose industry" />
                              </SelectTrigger>
                              <SelectContent>
                                {INDUSTRIES.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.en}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="companyLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company region</FormLabel>
                          <FormControl asChild>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
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
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="companyDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company description</FormLabel>
                          <FormControl asChild>
                            <Textarea
                              rows={4}
                              placeholder="Tell candidates who you are, what you do, and why it's a great place to work."
                              {...field}
                            />
                          </FormControl>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Optional — shown on your company profile</span>
                            <span>{(field.value ?? '').length}/2000</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            ) : selectedCompany ? (
              <Card className="mt-6 rounded-3xl border border-border bg-muted p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-3xl bg-background shadow-sm">
                      {selectedCompany.logo_url ? (
                        <img
                          src={selectedCompany.logo_url}
                          alt={selectedCompany.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-sm font-semibold text-muted-foreground">
                          Logo
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-base font-semibold">{selectedCompany.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedCompany.location ? `${selectedCompany.location} · ` : ''}
                        {selectedCompany.website || 'No website set'}
                      </p>
                      {selectedCompany.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {selectedCompany.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {selectedCompany.verified ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 text-slate-500" />
                    )}
                    {selectedCompany.verified ? 'Verified employer' : 'Profile not verified'}
                  </div>
                </div>
              </Card>
            ) : null}
          </Card>
        );
      case 2:
        return (
          <Card className="rounded-4xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-accent">Section B</p>
                <h2 className="mt-2 text-2xl font-semibold">Job details</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Describe the role clearly so candidates can decide fast.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                <Briefcase className="h-4 w-4 text-accent" /> Modern role presentation
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <FormField
                control={control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job title</FormLabel>
                    <FormControl asChild>
                      <Input placeholder="Senior Product Designer" {...field} />
                    </FormControl>
                    <FormDescription>
                      Strong titles help the role appear in searches.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 xl:grid-cols-2">
                <FormField
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job category</FormLabel>
                      <FormControl asChild>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {JOB_CATEGORIES.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="jobType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job type</FormLabel>
                      <FormControl asChild>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="grid grid-cols-2 gap-2"
                        >
                          {JOB_TYPES.map((option) => (
                            <label
                              key={option.value}
                              className="rounded-2xl border border-border px-3 py-3 text-sm hover:border-accent hover:text-accent"
                            >
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value={option.value} />
                                <span>{option.label}</span>
                              </div>
                            </label>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <FormField
                  control={control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work location</FormLabel>
                      <FormControl asChild>
                        <Input placeholder="Dar es Salaam or remote" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="salaryType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary style</FormLabel>
                      <FormControl asChild>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose salary style" />
                          </SelectTrigger>
                          <SelectContent>
                            {SALARY_TYPES.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {values.salaryType === 'exact' ? (
                <FormField
                  control={control}
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exact salary</FormLabel>
                      <FormControl asChild>
                        <Input
                          inputMode="numeric"
                          placeholder="1200000"
                          {...field}
                          onChange={(event) => field.onChange(numberOnly(event.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        {formatDisplayNumber(field.value ?? '')
                          ? `Formatted: ${formatDisplayNumber(field.value ?? '')} ${values.currency}`
                          : 'Enter the exact amount in numbers.'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : values.salaryType === 'range' ? (
                <div className="grid gap-6 xl:grid-cols-2">
                  <FormField
                    control={control}
                    name="salaryMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum salary</FormLabel>
                        <FormControl asChild>
                          <Input
                            inputMode="numeric"
                            placeholder="500000"
                            {...field}
                            onChange={(event) => field.onChange(numberOnly(event.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          {formatDisplayNumber(field.value ?? '')
                            ? `Formatted: ${formatDisplayNumber(field.value ?? '')} ${values.currency}`
                            : 'Lower bound'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="salaryMax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum salary</FormLabel>
                        <FormControl asChild>
                          <Input
                            inputMode="numeric"
                            placeholder="1500000"
                            {...field}
                            onChange={(event) => field.onChange(numberOnly(event.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          {formatDisplayNumber(field.value ?? '')
                            ? `Formatted: ${formatDisplayNumber(field.value ?? '')} ${values.currency}`
                            : 'Upper bound'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : null}

              <div className="grid gap-6 xl:grid-cols-2">
                <FormField
                  control={control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl asChild>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map((currency) => (
                              <SelectItem key={currency} value={currency}>
                                {currency}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application deadline</FormLabel>
                      <FormControl asChild>
                        <Input type="date" min={deadlineMin} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <FormField
                  control={control}
                  name="experienceLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience level</FormLabel>
                      <FormControl asChild>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            {EXPERIENCE_LEVELS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="educationLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Education level</FormLabel>
                      <FormControl asChild>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select education" />
                          </SelectTrigger>
                          <SelectContent>
                            {EDUCATION_LEVELS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job description</FormLabel>
                    <FormControl asChild>
                      <Textarea
                        rows={6}
                        placeholder="What will the successful candidate do?"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Summarize responsibilities and team goals.</span>
                      <span>{field.value.length}/1200</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 lg:grid-cols-2">
                <FormField
                  control={control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requirements</FormLabel>
                      <FormControl asChild>
                        <Textarea
                          rows={5}
                          placeholder="Must-have skills, experience, and qualifications."
                          {...field}
                        />
                      </FormControl>
                      <div className="text-right text-xs text-muted-foreground">
                        {field.value.length}/900
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="responsibilities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsibilities</FormLabel>
                      <FormControl asChild>
                        <Textarea
                          rows={5}
                          placeholder="Day-to-day expectations and success metrics."
                          {...field}
                        />
                      </FormControl>
                      <div className="text-right text-xs text-muted-foreground">
                        {field.value.length}/900
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </Card>
        );
      case 3:
        return (
          <Card className="rounded-4xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-accent">Section C</p>
                <h2 className="mt-2 text-2xl font-semibold">Application method</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Choose how candidates send applications for this role.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-accent" /> Flexible application flow
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <FormField
                control={control}
                name="applyMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application method</FormLabel>
                    <FormControl asChild>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid gap-3"
                      >
                        {APPLY_METHODS.map((option) => (
                          <label
                            key={option.value}
                            className={`group flex items-center justify-between gap-3 rounded-3xl border p-4 text-sm transition ${field.value === option.value ? 'border-accent bg-accent/5' : 'border-border bg-background hover:border-accent'}`}
                          >
                            <span>{option.label}</span>
                            <RadioGroupItem value={option.value} />
                          </label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {values.applyMethod === 'email' ? (
                <FormField
                  control={control}
                  name="applyEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employer email</FormLabel>
                      <FormControl asChild>
                        <Input placeholder="jobs@talentra.co" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : values.applyMethod === 'url' ? (
                <FormField
                  control={control}
                  name="applyUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>External application link</FormLabel>
                      <FormControl asChild>
                        <Input placeholder="https://talentra.co/careers/123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormItem>
                  <FormLabel>Internal platform</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Candidates will apply through Talentra and you can review submissions in the
                    employer dashboard.
                  </p>
                </FormItem>
              )}
            </div>
          </Card>
        );
      case 4:
        return (
          <Card className="rounded-4xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-accent">Section D</p>
                <h2 className="mt-2 text-2xl font-semibold">Additional options</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Boost visibility with optional premium tags.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-accent" /> Better candidate reach
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <FormField
                control={control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="rounded-3xl border border-border p-4 transition hover:border-accent">
                    <div className="flex items-start gap-3">
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      <div>
                        <FormLabel className="text-base">Featured job</FormLabel>
                        <FormDescription>Highlight this role in the Talentra feed.</FormDescription>
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="urgent"
                render={({ field }) => (
                  <FormItem className="rounded-3xl border border-border p-4 transition hover:border-accent">
                    <div className="flex items-start gap-3">
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      <div>
                        <FormLabel className="text-base">Urgent hire</FormLabel>
                        <FormDescription>Mark this role as a priority opening.</FormDescription>
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="remoteFriendly"
                render={({ field }) => (
                  <FormItem className="rounded-3xl border border-border p-4 transition hover:border-accent">
                    <div className="flex items-start gap-3">
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      <div>
                        <FormLabel className="text-base">Remote friendly</FormLabel>
                        <FormDescription>Appeal to remote-first candidates.</FormDescription>
                      </div>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-6 rounded-3xl border border-border bg-background p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Job preview</p>
                  <p className="text-sm text-muted-foreground">
                    Review the final listing before publishing.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreviewOpen((open) => !open)}
                >
                  {previewOpen ? 'Hide preview' : 'Show preview'}
                </Button>
              </div>
              {previewOpen ? (
                renderPreview(values)
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Tap the button to preview how your listing will appear to candidates.
                </p>
              )}
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  const onSubmit = async (data: z.infer<typeof schema>) => {
    if (!user) return;
    if (data.companyId !== 'new' && selectedCompany?.suspended) {
      toast.error('This employer profile has been suspended.');
      return;
    }

    let selectedCompanyId = data.companyId === 'new' ? undefined : data.companyId;
    if (data.companyId === 'new') {
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          owner_id: user.id,
          name: data.companyName?.trim() ?? '',
          logo_url: data.companyLogo || null,
          website: data.companyWebsite?.trim() || null,
          industry: data.industry || null,
          location: data.companyLocation || null,
          description: data.companyDescription?.trim() || null,
        })
        .select('id')
        .single();

      if (companyError) {
        toast.error(companyError.message);
        return;
      }
      selectedCompanyId = companyData.id;
      if (!roles.includes('employer')) {
        await supabase.from('user_roles').insert({ user_id: user.id, role: 'employer' });
      }
    }

    if (!selectedCompanyId) {
      toast.error('Choose or create an employer profile before publishing.');
      return;
    }

    const salaryMin =
      data.salaryType === 'exact' ? Number(salaryValue || 0) : Number(salaryMinValue || 0);
    const salaryMax =
      data.salaryType === 'exact' ? Number(salaryValue || 0) : Number(salaryMaxValue || 0);
    const details = [
      data.description.trim(),
      '\n\nRequirements:\n' + data.requirements.trim(),
      '\n\nResponsibilities:\n' + data.responsibilities.trim(),
    ].join('');

    const jobPayload = {
      companyName:
        data.companyId === 'new' ? (data.companyName?.trim() ?? '') : (selectedCompany?.name ?? ''),
      companyLogo: data.companyLogo || selectedCompany?.logo_url || '',
      companyWebsite: data.companyWebsite?.trim() || selectedCompany?.website || '',
      industry: data.industry || selectedCompany?.industry || '',
      jobTitle: data.jobTitle.trim(),
      category: data.category,
      jobType: data.jobType,
      location: data.location.trim(),
      salaryType: data.salaryType,
      salary: data.salaryType === 'exact' ? Number(salaryValue || 0) : null,
      salaryMin:
        data.salaryType === 'range'
          ? Number(salaryMinValue || 0)
          : data.salaryType === 'exact'
            ? Number(salaryValue || 0)
            : null,
      salaryMax:
        data.salaryType === 'range'
          ? Number(salaryMaxValue || 0)
          : data.salaryType === 'exact'
            ? Number(salaryValue || 0)
            : null,
      currency: data.currency,
      description: data.description.trim(),
      requirements: data.requirements.trim(),
      responsibilities: data.responsibilities.trim(),
      experienceLevel: data.experienceLevel,
      educationLevel: data.educationLevel,
      deadline: data.deadline || null,
      applyMethod: data.applyMethod,
      applyEmail: data.applyEmail?.trim() || '',
      applyUrl: data.applyUrl?.trim() || '',
      featured: data.featured,
      urgent: data.urgent,
      remoteFriendly: data.remoteFriendly,
      status: 'published',
      createdAt: new Date().toISOString(),
    };

    const { data: jobResult, error: jobError } = await supabase
      .from('jobs')
      .insert({
        company_id:       selectedCompanyId,
        posted_by:        user.id,
        created_by_role:  roles.includes('admin') ? 'admin' : 'employer',
        title:            data.jobTitle.trim(),
        description:      details,
        location:         data.location.trim(),
        region:           data.location.trim() || null,
        industry:         data.industry || '',
        position_level:   data.experienceLevel as never,
        contract_type:    JOB_TYPE_TO_CONTRACT[
          data.jobType as keyof typeof JOB_TYPE_TO_CONTRACT
        ] as never,
        qualification:    data.educationLevel as never,
        salary_min:       salaryMin || null,
        salary_max:       salaryMax || null,
        currency:         data.currency,
        salary_negotiable: false,
        deadline:         data.deadline || null,
        status:           'published',
        featured:         data.featured,
        urgent:           (data.urgent ?? false) as never,
        remote_friendly:  (data.remoteFriendly ?? false) as never,
        requirements:     (data.requirements?.trim() || null) as never,
        responsibilities: (data.responsibilities?.trim() || null) as never,
        apply_method:     (data.applyMethod ?? 'internal') as never,
        apply_email:      (data.applyEmail?.trim() || null) as never,
        apply_url:        (data.applyUrl?.trim() || null) as never,
      })
      .select('id')
      .single();

    if (jobError || !jobResult?.id) {
      toast.error(jobError?.message ?? 'Unable to publish job.');
      return;
    }

    localStorage.removeItem(DRAFT_KEY);
    queryClient.invalidateQueries({ queryKey: ['my-companies'] });
    toast.success('Job published. Talent will discover your opening soon.');
    navigate({ to: '/job/$id', params: { id: jobResult.id } });
  };

  const hasPremium = companies?.some((company) => company?.premium) ?? false;
  const totalPublished =
    companies?.reduce(
      (sum, company) =>
        sum + (company?.jobs?.filter((job) => job.status === 'published').length ?? 0),
      0,
    ) ?? 0;
  const limitReached = !hasPremium && totalPublished >= 10;

  if (loading || companiesLoading || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />
      <main className="container mx-auto px-4 pb-36 pt-10 lg:px-6">
        <div className="flex flex-col gap-10">
          <section className="rounded-4xl border border-border bg-white p-6 shadow-sm lg:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-accent">
                  Employer experience
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight">
                  Post a premium job listing
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                  A smoother employer workflow optimized for mobile candidates across Tanzania and
                  Africa.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild variant="outline" size="sm">
                  <Link to="/dashboard">Employer dashboard</Link>
                </Button>
                <span className="rounded-full bg-slate-100 px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-600">
                  Draft {draftSavedAt ? `saved at ${draftSavedAt}` : 'available'}
                </span>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-4">
              {stepLabels.map((label, index) => (
                <div key={label} className="rounded-2xl bg-slate-100 p-3 text-center">
                  <div
                    className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${step === index + 1 ? 'bg-accent text-white' : 'bg-white text-slate-500'}`}
                  >
                    {index + 1}
                  </div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </section>

          <Form {...form}>
            <form id="job-post-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {renderStep()}

              <div className="flex flex-col gap-3 rounded-3xl border border-border bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <span>
                    {step < 4
                      ? 'Step by step guidance to publish your role.'
                      : 'Finalize your listing with a preview and publish.'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {step > 1 ? (
                    <Button type="button" variant="outline" onClick={goBack} className="min-w-35">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                  ) : null}
                  {step < 4 ? (
                    <Button
                      type="button"
                      onClick={goNext}
                      className="min-w-35 bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="min-w-35 bg-accent text-accent-foreground hover:bg-accent/90"
                      disabled={formState.isSubmitting}
                    >
                      {formState.isSubmitting ? 'Publishing…' : 'Publish job'}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={goBack}
            disabled={step === 1}
          >
            Back
          </Button>
          {step < 4 ? (
            <Button
              type="button"
              className="flex-1 bg-accent text-accent-foreground"
              onClick={goNext}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="submit"
              form="job-post-form"
              className="flex-1 bg-accent text-accent-foreground"
              disabled={formState.isSubmitting}
            >
              {formState.isSubmitting ? 'Publishing…' : 'Publish'}
            </Button>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
