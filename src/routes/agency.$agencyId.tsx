import * as React from "react";
import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Users, 
  Briefcase, 
  BarChart3, 
  Settings,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { 
  getRecruitmentAgency, 
  getAgencyProjects,
  getAgencyStaff,
  getAgencyClients
} from "@/lib/supabase-agency";
import { AgencyOverview } from "@/components/agency-overview";
import { AgencyProjectsList } from "@/components/agency-projects-list";
import { AgencyStaffList } from "@/components/agency-staff-list";
import { AgencyAnalytics } from "@/components/agency-analytics";
import { AgencySettings } from "@/components/agency-settings";

export function AgencyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { agencyId } = useParams({ from: "/agency/$agencyId" });
  const queryClient = useQueryClient();

  // Fetch agency data
  const { data: agency, isLoading: agencyLoading } = useQuery({
    queryKey: ["agency", agencyId],
    queryFn: () => getRecruitmentAgency(agencyId),
    enabled: !!agencyId,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["agency-projects", agencyId],
    queryFn: () => getAgencyProjects(agencyId),
    enabled: !!agencyId,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["agency-staff", agencyId],
    queryFn: () => getAgencyStaff(agencyId),
    enabled: !!agencyId,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["agency-clients", agencyId],
    queryFn: () => getAgencyClients(agencyId),
    enabled: !!agencyId,
  });

  if (agencyLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p>Loading agency...</p>
        </div>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Agency Not Found</CardTitle>
            <CardDescription>The agency you're looking for doesn't exist</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate({ to: "/agencies" })} className="w-full">
              Back to Agencies
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeProjects = projects.filter((p) => p.status === "active").length;
  const totalPlacements = projects.reduce((sum, p) => sum + (p.positions_filled || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {agency.logo_url && (
                <img
                  src={agency.logo_url}
                  alt={agency.name}
                  className="h-16 w-16 rounded-lg object-cover border"
                />
              )}
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{agency.name}</h1>
                  {agency.verified && (
                    <Badge className="bg-blue-100 text-blue-800">✓ Verified</Badge>
                  )}
                </div>
                <p className="text-gray-600 mt-1">{agency.location}</p>
                {agency.specialization && agency.specialization.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {agency.specialization.slice(0, 3).map((spec) => (
                      <Badge key={spec} variant="secondary" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Subscription</div>
              <Badge className="capitalize mt-1">{agency.subscription_tier || "free"}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Briefcase className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-3xl font-bold">{projects.length}</div>
                <div className="text-sm text-gray-600">Projects</div>
                <div className="text-xs text-green-600 mt-1">{activeProjects} active</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="text-3xl font-bold">{staff.length}</div>
                <div className="text-sm text-gray-600">Team Members</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-3xl font-bold">{totalPlacements}</div>
                <div className="text-sm text-gray-600">Placements</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Building2 className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <div className="text-3xl font-bold">{clients.length}</div>
                <div className="text-sm text-gray-600">Active Clients</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Staff
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <AgencyOverview agency={agency} projects={projects} staff={staff} clients={clients} />
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <AgencyProjectsList agencyId={agencyId} projects={projects} />
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff">
            <AgencyStaffList agencyId={agencyId} staff={staff} isAdmin={agency.admin_id === user?.id} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AgencyAnalytics agencyId={agencyId} projects={projects} staff={staff} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            {agency.admin_id === user?.id && (
              <AgencySettings agencyId={agencyId} agency={agency} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/agency/$agencyId")({
  component: AgencyDashboard,
});
