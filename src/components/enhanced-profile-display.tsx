import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Briefcase,
  BookOpen,
  Award,
  Link as LinkIcon,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  MapPin,
} from "lucide-react";
import { getRecruitmentAgency, getAgencyProjects } from "@/lib/supabase-agency";
import { VerificationBadge } from "./verification-badge";
import type { EnhancedUserProfile, UserBadge } from "@/lib/enhanced-types";

interface EnhancedProfileDisplayProps {
  profile: EnhancedUserProfile;
  isOwnProfile: boolean;
}

export function EnhancedProfileDisplay({
  profile,
  isOwnProfile,
}: EnhancedProfileDisplayProps) {
  const profileCompleteness = calculateProfileCompleteness(profile);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                {profile.avatar_url && (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="h-16 w-16 rounded-full object-cover border"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                  {profile.headline && (
                    <p className="text-gray-600 mt-1">{profile.headline}</p>
                  )}
                  {profile.location && (
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </div>
                  )}
                </div>
              </div>

              {/* Badges */}
              {profile.badges && profile.badges.length > 0 && (
                <div className="mt-4">
                  <VerificationBadge
                    badges={profile.badges}
                    verificationStatus={profile.verification_status as any}
                    size="md"
                  />
                </div>
              )}

              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-700 mt-4">{profile.bio}</p>
              )}
            </div>

            {/* Profile Completeness */}
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{profileCompleteness}%</div>
              <div className="text-sm text-gray-600">Profile Complete</div>
              {isOwnProfile && profileCompleteness < 100 && (
                <Button variant="outline" className="mt-2" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Complete Profile
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="skills" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Skills
          </TabsTrigger>
          <TabsTrigger value="experience" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Experience
          </TabsTrigger>
          <TabsTrigger value="education" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Education
          </TabsTrigger>
          <TabsTrigger value="certificates" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Certificates
          </TabsTrigger>
          <TabsTrigger value="links" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Links
          </TabsTrigger>
        </TabsList>

        {/* Skills */}
        <TabsContent value="skills">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Skills</CardTitle>
              {isOwnProfile && <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Add Skill</Button>}
            </CardHeader>
            <CardContent>
              {profile.skills && profile.skills.length > 0 ? (
                <div className="space-y-3">
                  {profile.skills.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="flex-1">
                        <h3 className="font-medium">{skill.name}</h3>
                        {skill.proficiency_level && (
                          <Badge variant="secondary" className="mt-1">
                            {skill.proficiency_level}
                          </Badge>
                        )}
                        {skill.years_of_experience && (
                          <p className="text-sm text-gray-600 mt-1">
                            {skill.years_of_experience} years experience
                          </p>
                        )}
                      </div>
                      {skill.endorsed_count !== undefined && (
                        <div className="text-right ml-4">
                          <div className="text-lg font-bold">{skill.endorsed_count}</div>
                          <div className="text-xs text-gray-600">endorsements</div>
                        </div>
                      )}
                      {isOwnProfile && (
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="ghost"><Edit2 className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  {isOwnProfile
                    ? "Add your skills to improve your profile"
                    : "No skills added yet"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Experience */}
        <TabsContent value="experience">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Work Experience</CardTitle>
              {isOwnProfile && <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Add Experience</Button>}
            </CardHeader>
            <CardContent>
              {profile.experience && profile.experience.length > 0 ? (
                <div className="space-y-4">
                  {profile.experience.map((exp) => (
                    <div key={exp.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-lg">{exp.title}</h3>
                          <p className="text-gray-600">{exp.company}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(exp.start_date).toLocaleDateString()} -{" "}
                            {exp.is_current
                              ? "Present"
                              : exp.end_date
                                ? new Date(exp.end_date).toLocaleDateString()
                                : "N/A"}
                          </div>
                          {exp.location && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <MapPin className="h-4 w-4" />
                              {exp.location}
                            </div>
                          )}
                          {exp.description && (
                            <p className="text-gray-700 mt-2">{exp.description}</p>
                          )}
                        </div>
                        {isOwnProfile && (
                          <div className="flex gap-2 ml-4">
                            <Button size="sm" variant="ghost"><Edit2 className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  {isOwnProfile ? "Add your work experience" : "No experience added yet"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Education */}
        <TabsContent value="education">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Education</CardTitle>
              {isOwnProfile && <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Add Education</Button>}
            </CardHeader>
            <CardContent>
              {profile.education && profile.education.length > 0 ? (
                <div className="space-y-4">
                  {profile.education.map((edu) => (
                    <div key={edu.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{edu.degree}</h3>
                          <p className="text-gray-600">{edu.institution}</p>
                          <p className="text-sm text-gray-600">{edu.field_of_study}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(edu.start_date).getFullYear()} -{" "}
                            {edu.end_date
                              ? new Date(edu.end_date).getFullYear()
                              : "Present"}
                          </div>
                          {edu.grade && (
                            <Badge variant="outline" className="mt-2">
                              Grade: {edu.grade}
                            </Badge>
                          )}
                        </div>
                        {isOwnProfile && (
                          <div className="flex gap-2 ml-4">
                            <Button size="sm" variant="ghost"><Edit2 className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  {isOwnProfile ? "Add your education history" : "No education added yet"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certificates */}
        <TabsContent value="certificates">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Certifications</CardTitle>
              {isOwnProfile && <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Add Certificate</Button>}
            </CardHeader>
            <CardContent>
              {profile.certifications && profile.certifications.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.certifications.map((cert) => (
                    <div key={cert.id} className="border rounded-lg p-4">
                      <h3 className="font-medium">{cert.name}</h3>
                      <p className="text-sm text-gray-600">{cert.issuer}</p>
                      <div className="text-sm text-gray-600 mt-2">
                        Issued: {new Date(cert.issue_date).toLocaleDateString()}
                      </div>
                      {cert.credential_url && (
                        <a
                          href={cert.credential_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm mt-2 block"
                        >
                          View Credential →
                        </a>
                      )}
                      {isOwnProfile && (
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="ghost"><Edit2 className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  {isOwnProfile ? "Add your certifications" : "No certifications added yet"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Links */}
        <TabsContent value="links">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Social & Portfolio Links</CardTitle>
              {isOwnProfile && <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Add Link</Button>}
            </CardHeader>
            <CardContent>
              {profile.social_links && profile.social_links.length > 0 ? (
                <div className="space-y-3">
                  {profile.social_links.map((link) => (
                    <div key={link.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="flex-1">
                        <h3 className="font-medium capitalize">{link.platform}</h3>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {link.display_name || link.url}
                        </a>
                      </div>
                      {isOwnProfile && (
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="ghost"><Edit2 className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  {isOwnProfile ? "Add your social and portfolio links" : "No links added yet"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Portfolio */}
      {profile.portfolio_url && (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={profile.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-2"
            >
              <LinkIcon className="h-4 w-4" />
              View Portfolio
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function calculateProfileCompleteness(profile: EnhancedUserProfile): number {
  let completed = 0;
  let total = 10;

  if (profile.full_name) completed++;
  if (profile.headline) completed++;
  if (profile.bio) completed++;
  if (profile.location) completed++;
  if (profile.avatar_url) completed++;
  if (profile.skills && profile.skills.length > 0) completed++;
  if (profile.experience && profile.experience.length > 0) completed++;
  if (profile.education && profile.education.length > 0) completed++;
  if (profile.certifications && profile.certifications.length > 0) completed++;
  if (profile.social_links && profile.social_links.length > 0) completed++;

  return Math.round((completed / total) * 100);
}
