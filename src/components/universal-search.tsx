/**
 * Universal Search Component
 * Search across jobs, job seekers, employees, employers, and companies
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Briefcase,
  Users,
  Building2,
  School,
  MapPin,
  CheckCircle2,
  Search as SearchIcon,
  ArrowRight,
} from "lucide-react";
import { universalSearch } from "@/lib/supabase-enhanced";
import type { SearchableEntity, UniversalSearchResult } from "@/lib/enhanced-types";

const entityIcons: Record<SearchableEntity, React.ComponentType<{ className: string }>> = {
  job: Briefcase,
  job_seeker: Users,
  employee: Users,
  employer: Building2,
  company: Building2,
  institution: School,
};

const entityLabels: Record<SearchableEntity, string> = {
  job: "Job",
  job_seeker: "Job Seeker",
  employee: "Employee",
  employer: "Employer",
  company: "Company",
  institution: "Institution",
};

export interface UniversalSearchProps {
  onNavigate?: (result: UniversalSearchResult) => void;
  placeholder?: string;
  showFilters?: boolean;
  minChars?: number;
  debounceMs?: number;
}

export function UniversalSearch({
  onNavigate,
  placeholder = "Search jobs, people, companies...",
  showFilters = true,
  minChars = 2,
  debounceMs = 300,
}: UniversalSearchProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedFilter, setSelectedFilter] = React.useState<SearchableEntity | "all">("all");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= minChars) {
        setDebouncedQuery(searchQuery);
      } else {
        setDebouncedQuery("");
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, minChars, debounceMs]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["universal-search", debouncedQuery, selectedFilter],
    queryFn: () => universalSearch(debouncedQuery, 20),
    enabled: debouncedQuery.length >= minChars,
  });

  const filteredResults =
    selectedFilter === "all"
      ? results
      : results.filter((r) => r.type === selectedFilter);

  const handleSelect = (result: UniversalSearchResult) => {
    setSearchQuery("");
    setDebouncedQuery("");

    if (onNavigate) {
      onNavigate(result);
    } else {
      // Default navigation
      switch (result.type) {
        case "job":
          navigate({ to: `/jobs/${result.id}` });
          break;
        case "job_seeker":
        case "employee":
          navigate({ to: `/profile/${result.id}` });
          break;
        case "company":
        case "employer":
          navigate({ to: `/companies/${result.id}` });
          break;
        case "institution":
          navigate({ to: `/institution/${result.id}` });
          break;
      }
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="space-y-2">
        {/* Search Input */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-4"
          />
        </div>

        {/* Filter - Optional */}
        {showFilters && (
          <Select value={selectedFilter} onValueChange={(val) => setSelectedFilter(val as any)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Results</SelectItem>
              <SelectItem value="job">Jobs</SelectItem>
              <SelectItem value="job_seeker">Job Seekers</SelectItem>
              <SelectItem value="company">Companies</SelectItem>
              <SelectItem value="employer">Employers</SelectItem>
              <SelectItem value="institution">Institutions</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Results */}
      {debouncedQuery.length >= minChars && (
        <div className="bg-white rounded-lg border shadow-lg max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Searching...</div>
          ) : filteredResults.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No results found for "{debouncedQuery}"
            </div>
          ) : (
            <div className="divide-y">
              {filteredResults.map((result) => {
                const Icon = entityIcons[result.type];

                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className="w-full text-left p-4 hover:bg-muted transition flex items-start gap-3"
                  >
                    <div className="mt-1 flex-shrink-0">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium line-clamp-1">
                          {result.title}
                        </div>
                        {result.verified && (
                          <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        )}
                      </div>

                      {result.subtitle && (
                        <div className="text-sm text-muted-foreground">
                          {result.subtitle}
                        </div>
                      )}

                      {result.location && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {result.location}
                        </div>
                      )}

                      {result.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {result.description}
                        </p>
                      )}
                    </div>

                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                );
              })}

              {/* View All Results Button */}
              {filteredResults.length > 0 && (
                <div className="p-3 bg-muted">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      // Navigate to search results page
                      navigate({
                        to: "/search",
                        search: { q: debouncedQuery, type: selectedFilter },
                      });
                    }}
                  >
                    View All Results ({filteredResults.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Popular Searches - Show when empty */}
      {searchQuery.length === 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase">
            Popular Searches
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {["React Developer", "Product Manager", "Design", "Sales"].map((term) => (
              <button
                key={term}
                onClick={() => setSearchQuery(term)}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-muted transition text-left"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Minimal search bar version - for headers/navigation
 */
export function UniversalSearchBar() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative flex-1 max-w-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 rounded-lg border bg-muted px-3 py-2 text-sm text-muted-foreground hover:bg-muted/80"
      >
        <SearchIcon className="h-4 w-4" />
        <span>Search...</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 right-0 z-50">
          <UniversalSearch onNavigate={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
}
