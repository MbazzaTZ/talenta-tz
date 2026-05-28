import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Search as SearchIcon,
  Users,
  Building2,
  School,
  Briefcase,
  FolderKanban,
  Loader2,
  BadgeCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type ResultType = "people" | "company" | "university" | "agency" | "project";

interface SearchResult {
  type: ResultType;
  id: string;
  title: string;
  subtitle?: string | null;
  avatar?: string | null;
  verified?: boolean;
}

const TYPE_META: Record<ResultType, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  people: { label: "People", icon: Users },
  company: { label: "Company", icon: Building2 },
  university: { label: "University", icon: School },
  agency: { label: "Agency", icon: Briefcase },
  project: { label: "Project", icon: FolderKanban },
};

function classifyCompany(industry?: string | null): ResultType {
  const i = (industry || "").toLowerCase();
  if (i.includes("educ") || i.includes("univers") || i.includes("school") || i.includes("college"))
    return "university";
  if (i.includes("agency") || i.includes("recruit") || i.includes("staffing") || i.includes("ngo"))
    return "agency";
  return "company";
}

async function searchAll(q: string): Promise<SearchResult[]> {
  const term = `%${q}%`;
  const [peopleRes, companyRes, projectRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, headline, avatar_url, verification_status")
      .or(`full_name.ilike.${term},headline.ilike.${term}`)
      .limit(5),
    supabase
      .from("companies")
      .select("id, name, industry, location, logo_url, verified")
      .ilike("name", term)
      .limit(8),
    supabase
      .from("jobs")
      .select("id, title, location, companies(name)")
      .ilike("title", term)
      .eq("status", "published")
      .limit(5),
  ]);

  const people: SearchResult[] =
    (peopleRes.data || []).map((p: any) => ({
      type: "people",
      id: p.id,
      title: p.full_name || "User",
      subtitle: p.headline,
      avatar: p.avatar_url,
      verified: p.verification_status === "verified",
    }));

  const companies: SearchResult[] = (companyRes.data || []).map((c: any) => ({
    type: classifyCompany(c.industry),
    id: c.id,
    title: c.name,
    subtitle: c.location || c.industry,
    avatar: c.logo_url,
    verified: c.verified,
  }));

  const projects: SearchResult[] = (projectRes.data || []).map((j: any) => ({
    type: "project",
    id: j.id,
    title: j.title,
    subtitle: j.companies?.name || j.location,
  }));

  return [...people, ...companies, ...projects];
}

export function HeaderSearch({ className }: { className?: string }) {
  const navigate = useNavigate();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [q, setQ] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ["header-search", debounced],
    queryFn: () => searchAll(debounced),
    enabled: debounced.length >= 2,
    staleTime: 30_000,
  });

  function go(r: SearchResult) {
    setOpen(false);
    setQ("");
    if (r.type === "people") navigate({ to: "/dashboard" }); // profile route may not exist
    else if (r.type === "project") navigate({ to: "/job/$id", params: { id: r.id } });
    else navigate({ to: "/companies/$id", params: { id: r.id } });
  }

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-md", className)}>
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={q}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          placeholder="Search people, companies, universities…"
          className="h-8 pl-8 pr-8 text-sm bg-muted/50 border-border/60 focus-visible:bg-background"
        />
        {isFetching && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
        )}
      </div>

      {open && debounced.length >= 2 && (
        <div className="absolute top-full mt-2 left-0 right-0 z-50 rounded-xl border border-border bg-popover shadow-lg overflow-hidden max-h-[420px] overflow-y-auto">
          {!data || data.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              {isFetching ? "Searching…" : `No results for "${debounced}"`}
            </div>
          ) : (
            <ul className="py-1">
              {data.map((r) => {
                const meta = TYPE_META[r.type];
                const Icon = meta.icon;
                return (
                  <li key={`${r.type}-${r.id}`}>
                    <button
                      onClick={() => go(r)}
                      className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-muted transition-colors"
                    >
                      <div className="h-8 w-8 rounded-md bg-muted grid place-items-center overflow-hidden shrink-0">
                        {r.avatar ? (
                          <img src={r.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium truncate">{r.title}</span>
                          {r.verified && <BadgeCheck className="h-3.5 w-3.5 text-accent shrink-0" />}
                        </div>
                        {r.subtitle && (
                          <div className="text-xs text-muted-foreground truncate">{r.subtitle}</div>
                        )}
                      </div>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {meta.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
