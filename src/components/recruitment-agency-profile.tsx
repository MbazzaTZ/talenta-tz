// @ts-nocheck
/**
 * Recruitment Agency Profile Component
 * Displays agency information, statistics, and services
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Users,
  MapPin,
  Globe,
  Phone,
  Mail,
  Star,
  TrendingUp,
} from "lucide-react";
import { getRecruitmentAgency, getAgencyProjects, getAgencyStaff, getAgencyClients } from "@/lib/supabase-agency";
import type { RecruitmentAgency } from "@/lib/enhanced-types";

interface RecruitmentAgencyProfileProps {
  agencyId: string;
  isEditable?: boolean;
  onEdit?: () => void;
}

export function RecruitmentAgencyProfile({
  agencyId,
  isEditable = false,
  onEdit,
}: RecruitmentAgencyProfileProps) {
  const { data: agency, isLoading: agencyLoading } = useQuery({
    queryKey: ["recruitment-agency", agencyId],
    queryFn: () => getRecruitmentAgency(agencyId),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["agency-projects", agencyId],
    queryFn: () => getAgencyProjects(agencyId),
    enabled: !!agency,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["agency-staff", agencyId],
    queryFn: () => getAgencyStaff(agencyId),
    enabled: !!agency,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["agency-clients", agencyId],
    queryFn: () => getAgencyClients(agencyId),
    enabled: !!agency,
  });

  if (agencyLoading) {
    return <div className="text-center py-12">Loading agency profile...</div>;
  }

  if (!agency) {
    return <div className="text-center py-12">Agency not found</div>;
  }

  const activeProjects = projects.filter((p) => p.status === "active").length;
  const completedProjects = projects.filter((p) => p.status === "completed").length;
  const totalPlacements = projects.reduce((sum, p) => sum + (p.positions_filled || 0), 0);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Logo & Info */}
            <div className="flex-shrink-0">
              {agency.logo_url && (
                <img
                  src={agency.logo_url}
                  alt={agency.name}
                  className="h-32 w-32 rounded-lg object-cover border"
                />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold">{agency.name}</h1>
                  {agency.verified && (
                    <Badge className="mt-2 bg-blue-100 text-blue-800">
                      ✓ Verified Agency
                    </Badge>
                  )}
                </div>
                {isEditable && (
                  <Button onClick={onEdit} variant="outline">
                    Edit Profile
                  </Button>
                )}
              </div>

              {agency.description && (
                <p className="mt-3 text-muted-foreground">{agency.description}</p>
              )}

              {/* Contact Info */}
              <div className="mt-4 space-y-2 text-sm">
                {agency.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {agency.location}
                    {agency.country && `, ${agency.country}`}
                  </div>
                )}
                {agency.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${agency.email}`} className="hover:underline">
                      {agency.email}
                    </a>
                  </div>
                )}
                {agency.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {agency.phone}
                  </div>
                )}
                {agency.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <a
                      href={agency.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {agency.website}
                    </a>
                  </div>
                )}
              </div>

              {/* Specialization */}
              {agency.specialization && agency.specialization.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">Specialization:</div>
                  <div className="flex flex-wrap gap-2">
                    {agency.specialization.map((spec) => (
                      <Badge key={spec} variant="secondary">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Briefcase className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-3xl font-bold">{projects.length}</div>
              <div className="text-sm text-muted-foreground">Total Projects</div>
              <div className="text-xs text-green-600 mt-1">
                {activeProjects} active
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-3xl font-bold">{staff.length}</div>
              <div className="text-sm text-muted-foreground">Team Members</div>
              <div className="text-xs text-green-600 mt-1">
                Active recruiters
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-3xl font-bold">{totalPlacements}</div>
              <div className="text-sm text-muted-foreground">Total Placements</div>
              <div className="text-xs text-green-600 mt-1">
                {completedProjects} completed projects
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Star className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <div className="text-3xl font-bold">{clients.length}</div>
              <div className="text-sm text-muted-foreground">Active Clients</div>
              <div className="text-xs text-muted-foreground mt-1">
                {agency.founded_year && `Since ${agency.founded_year}`}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* About Section */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="font-medium mb-1">Company Size</div>
            <div className="text-muted-foreground">{agency.company_size || "Not specified"}</div>
          </div>

          {agency.founded_year && (
            <div>
              <div className="font-medium mb-1">Founded</div>
              <div className="text-muted-foreground">{agency.founded_year}</div>
            </div>
          )}

          {agency.specialization && agency.specialization.length > 0 && (
            <div>
              <div className="font-medium mb-2">Areas of Expertise</div>
              <div className="space-y-1">
                {agency.specialization.map((spec) => (
                  <div key={spec} className="text-sm text-muted-foreground">
                    • {spec}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="font-medium mb-1">Subscription Tier</div>
            <Badge className="capitalize">{agency.subscription_tier || "free"}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span>Recruitment & Talent Acquisition</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span>HR Consulting & Strategy</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span>Executive Search</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span>Contract & Staffing Solutions</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 font-bold">✓</span>
              <span>Candidate Screening & Assessment</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}