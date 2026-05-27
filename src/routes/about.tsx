import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { SiteHeader, SiteFooter } from '@/components/site-chrome';

export const Route = createFileRoute('/about')({ component: About });

function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="font-display text-4xl font-bold">About Talentra</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Talentra is built for Tanzania's workforce — a professional network and job marketplace
          tailored to how people work, hire, and grow careers across our country.
        </p>
        <div className="mt-8 space-y-6 text-foreground/80">
          <p>
            We support every region from Dar es Salaam to Zanzibar, and every industry from tourism
            and ICT to agriculture and the public sector.
          </p>
          <p>
            Job seekers get free access — always. Employers reach verified candidates with smart,
            location-aware matching.
          </p>
          <p>
            The platform is bilingual (English & Kiswahili), mobile-first, and built for the
            realities of African connectivity.
          </p>
        </div>
        <div className="mt-10 flex gap-3">
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link to="/jobs">Browse jobs</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/contact">Contact us</Link>
          </Button>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
