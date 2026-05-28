import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Loader2, User2, Building2, GraduationCap, Briefcase, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type ResultType = "person" | "company" | "university" | "agency" | "project";
type Result = {
  id: string;
  type: ResultType;
  title: string;
  subtitle?: string;
};

const iconFor: Record<ResultType, React.ComponentType<{ className?: string }>> = {
  person: User2,
  company: Building2,
  university: GraduationCap,
  agency: Users,
  project: Briefcase,
};

function classifyCompany(industry?: string | null): ResultType {
  const s = (industry || "").toLowerCase();
  if (/(university|college|school|institute|education)/.test(s)) return "university";
  if (/(agency|recruit|staffing|consult)/.test(s)) return "agency";
  return "company";
}

export function HeaderSearch() {
  const navigate = useNavigate();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<Result[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  React.useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const term = `%${q.trim()}%`;
        const [people, companies, jobs] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name, headline")
            .or(`full_name.like.${term},headline.like.${term}`)
            .limit(5),
          supabase
            .from("companies")
            .select("id, name, industry, location")
            .or(`name.like.${term},industry.like.${term},location.like.${term}`)
            .limit(8),
          supabase
            .from("jobs")
            .select("id, title, location")
            .like("title", term)
            .limit(5),
        ]);

        const out: Result[] = [];
        (people.data || []).forEach((p: any) =>
          out.push({ id: p.id, type: "person", title: p.full_name || "Unnamed", subtitle: p.headline || undefined }),
        );
        (companies.data || []).forEach((c: any) =>
          out.push({
            id: c.id,
            type: classifyCompany(c.industry),
            title: c.name,
            subtitle: [c.industry, c.location].filter(Boolean).join(" · ") || undefined,
          }),
        );
        (jobs.data || []).forEach((j: any) =>
          out.push({ id: j.id, type: "project", title: j.title, subtitle: j.location || undefined }),
        );
        setResults(out);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [q]);

  const go = (r: Result) => {
    setOpen(false);
    setQ("");
    if (r.type === "person") navigate({ to: "/dashboard" });
    else if (r.type === "project") navigate({ to: "/job/$id", params: { id: r.id } });
    else navigate({ to: "/companies/$id", params: { id: r.id } });
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search people, companies, universities, agencies, projects..."
          className="pl-9 h-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {open && q.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border bg-popover shadow-lg max-h-96 overflow-y-auto z-50">
          {results.length === 0 && !loading ? (
            <div className="p-4 text-sm text-muted-foreground text-center">No results</div>
          ) : (
            <ul className="divide-y">
              {results.map((r) => {
                const Icon = iconFor[r.type];
                return (
                  <li key={`${r.type}-${r.id}`}>
                    <button
                      onClick={() => go(r)}
                      className="w-full flex items-start gap-3 p-3 hover:bg-muted text-left"
                    >
                      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{r.title}</div>
                        {r.subtitle && (
                          <div className="text-xs text-muted-foreground truncate">{r.subtitle}</div>
                        )}
                      </div>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {r.type}
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
