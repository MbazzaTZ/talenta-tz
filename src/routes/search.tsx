// @ts-nocheck
import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Search as SearchIcon,
  Briefcase,
  Building2,
  User2,
  GraduationCap,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiteHeader, SiteFooter, MobileBottomNav } from "@/components/site-chrome";
import { universalSearch } from "@/lib/supabase-enhanced";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || "",
    type: (search.type as string) || "all",
  }),
  component: SearchResults,
});

const TYPE_META: Record<
  string,
  { icon: typeof Briefcase; label: string; route: string; param: string }
> = {
  job: { icon: Briefcase, label: "Job", route: "/jobs/$id", param: "id" },
  company: { icon: Building2, label: "Company", route: "/companies/$id", param: "id" },
  employer: { icon: Building2, label: "Employer", route: "/companies/$id", param: "id" },
  job_seeker: { icon: User2, label: "Job Seeker", route: "", param: "" },
  employee: { icon: User2, label: "Employee", route: "", param: "" },
  institution: { icon: GraduationCap, label: "Institution", route: "", param: "" },
};

function SearchResults() {
  const { q, type } = Route.useSearch();
  const navigate = useNavigate();
  const [query, setQuery] = React.useState(q);
  const [filter, setFilter] = React.useState(type);

  // Keep input in sync if URL changes
  React.useEffect(() => {
    setQuery(q);
    setFilter(type);
  }, [q, type]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["search-page", q],
    queryFn: () => universalSearch(q, 50),
    enabled: q.length >= 2,
  });

  const filtered =
    filter === "all" ? results : results.filter((r) => r.type === filter);

  const handleSearch = () => {
    navigate({ to: "/search", search: { q: query, type: filter } });
  };

  const handleResultClick = (result: { type: string; id: string }) => {
    const meta = TYPE_META[result.type];
    if (meta?.route) {
      navigate({ to: meta.route, params: { [meta.param]: result.id } });
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0 bg-background">
      <SiteHeader />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Search bar */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs, companies, people..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="job">Jobs</SelectItem>
              <SelectItem value="company">Companies</SelectItem>
              <SelectItem value="job_seeker">Job Seekers</SelectItem>
              <SelectItem value="institution">Institutions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results header */}
        <div className="mb-4">
          <h1 className="font-display text-xl font-bold">
            {q ? `Results for "${q}"` : "Search"}
          </h1>
          {q && !isLoading && (
            <p className="text-sm text-muted-foreground mt-1">
              {filtered.length} {filtered.length === 1 ? "result" : "results"} found
            </p>
          )}
        </div>

        {/* Results */}
        {!q ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <SearchIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-display font-semibold">Start searching</p>
            <p className="text-sm text-muted-foreground mt-1">
              Type a keyword above to find jobs, companies, and people.
            </p>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length ? (
          <div className="space-y-3">
            {filtered.map((result) => {
              const meta = TYPE_META[result.type] ?? TYPE_META.job;
              const Icon = meta.icon;
              const clickable = !!meta.route;
              return (
                <Card
                  key={`${result.type}-${result.id}`}
                  className={`p-4 transition-all ${
                    clickable ? "cursor-pointer hover:shadow-md" : ""
                  }`}
                  onClick={() => clickable && handleResultClick(result)}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 grid place-items-center shrink-0 overflow-hidden">
                      {result.image_url ? (
                        <img
                          src={result.image_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Icon className="h-5 w-5 text-accent" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">
                          {result.title}
                        </h3>
                        {result.verified && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        )}
                      </div>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">
                          {result.subtitle}
                        </p>
                      )}
                      {result.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {result.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {meta.label}
                        </Badge>
                        {result.location && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5" />
                            {result.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <SearchIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-display font-semibold">No results found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try a different keyword or filter.
            </p>
          </div>
        )}
      </div>

      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
