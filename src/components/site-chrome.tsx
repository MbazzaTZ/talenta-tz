import * as React from 'react';
import { Link } from '@tanstack/react-router';
import {
  Menu,
  Briefcase,
  LayoutDashboard,
  LogOut,
  Globe2,
  Search,
  Bookmark,
  User2,
  FileText,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/lib/auth';
import { useLang, useT } from '@/lib/i18n';

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-display font-bold text-sm">
        T
      </div>
      <span className="font-display text-lg font-semibold tracking-tight">Talentra</span>
    </Link>
  );
}

function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 h-8 px-2">
          <Globe2 className="h-3.5 w-3.5" />
          <span className="uppercase text-xs font-semibold">{lang}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLang('en')}>English</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLang('sw')}>Kiswahili</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const SiteHeader = React.memo(function SiteHeader() {
  const { user, signOut, roles } = useAuth();
  const t = useT();
  const isEmployer = roles.includes('employer');
  const isAdmin = roles.includes('admin');

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden md:flex items-center gap-5 text-sm">
            <Link
              to="/jobs"
              className="text-foreground/70 hover:text-foreground transition-colors"
              activeProps={{ className: 'text-foreground font-medium' }}
            >
              {t('browse_jobs')}
            </Link>
            <Link
              to="/job-seekers"
              className="text-foreground/70 hover:text-foreground transition-colors"
              activeProps={{ className: 'text-foreground font-medium' }}
            >
              For seekers
            </Link>
            <Link
              to="/employers"
              className="text-foreground/70 hover:text-foreground transition-colors"
              activeProps={{ className: 'text-foreground font-medium' }}
            >
              For employers
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="text-foreground/70 hover:text-foreground transition-colors"
                activeProps={{ className: 'text-foreground font-medium' }}
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <LangToggle />

          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex h-8">
                <Link to="/dashboard">{t('dashboard')}</Link>
              </Button>
              {isEmployer && (
                <Button
                  asChild
                  size="sm"
                  className="hidden md:inline-flex h-8 bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Link to="/post-job">{t('post_job')}</Link>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full h-8 w-8">
                    <User2 className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">
                      <LayoutDashboard className="h-4 w-4" />
                      {t('dashboard')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={'/cv-builder' as never}>
                      <FileText className="h-4 w-4" />
                      CV Builder
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={'/employer-dashboard' as never}>
                      <BarChart3 className="h-4 w-4" />
                      Employer Hub
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/post-job">
                      <Briefcase className="h-4 w-4" />
                      {t('post_job')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={signOut}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('sign_out')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex h-8">
                <Link to="/auth">{t('sign_in')}</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="h-8 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Link to="/auth" search={{ mode: 'signup' }}>
                  {t('sign_up')}
                </Link>
              </Button>
            </>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="mt-8 flex flex-col gap-1">
                <NavLink to="/">{t('browse_jobs')}</NavLink>
                <NavLink to="/jobs">{t('browse_jobs')}</NavLink>
                <NavLink to="/job-seekers">For job seekers</NavLink>
                <NavLink to="/employers">For employers</NavLink>
                <NavLink to="/post-job">{t('post_job')}</NavLink>
                {isAdmin && <NavLink to="/admin">Admin</NavLink>}
                <NavLink to="/dashboard">{t('dashboard')}</NavLink>
                <NavLink to="/cv-builder">CV Builder</NavLink>
                <NavLink to="/about">{t('about')}</NavLink>
                <NavLink to="/contact">{t('contact')}</NavLink>
                {user ? (
                  <button
                    onClick={signOut}
                    className="mt-2 px-3 py-3 rounded-lg hover:bg-muted text-left text-sm text-destructive"
                  >
                    {t('sign_out')}
                  </button>
                ) : (
                  <NavLink to="/auth">{t('sign_in')}</NavLink>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
});

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to as never}
      className="px-3 py-2.5 rounded-lg hover:bg-muted text-sm transition-colors"
      activeProps={{ className: 'bg-muted font-medium' }}
    >
      {children}
    </Link>
  );
}

export const SiteFooter = React.memo(function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-primary text-primary-foreground/90 mt-20">
      <div className="container mx-auto px-4 py-12 grid gap-8 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground font-display font-bold text-sm">
              T
            </div>
            <span className="font-display text-lg font-semibold">Talentra</span>
          </div>
          <p className="text-sm text-primary-foreground/60">
            Built for Tanzania's workforce — connecting talent with opportunity.
          </p>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-sm">Job seekers</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/60">
            <li>
              <Link to="/job-seekers" className="hover:text-primary-foreground transition-colors">
                Seeker hub
              </Link>
            </li>
            <li>
              <Link to="/jobs" className="hover:text-primary-foreground transition-colors">
                Browse jobs
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-primary-foreground transition-colors">
                My applications
              </Link>
            </li>
            <li>
              <Link to="/auth" className="hover:text-primary-foreground transition-colors">
                Create account
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-sm">Employers</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/60">
            <li>
              <Link to="/employers" className="hover:text-primary-foreground transition-colors">
                Employer hub
              </Link>
            </li>
            <li>
              <Link to="/post-job" className="hover:text-primary-foreground transition-colors">
                Post a job
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-primary-foreground transition-colors">
                Manage listings
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-sm">Company</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/60">
            <li>
              <Link to="/about" className="hover:text-primary-foreground transition-colors">
                About
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-primary-foreground transition-colors">
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 py-4 text-center text-xs text-primary-foreground/40">
        © {new Date().getFullYear()} Talentra Tanzania
      </div>
    </footer>
  );
});

export function MobileBottomNav() {
  const { user } = useAuth();
  const items = [
    { to: '/', label: 'Home', icon: Search },
    { to: '/jobs', label: 'Jobs', icon: Briefcase },
    { to: '/dashboard', label: 'Saved', icon: Bookmark },
    { to: user ? '/dashboard' : '/auth', label: user ? 'Me' : 'Sign in', icon: User2 },
  ] as const;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-md">
      <ul className="grid grid-cols-4">
        {items.map((it) => (
          <li key={it.label}>
            <Link
              to={it.to}
              className="flex flex-col items-center gap-1 py-2.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: 'text-accent' }}
            >
              <it.icon className="h-5 w-5" />
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
