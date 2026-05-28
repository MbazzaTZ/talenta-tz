/**
 * Recruiter Talent Search Component
 * Advanced filtering for finding verified talent
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Briefcase,
  Filter,
  Map,
  BookOpen,
  CheckCircle2,
  Star,
  MessageCircle,
} from "lucide-react";
import { searchTalent } from "@/lib/supabase-enhanced";
import { VerificationBadge } from "./verification-badge";
import type { TalentSearchFilter } from "@/lib/enhanced-types";

const SKILLS = [
  "React",
  "Node.js",
  "Python",
  "Data Analysis",
  "Project Management",
  "UI/UX Design",
  "Full Stack",
  "DevOps",
];

const UNIVERSITIES = [
  "University of Dar es Salaam",
  "Dar es Salaam Institute of Technology",
  "Tanzanian Technical College",
  "Open University of Tanzania",
];

const LOCATIONS = [
  "Dar es Salaam",
  "Arusha",
  "Mbeya",
  "Dodoma",
  "Moshi",
  "Remote",
];

export interface RecruiterTalentSearchProps {
  onTalentSelect?: (talentId: string) => void;
}

export function RecruiterTalentSearch({
  onTalentSelect,
}: RecruiterTalentSearchProps) {
  const [filters, setFilters] = React.useState<TalentSearchFilter>({
    skills: [],
    locations: [],
    universities: [],
    verification_status: "verified",
    open_to_work: true,
  });

  const [page, setPage] = React.useState(0);
  const limit = 12;

  const { data: { results = [], total = 0 } = {}, isLoading } = useQuery({
    queryKey: ["recruiter-talent-search", filters, page],
    queryFn: () => searchTalent(filters, limit, page * limit),
  });

  const toggleFilter = (
    category: "skills" | "locations" | "universities",
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category]?.includes(value)
        ? prev[category].filter((v) => v !== value)
        : [...(prev[category] || []), value],
    }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({
      skills: [],
      locations: [],
      universities: [],
    });
    setPage(0);
  };

  const activeFilterCount = (filters.skills?.length || 0) + (filters.locations?.length || 0) + (filters.universities?.length || 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Filters Sidebar */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </span>
              {activeFilterCount > 0 && (
                <Badge>{activeFilterCount}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Verification Status */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Verification Status
              </label>
              <Button
                variant={
                  filters.verification_status === "verified"
                    ? "default"
                    : "outline"
                }
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    verification_status: "verified",
                  }))
                }
                className="w-full gap-2 justify-start"
              >
                <CheckCircle2 className="h-4 w-4" />
                Verified Only
              </Button>
            </div>

            {/* Open to Work */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Button
                variant={
                  filters.open_to_work ? "default" : "outline"
                }
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    open_to_work: !prev.open_to_work,
                  }))
                }
                className="w-full gap-2 justify-start"
              >
                <Star className="h-4 w-4" />
                Open to Work
              </Button>
            </div>

            <hr />

            {/* Skills */}
            <Accordion type="single" collapsible defaultValue="skills">
              <AccordionItem value="skills">
                <AccordionTrigger className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Skills
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-2">
                  {SKILLS.map((skill) => (
                    <label
                      key={skill}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.skills?.includes(skill) || false}
                        onChange={() =>
                          toggleFilter("skills", skill)
                        }
                        className="h-4 w-4 rounded"
                      />
                      <span className="text-sm">{skill}</span>
                    </label>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Universities */}
            <Accordion type="single" collapsible>
              <AccordionItem value="universities">
                <AccordionTrigger className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Universities
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-2">
                  {UNIVERSITIES.map((uni) => (
                    <label
                      key={uni}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={
                          filters.universities?.includes(uni) || false
                        }
                        onChange={() =>
                          toggleFilter("universities", uni)
                        }
                        className="h-4 w-4 rounded"
                      />
                      <span className="text-sm">{uni}</span>
                    </label>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Locations */}
            <Accordion type="single" collapsible>
              <AccordionItem value="locations">
                <AccordionTrigger className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Map className="h-4 w-4" />
                    Location
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-2">
                  {LOCATIONS.map((location) => (
                    <label
                      key={location}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={
                          filters.locations?.includes(location) || false
                        }
                        onChange={() =>
                          toggleFilter("locations", location)
                        }
                        className="h-4 w-4 rounded"
                      />
                      <span className="text-sm">{location}</span>
                    </label>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <div className="lg:col-span-3 space-y-6">
        {/* Stats */}
        <div className="text-sm text-muted-foreground">
          Showing {results.length > 0 ? page * limit + 1 : 0}–
          {Math.min((page + 1) * limit, total)} of {total} talents
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading talents...
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No talents found matching your criteria. Try adjusting your filters.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((result: any) => (
                <Card
                  key={result.id}
                  className="hover:shadow-lg transition cursor-pointer"
                  onClick={() => onTalentSelect?.(result.id)}
                >
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Avatar & Name */}
                      <div className="flex gap-3">
                        {result.avatar_url && (
                          <img
                            src={result.avatar_url}
                            alt={result.full_name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-semibold line-clamp-1">
                            {result.full_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {result.headline}
                          </div>
                        </div>
                      </div>

                      {/* Badges */}
                      <VerificationBadge
                        badges={result.user_badges || []}
                        verificationStatus={result.verification_status}
                        size="sm"
                        showLabel={true}
                      />

                      {/* Location */}
                      {result.location && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Map className="h-3 w-3" />
                          {result.location}
                        </div>
                      )}

                      {/* Bio */}
                      {result.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {result.bio}
                        </p>
                      )}

                      {/* Featured Showcase */}
                      {result.talent_showcases && result.talent_showcases.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-medium">
                            Featured Work
                          </div>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {result.talent_showcases.slice(0, 3).map((item: any) => (
                              <div
                                key={item.id}
                                className="flex-shrink-0 h-16 w-16 rounded-lg bg-muted overflow-hidden"
                              >
                                {item.thumbnail_url && (
                                  <img
                                    src={item.thumbnail_url}
                                    alt={item.title}
                                    className="h-full w-full object-cover"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action */}
                      <Button className="w-full gap-2">
                        <MessageCircle className="h-4 w-4" />
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {total > limit && (
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {page + 1} of {Math.ceil(total / limit)}
                </div>
                <Button
                  variant="outline"
                  disabled={(page + 1) * limit >= total}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
