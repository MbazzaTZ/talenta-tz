import * as React from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { SiteHeader } from '@/components/site-chrome';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

type AuthSearch = { mode?: 'signup' | 'login' };

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
});

const signupSchema = z
  .object({
    fullName: z.string().min(2, 'Full name required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Minimum 8 characters'),
    confirmPassword: z.string(),
    phone: z.string().optional(),
    role: z.enum(['job_seeker', 'employer', 'employee']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export const Route = createFileRoute('/auth')({
  validateSearch: (s: Record<string, unknown>): AuthSearch => ({
    mode: s.mode === 'signup' ? 'signup' : 'login',
  }),
  component: AuthPage,
});

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { mode } = Route.useSearch();

  const [tab, setTab] = React.useState<'login' | 'signup'>(mode === 'signup' ? 'signup' : 'login');
  const [isLoading, setIsLoading] = React.useState(false);

  // Redirect already-authenticated users
  React.useEffect(() => {
    if (!loading && user) {
      navigate({ to: '/dashboard' });
    }
  }, [user, loading, navigate]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      role: 'job_seeker',
    },
  });

  const onLogin = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
      toast.success('Welcome back!');
      navigate({ to: '/dashboard' });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const onSignup = async (data: SignupFormValues) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: data.role,
            phone: data.phone || null,
          },
        },
      });
      if (error) throw error;
      // Attempt auto sign-in so user doesn't need to re-enter credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (signInError) {
        // Email confirmation may be required — send to login
        toast.success('Account created! Check your email to confirm, then sign in.');
        setTab('login');
      } else {
        toast.success('Welcome to Talentra!');
        navigate({ to: '/dashboard' });
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col bg-cream/40">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl font-bold">
              {tab === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="mt-2 text-muted-foreground text-sm">
              {tab === 'login'
                ? 'Sign in to your Talentra account'
                : "Join Tanzania's smarter job network"}
            </p>
          </div>

          <Card className="rounded-3xl p-6 shadow-lg border border-border/80">
            {/* Tab switcher */}
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
              <button
                type="button"
                className={`rounded-lg py-2 text-sm font-medium transition-all ${
                  tab === 'login'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setTab('login')}
              >
                Sign in
              </button>
              <button
                type="button"
                className={`rounded-lg py-2 text-sm font-medium transition-all ${
                  tab === 'signup'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setTab('signup')}
              >
                Sign up
              </button>
            </div>

            {tab === 'login' ? (
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="mt-1"
                    {...loginForm.register('email')}
                  />
                  <FieldError message={loginForm.formState.errors.email?.message} />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="mt-1"
                    {...loginForm.register('password')}
                  />
                  <FieldError message={loginForm.formState.errors.password?.message} />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {isLoading ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
            ) : (
              <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                <div>
                  <Label htmlFor="signup-name">Full name</Label>
                  <Input
                    id="signup-name"
                    placeholder="Amina Juma"
                    className="mt-1"
                    {...signupForm.register('fullName')}
                  />
                  <FieldError message={signupForm.formState.errors.fullName?.message} />
                </div>
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="mt-1"
                    {...signupForm.register('email')}
                  />
                  <FieldError message={signupForm.formState.errors.email?.message} />
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    className="mt-1"
                    {...signupForm.register('password')}
                  />
                  <FieldError message={signupForm.formState.errors.password?.message} />
                </div>
                <div>
                  <Label htmlFor="signup-confirm">Confirm password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="mt-1"
                    {...signupForm.register('confirmPassword')}
                  />
                  <FieldError message={signupForm.formState.errors.confirmPassword?.message} />
                </div>
                <div>
                  <Label htmlFor="signup-phone">
                    Phone <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+255 7XX XXX XXX"
                    className="mt-1"
                    {...signupForm.register('phone')}
                  />
                </div>
                <div>
                  <Label htmlFor="signup-role">I am a…</Label>
                  <select
                    id="signup-role"
                    {...signupForm.register('role')}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="job_seeker">Job seeker</option>
                    <option value="employer">Employer / Recruiter</option>
                    <option value="employee">Employee (write references)</option>
                  </select>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {isLoading ? 'Creating account…' : 'Create account'}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  By signing up you agree to our{' '}
                  <Link to="/about" className="underline hover:text-accent">
                    terms of service
                  </Link>
                  .
                </p>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
