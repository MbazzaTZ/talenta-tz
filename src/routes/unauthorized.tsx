import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/unauthorized")({
  component: UnauthorizedPage,
});

function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-24 flex items-center justify-center">
        <div className="max-w-md text-center space-y-6">
          <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Access denied</h1>
            <p className="mt-2 text-muted-foreground">
              You don't have permission to view this page. If you believe this
              is a mistake, contact support or switch to an account with the
              correct role.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Button asChild variant="outline">
              <Link to="/">Go home</Link>
            </Button>
            <Button asChild>
              <Link to="/dashboard">My dashboard</Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
