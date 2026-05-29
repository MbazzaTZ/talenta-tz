// @ts-nocheck
import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Plus, Users, Briefcase, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteHeader, SiteFooter, MobileBottomNav } from "@/components/site-chrome";
import { useAuth } from "@/lib/auth";
import { getAgenciesByAdmin } from "@/lib/supabase-agency";
import { ProtectedRoute } from "@/components/protected-route";

export const Route = createFileRoute("/agencies")({
  component: () => (
    <ProtectedRoute>
      <AgenciesList />
    </ProtectedRoute>
  ),
});

function AgenciesList() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: agencies, isLoading } = useQuery({
    queryKey: ["my-agencies", user?.id],
    enabled: !!user?.id,
    queryFn: () => getAgenciesByAdmin(user!.id),
  });

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0 bg-background">
      <SiteHeader />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold">Recruitment Agencies</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your recruitment agencies and projects
            </p>
          </div>
          <Button
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={() => navigate({ to: "/employer-dashboard" })}
          >
            <Plus className="h-4 w-4 mr-1.5" /> New Agency
          </Button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : agencies?.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {agencies.map((agency) => (
              <Link
                key={agency.id}
                to="/agency/$agencyId"
                params={{ agencyId: agency.id }}
              >
                <Card className="p-5 hover:shadow-md transition-all cursor-pointer h-full">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-xl bg-accent/10 grid place-items-center shrink-0">
                      <Building2 className="h-6 w-6 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold truncate">{agency.name}</h3>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                      {agency.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {agency.description}
                        </p>
                      )}
                      <div className="flex gap-2 mt-3">
                        {agency.specialization && (
                          <Badge variant="secondary" className="text-xs">
                            {agency.specialization}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-display font-semibold">No agencies yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Create a recruitment agency to manage projects, staff, and candidates.
            </p>
            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={() => navigate({ to: "/employer-dashboard" })}
            >
              <Plus className="h-4 w-4 mr-1.5" /> Create your first agency
            </Button>
          </div>
        )}
      </div>

      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
