import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Users,
  Building2,
  School,
  Search,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { universalSearch } from "@/lib/supabase-enhanced";
import type { UniversalSearchResult } from "@/lib/enhanced-types";

interface UniversalSearchProps {
  onResultSelect?: (result: UniversalSearchResult) => void;
  compact?: boolean;
}

const resultTypeConfig = {
  job: {
    icon: Briefcase,
    color: "bg-blue-100 text-blue-800",
    label: "Job",
  },
  job_seeker: {
    icon: Users,
    color: "bg-green-100 text-green-800",
    label: "Job Seeker",
  },
  employee: {
    icon: Users,
    color: "bg-purple-100 text-purple-800",
    label: "Employee",
  },
  employer: {
    icon: Building2,
    color: "bg-orange-100 text-orange-800",
    label: "Employer",
  },
  company: {
    icon: Building2,
    color: "bg-red-100 text-red-800",
    label: "Company",
  },
  institution: {
    icon: School,
    color: "bg-indigo-100 text-indigo-800",
    label: "Institution",
  },
};

export function UniversalSearch({
  onResultSelect,
  compact = false,
}: UniversalSearchProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [results, setResults] = React.useState<UniversalSearchResult[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [popularSearches, setPopularSearches] = React.useState([
    "React Developer",
    "Product Manager",
    "Data Scientist",
    "UX Designer",
    "Software Engineer",
  ]);

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      if (query.length < 2) {
        setResults([]);
        return [];
      }
      return universalSearch(query, 10);
    },
    onSuccess: (data) => {
      setResults(data || []);
      setIsOpen(true);
    },
    onError: () => {
      toast.error("Search failed. Please try again.");
    },
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      searchMutation.mutate(query);
    } else {
      setResults([]);
    }
  };

  const handleResultClick = (result: UniversalSearchResult) => {
    if (onResultSelect) {
      onResultSelect(result);
    } else {
      // Default navigation based on result type
      switch (result.entity_type) {
        case "job":
          navigate({ to: `/job/${result.id}` });
          break;
        case "job_seeker":
        case "employee":
          navigate({ to: `/profile/${result.id}` });
          break;
        case "employer":
        case "company":
          navigate({ to: `/company/${result.id}` });
          break;
        case "institution":
          navigate({ to: `/institution/${result.id}` });
          break;
      }
    }
    setIsOpen(false);
    setSearchQuery("");
  };

  if (compact) {
    return (
      <div className="relative w-full">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder="Search jobs, people, companies..."
            className="pl-10"
          />
        </div>

        {/* Results Dropdown */}
        {isOpen && (
          <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg">
            <CardContent className="p-0">
              {searchMutation.isPending && (
                <div className="p-4 text-center text-gray-600">
                  Searching...
                </div>
              )}

              {results.length > 0 && !searchMutation.isPending ? (
                <div className="max-h-96 overflow-y-auto">
                  {results.map((result) => {
                    const config =
                      resultTypeConfig[
                        result.entity_type as keyof typeof resultTypeConfig
                      ];
                    const Icon = config?.icon || Search;

                    return (
                      <button
                        key={`${result.entity_type}-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-0 transition flex items-start gap-3"
                      >
                        <Icon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">
                              {result.title || result.name}
                            </h3>
                            {config && (
                              <Badge className={`${config.color} text-xs`}>
                                {config.label}
                              </Badge>
                            )}
                          </div>
                          {result.description && (
                            <p className="text-sm text-gray-600 truncate mt-0.5">
                              {result.description}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              ) : !searchMutation.isPending && searchQuery.length >= 2 ? (
                <div className="p-4 text-center text-gray-600">
                  No results found for "{searchQuery}"
                </div>
              ) : searchQuery.length === 0 ? (
                <div className="p-4">
                  <div className="text-xs font-medium text-gray-700 mb-2">
                    Popular searches
                  </div>
                  <div className="space-y-1">
                    {popularSearches.map((search) => (
                      <button
                        key={search}
                        onClick={() => handleSearch(search)}
                        className="w-full text-left px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded transition"
                      >
                        <TrendingUp className="h-3 w-3 inline mr-1" />
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Box */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search jobs, people, companies, institutions..."
              className="pl-10 h-12 text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results or Suggestions */}
      {searchQuery.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-4">Popular Searches</h3>
            <div className="space-y-2">
              {popularSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => handleSearch(search)}
                  className="w-full text-left px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                >
                  <TrendingUp className="h-4 w-4 inline mr-2 text-gray-400" />
                  {search}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : searchMutation.isPending ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-600">
            Searching...
          </CardContent>
        </Card>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Found {results.length} results for "{searchQuery}"
          </div>
          {results.map((result) => {
            const config =
              resultTypeConfig[
                result.entity_type as keyof typeof resultTypeConfig
              ];
            const Icon = config?.icon || Search;

            return (
              <Card
                key={`${result.entity_type}-${result.id}`}
                className="hover:shadow-lg transition cursor-pointer"
                onClick={() => handleResultClick(result)}
              >
                <CardContent className="pt-6 flex items-start gap-4">
                  <Icon className="h-12 w-12 text-gray-300 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold">
                        {result.title || result.name}
                      </h2>
                      {config && (
                        <Badge className={config.color}>{config.label}</Badge>
                      )}
                    </div>
                    {result.description && (
                      <p className="text-gray-600 mt-1">{result.description}</p>
                    )}
                    {result.metadata && (
                      <div className="text-sm text-gray-500 mt-2 space-y-0.5">
                        {result.metadata.location && (
                          <div>📍 {result.metadata.location}</div>
                        )}
                        {result.metadata.salary_range && (
                          <div>💰 {result.metadata.salary_range}</div>
                        )}
                        {result.metadata.verified && (
                          <div>✓ Verified</div>
                        )}
                      </div>
                    )}
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-gray-600">
            No results found for "{searchQuery}"
          </CardContent>
        </Card>
      )}
    </div>
  );
}
