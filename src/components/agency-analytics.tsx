import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Target } from "lucide-react";
import type { RecruitmentProject, RecruitmentAgencyStaff } from "@/lib/enhanced-types";

interface AgencyAnalyticsProps {
  agencyId: string;
  projects: RecruitmentProject[];
  staff: RecruitmentAgencyStaff[];
}

export function AgencyAnalytics({ agencyId, projects, staff }: AgencyAnalyticsProps) {
  const activeProjects = projects.filter((p) => p.status === "active");
  const completedProjects = projects.filter((p) => p.status === "completed");
  const totalPlacements = projects.reduce((sum, p) => sum + (p.positions_filled || 0), 0);
  const totalPositions = projects.reduce((sum, p) => sum + (p.target_count || 0), 0);
  const conversionRate = totalPositions > 0 ? Math.round((totalPlacements / totalPositions) * 100) : 0;
  const topRecruiter = staff.sort((a, b) => (b.candidates_placed || 0) - (a.candidates_placed || 0))[0];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-3xl font-bold">{conversionRate}%</div>
              <div className="text-sm text-gray-600">Conversion Rate</div>
              <div className="text-xs text-gray-500 mt-1">{totalPlacements}/{totalPositions} positions</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-3xl font-bold">{activeProjects.length}</div>
              <div className="text-sm text-gray-600">Active Projects</div>
              <div className="text-xs text-gray-500 mt-1">{completedProjects.length} completed</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-3xl font-bold">{totalPlacements}</div>
              <div className="text-sm text-gray-600">Total Placements</div>
              <div className="text-xs text-gray-500 mt-1">Across all projects</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{staff.length}</div>
              <div className="text-sm text-gray-600">Team Members</div>
              {topRecruiter && (
                <div className="text-xs text-gray-500 mt-1">
                  Top: {topRecruiter.name} ({topRecruiter.candidates_placed || 0})
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Project Performance</CardTitle>
          <CardDescription>Performance metrics by project</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="text-center text-gray-600 py-8">No projects data yet</div>
            ) : (
              projects.map((project) => {
                const fillRate = project.target_count ? Math.round(((project.positions_filled || 0) / project.target_count) * 100) : 0;
                return (
                  <div key={project.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{project.project_name}</h3>
                        <p className="text-sm text-gray-600">{project.positions_filled || 0}/{project.target_count} filled</p>
                      </div>
                      <div className="text-lg font-bold">{fillRate}%</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${fillRate}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
          <CardDescription>Recruiter productivity metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {staff.length === 0 ? (
              <div className="text-center text-gray-600 py-8">No team data yet</div>
            ) : (
              staff
                .sort((a, b) => (b.candidates_placed || 0) - (a.candidates_placed || 0))
                .map((member) => (
                  <div key={member.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-medium">{member.name}</h3>
                        <p className="text-sm text-gray-600 capitalize">{member.role}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{member.candidates_placed || 0}</div>
                        <div className="text-sm text-gray-600">placements</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${(member.success_rate || 0)}%` }}
                        />
                      </div>
                      <div className="text-sm font-medium">{member.success_rate || 0}%</div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
