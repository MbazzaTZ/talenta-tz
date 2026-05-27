import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { SiteHeader, SiteFooter } from '@/components/site-chrome';
import { Search, Bookmark, Send, ShieldCheck } from 'lucide-react';

export const Route = createFileRoute('/job-seekers')({
  component: JobSeekersPage,
});

function JobSeekersPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="rounded-3xl border border-border bg-card p-10 shadow-sm">
            <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
              For job seekers
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold">
              Find your next role with Talentra
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Browse Tanzania's latest job opportunities, get matched with top employers, and apply
              with confidence. Free — always.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Link to="/jobs">Browse jobs</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/auth">Create free account</Link>
              </Button>
            </div>
          </div>

          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Search,
                title: 'Search fast',
                body: 'Filter by role, region, and industry so you see the right jobs quickly.',
              },
              {
                icon: ShieldCheck,
                title: 'Trusted employers',
                body: 'Apply to verified companies and stay in control of your job search.',
              },
              {
                icon: Bookmark,
                title: 'Save roles',
                body: 'Bookmark listings you want to revisit and apply when you are ready.',
              },
              {
                icon: Send,
                title: 'Apply directly',
                body: 'Reach employers through the platform and track your applications.',
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-3xl border border-border bg-background p-6">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="font-display text-lg font-semibold">{title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </section>

          <section className="rounded-3xl border border-border bg-card p-10">
            <h2 className="font-display text-3xl font-semibold">Getting started</h2>
            <ol className="mt-6 space-y-5 text-sm text-foreground/80">
              {[
                {
                  step: '01',
                  title: 'Create a free account',
                  body: 'Sign up in under a minute — no credit card required.',
                },
                {
                  step: '02',
                  title: 'Build your profile',
                  body: 'Add your headline, skills, and resume so employers can find you.',
                },
                {
                  step: '03',
                  title: 'Search & apply',
                  body: 'Use keywords, regions, and industries to find and apply to relevant roles.',
                },
              ].map(({ step, title, body }) => (
                <li key={step} className="flex gap-5">
                  <span className="font-display text-2xl font-bold text-accent/30 shrink-0 w-8">
                    {step}
                  </span>
                  <div>
                    <strong className="block font-semibold">{title}</strong>
                    <span className="block mt-1 text-muted-foreground">{body}</span>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-8">
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link to="/auth">Join free today</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
