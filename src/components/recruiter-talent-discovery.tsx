import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Slider,
} from "@/components/ui/slider";
import {
  MapPin,
  Briefcase,
  GraduationCap,
  Search,
  Filter,
  Star,
  Mail,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { searchTalent } from "@/lib/supabase-enhanced";
import type { TalentSearchFilter, UniversalSearchResult } from "@/lib/enhanced-types";

interface RecruiterTalentDiscoveryProps {
  onTalentSelect?: (talentId: string) => void;
}

const SKILLS = [
  "React",
  "Node.js",
  "Python",
  "TypeScript",
  "SQL",
  "AWS",
  "Docker",
  "GraphQL",
  "Vue.js",
  "Angular",
  "Java",
  "C++",
  "Product Management",
  "UI/UX Design",
  "Data Analysis",
];

const UNIVERSITIES = [
  "University of Dar es Salaam",
  "Dar es Salaam Institute of Technology",
  "Open University of Tanzania",
  "Arusha Technical College",
  "Mbeya University of Science and Technology",
];

const LOCATIONS = [
  "Dar es Salaam",
  "Arusha",
  "Mbeya",
  "Dodoma",
  "Mwanza",
  "Remote",
  "Nationwide",
];

export function RecruiterTalentDiscovery({
  onTalentSelect,
}: RecruiterTalentDiscoveryProps) {
  const [showFilters, setShowFilters] = React.useState(true);
  const [filters, setFilters] = React.useState<TalentSearchFilter>({
    skills: [],
    locations: [],
    universities: [],
    verified_only: false,
    open_to_work: true,
  });

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["talent-search", filters],
    queryFn: () => searchTalent(filters),
  });

  const handleSkillToggle = (skill: string) => {
    setFilters({
      ...filters,
      skills: filters.skills?.includes(skill)
        ? filters.skills.filter((s) => s !== skill)
        : [...(filters.skills || []), skill],
    });
  };

  const handleLocationToggle = (location: string) => {
    setFilters({
      ...filters,
      locations: filters.locations?.includes(location)
        ? filters.locations.filter((l) => l !== location)
        : [...(filters.locations || []), location],
    });
  };

  const handleUniversityToggle = (university: string) => {
    setFilters({
      ...filters,
      universities: filters.universities?.includes(university)
        ? filters.universities.filter((u) => u !== university)
        : [...(filters.universities || []), university],
    });
  };

  const clearFilters = () => {
    setFilters({
      skills: [],
      locations: [],
      universities: [],
      verified_only: false,
      open_to_work: true,
    });
  };

  const activeFilterCount =
    (filters.skills?.length || 0) +
    (filters.locations?.length || 0) +
    (filters.universities?.length || 0) +
    (filters.verified_only ? 1 : 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar Filters */}
      <div className={`lg:col-span-1 ${!showFilters && "hidden lg:block"}`}>
        <Card className="sticky top-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
              {activeFilterCount > 0 && (
                <Badge>{activeFilterCount}</Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Skills */}
            <div>
              <h3 className="font-medium mb-3">Skills</h3>
              <div className="space-y-2">
                {SKILLS.map((skill) => (
                  <label
                    key={skill}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={filters.skills?.includes(skill) || false}
                      onCheckedChange={() => handleSkillToggle(skill)}
                    />
                    <span className="text-sm">{skill}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="font-medium mb-3">Location</h3>
              <div className="space-y-2">
                {LOCATIONS.map((location) => (
                  <label
                    key={location}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={filters.locations?.includes(location) || false}
                      onCheckedChange={() => handleLocationToggle(location)}
                    />
                    <span className="text-sm">{location}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* University */}
            <div>
              <h3 className="font-medium mb-3">University</h3>
              <div className="space-y-2">
                {UNIVERSITIES.map((university) => (
                  <label
                    key={university}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={
                        filters.universities?.includes(university) || false
                      }
                      onCheckedChange={() => handleUniversityToggle(university)}
                    />
                    <span className="text-sm">{university}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Verified Only */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.verified_only || false}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, verified_only: checked as boolean })
                  }
                />
                <span className="text-sm font-medium">Verified Only</span>
              </label>
            </div>

            {/* Open to Work */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.open_to_work !== false}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, open_to_work: checked as boolean })
                  }
                />
                <span className="text-sm font-medium">Open to Work</span>
              </label>
            </div>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <div className="lg:col-span-3 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Talent Results ({results.length})
          </h2>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Talent Cards */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              Loading talent...
            </CardContent>
          </Card>
        ) : results.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-600">
              No talent found matching your filters. Try adjusting your search.
            </CardContent>
          </Card>
        ) : (
          results.map((talent) => (
            <Card
              key={talent.id}
              className="hover:shadow-lg transition cursor-pointer"
              onClick={() => onTalentSelect?.(talent.id)}
            >
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Name & Title */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{talent.name}</h3>
                      <p className="text-gray-600">{talent.title}</p>
                      {talent.metadata?.verified && (
                        <div className="flex items-center gap-1 mt-1 text-blue-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm">Verified</span>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      Contact
                    </Button>
                  </div>

                  {/* Location */}
                  {talent.metadata?.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {talent.metadata.location}
                    </div>
                  )}

                  {/* Description */}
                  {talent.description && (
                    <p className="text-gray-700">{talent.description}</p>
                  )}

                  {/* Skills */}
                  {talent.metadata?.skills && (
                    <div className="flex flex-wrap gap-2">
                      {(talent.metadata.skills as string[])
                        .slice(0, 5)
                        .map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      {(talent.metadata.skills as string[]).length > 5 && (
                        <Badge variant="outline">
                          +{(talent.metadata.skills as string[]).length - 5}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Experience */}
                  {talent.metadata?.years_experience && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Briefcase className="h-4 w-4" />
                      {talent.metadata.years_experience} years experience
                    </div>
                  )}

                  {/* Education */}
                  {talent.metadata?.education && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <GraduationCap className="h-4 w-4" />
                      {talent.metadata.education}
                    </div>
                  )}

                  {/* Portfolio Preview */}
                  {talent.metadata?.portfolio_items && (
                    <div className="grid grid-cols-3 gap-2">
                      {(talent.metadata.portfolio_items as any[])
                        .slice(0, 3)
                        .map((item, idx) => (
                          <div
                            key={idx}
                            className="h-20 bg-gray-200 rounded-lg overflow-hidden"
                          >
                            {item.media_url && (
                              <img
                                src={item.media_url}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
