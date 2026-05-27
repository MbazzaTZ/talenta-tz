import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { SiteHeader, SiteFooter } from '@/components/site-chrome';
import { BadgeCheck, Rocket, BarChart3, Users } from 'lucide-react';

export const Route = createFileRoute('/employers')({
  component: EmployersPage,
});

function EmployersPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="rounded-3xl border border-border bg-card p-10 shadow-sm">
            <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
              For employers
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold">
              Hire talent faster with Talentra
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Talentra helps employers in Tanzania attract verified candidates across every region
              and industry. Post jobs, manage applications, and build your employer profile from one
              place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Link to="/post-job">Post a job</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/auth">Create account</Link>
              </Button>
            </div>
          </div>

          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Users,
                title: 'Verified candidates',
                body: 'Connect with applicants who are actively searching, experienced, and ready to grow.',
              },
              {
                icon: Rocket,
                title: 'Post in minutes',
                body: 'Create targeted listings for jobs across Dar es Salaam, Arusha, Mwanza, and beyond.',
              },
              {
                icon: BarChart3,
                title: 'Track applications',
                body: 'Review candidates, save favorites, and stay organised from a central dashboard.',
              },
              {
                icon: BadgeCheck,
                title: 'Verified badge',
                body: 'Build trust with candidates through verified employer profiles and listings.',
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
            <h2 className="font-display text-3xl font-semibold">Why Talentra for hiring?</h2>
            <ul className="mt-6 space-y-4 text-sm text-foreground/80">
              <li className="space-y-1">
                <strong className="block font-semibold">Local focus</strong>
                <span className="block text-muted-foreground">
                  Designed for Tanzania's job market, employers, and candidate needs.
                </span>
              </li>
              <li className="space-y-1">
                <strong className="block font-semibold">Bilingual reach</strong>
                <span className="block text-muted-foreground">
                  Engage seekers in English and Kiswahili for broader candidate coverage.
                </span>
              </li>
              <li className="space-y-1">
                <strong className="block font-semibold">Mobile-first</strong>
                <span className="block text-muted-foreground">
                  Reach candidates on any device with a fully responsive experience.
                </span>
              </li>
            </ul>
            <div className="mt-8">
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link to="/post-job">Get started free</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
