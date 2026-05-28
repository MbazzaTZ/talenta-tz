import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Mail, Phone, MapPin } from "lucide-react";
import type { RecruitmentAgency, RecruitmentProject, RecruitmentAgencyStaff, AgencyClientRelationship } from "@/lib/enhanced-types";

interface AgencyOverviewProps {
  agency: RecruitmentAgency;
  projects: RecruitmentProject[];
  staff: RecruitmentAgencyStaff[];
  clients: AgencyClientRelationship[];
}

export function AgencyOverview({ agency, projects, staff, clients }: AgencyOverviewProps) {
  const activeProjects = projects.filter((p) => p.status === "active");
  const completedProjects = projects.filter((p) => p.status === "completed");
  const totalPlacements = projects.reduce((sum, p) => sum + (p.positions_filled || 0), 0);
  const avgSuccessRate = 
    projects.length > 0 
      ? Math.round(projects.reduce((sum, p) => sum + (p.positions_filled || 0), 0) / projects.reduce((sum, p) => sum + (p.target_count || 0), 0) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* About Section */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {agency.description && (
            <p className="text-gray-700">{agency.description}</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agency.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-600">Location</div>
                  <div className="text-gray-900">
                    {agency.location}
                    {agency.country && `, ${agency.country}`}
                  </div>
                </div>
              </div>
            )}
            
            {agency.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-600">Email</div>
                  <a href={`mailto:${agency.email}`} className="text-blue-600 hover:underline">
                    {agency.email}
                  </a>
                </div>
              </div>
            )}
            
            {agency.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-600">Phone</div>
                  <a href={`tel:${agency.phone}`} className="text-blue-600 hover:underline">
                    {agency.phone}
                  </a>
                </div>
              </div>
            )}
            
            {agency.website && (
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-600">Website</div>
                  <a
                    href={agency.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {agency.website}
                  </a>
                </div>
              </div>
            )}
            
            {agency.founded_year && (
              <div>
                <div className="text-sm font-medium text-gray-600">Founded</div>
                <div className="text-gray-900">{agency.founded_year}</div>
              </div>
            )}
            
            {agency.company_size && (
              <div>
                <div className="text-sm font-medium text-gray-600">Company Size</div>
                <div className="text-gray-900">{agency.company_size}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Specialization */}
      {agency.specialization && agency.specialization.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Specializations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {agency.specialization.map((spec) => (
                <Badge key={spec} variant="secondary" className="px-3 py-1">
                  {spec}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
              <div className="text-sm text-gray-600">Total Projects</div>
              <div className="text-xs text-gray-500 mt-1">
                {activeProjects.length} active, {completedProjects.length} completed
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{totalPlacements}</div>
              <div className="text-sm text-gray-600">Total Placements</div>
              <div className="text-xs text-gray-500 mt-1">
                Successful placements across all projects
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{staff.length}</div>
              <div className="text-sm text-gray-600">Team Members</div>
              <div className="text-xs text-gray-500 mt-1">
                Active recruiters
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">{avgSuccessRate}%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
              <div className="text-xs text-gray-500 mt-1">
                Positions filled vs targeted
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Projects */}
      {projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Latest recruitment projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                  <div className="flex-1">
                    <h3 className="font-medium">{project.project_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {project.status}
                      </Badge>
                      {project.target_count && (
                        <Badge variant="outline" className="text-xs">
                          {project.positions_filled || 0}/{project.target_count} positions
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Team Members */}
      {staff.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Team Members</CardTitle>
            <CardDescription>Best performing recruiters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {staff
                .sort((a, b) => (b.candidates_placed || 0) - (a.candidates_placed || 0))
                .slice(0, 5)
                .map((member) => (
                  <div key={member.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div>
                      <h3 className="font-medium">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.role}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{member.candidates_placed || 0}</div>
                      <div className="text-sm text-gray-600">placements</div>
                      <div className="text-xs text-gray-500 mt-1">{member.success_rate || 0}% success</div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
