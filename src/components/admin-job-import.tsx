import * as React from "react";
import { toast } from "sonner";
import { Loader2, Link2, FileText, ClipboardPaste, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  REGIONS,
  INDUSTRIES,
  POSITION_LEVELS,
  CONTRACT_TYPES,
  QUALIFICATIONS,
} from "@/lib/kazi-data";

/**
 * Admin Job Import
 * Lets an admin bring in a job from an external source (a link or pasted text),
 * extract the obvious fields heuristically, review/correct them in a form, and
 * save through the SAME jobs insert path the normal post-job flow uses.
 *
 * Imported jobs are stored exactly like normal jobs (no "external" label),
 * per product decision. apply_url is set when a source link is provided so
 * "Apply" can still route to the original posting if desired.
 */

type ParsedJob = {
  title: string;
  company: string;
  location: string;
  region: string;
  industry: string;
  position_level: string;
  contract_type: string;
  qualification: string;
  salary_min: string;
  salary_max: string;
  description: string;
  apply_url: string;
};

const EMPTY: ParsedJob = {
  title: "",
  company: "",
  location: "",
  region: "",
  industry: "",
  position_level: "mid",
  contract_type: "permanent",
  qualification: "",
  salary_min: "",
  salary_max: "",
  description: "",
  apply_url: "",
};

// Lightweight heuristic extraction from raw pasted text.
// This is deliberately conservative — admin reviews everything before saving.
function extractFromText(text: string): Partial<ParsedJob> {
  const out: Partial<ParsedJob> = {};
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length) {
    // First substantial line is usually the title
    out.title = lines[0].slice(0, 200);
  }

  const lower = text.toLowerCase();

  // Location: match a known region name
  const region = REGIONS.find((r) => lower.includes(r.toLowerCase()));
  if (region) {
    out.region = region;
    out.location = region;
  }

  // Industry: match a known industry label
  const ind = INDUSTRIES.find(
    (i) => lower.includes(i.en.toLowerCase()) || lower.includes(i.value),
  );
  if (ind) out.industry = ind.value;

  // Contract type
  const ct = CONTRACT_TYPES.find((c) => lower.includes(c.value));
  if (ct) out.contract_type = ct.value;

  // Position level
  const pl = POSITION_LEVELS.find((p) => lower.includes(p.value.replace("_", " ")));
  if (pl) out.position_level = pl.value;

  // Company: look for "at X" or "Company: X"
  const companyMatch =
    text.match(/company[:\-]\s*(.+)/i) || text.match(/\bat\s+([A-Z][\w&.\- ]{2,40})/);
  if (companyMatch) out.company = companyMatch[1].trim().slice(0, 100);

  // Salary numbers (TZS)
  const salaryNums = text.match(/(\d[\d,\.]{3,})/g);
  if (salaryNums && salaryNums.length) {
    const nums = salaryNums
      .map((s) => parseInt(s.replace(/[,\.]/g, ""), 10))
      .filter((n) => n >= 50000 && n <= 100000000)
      .sort((a, b) => a - b);
    if (nums.length === 1) out.salary_min = String(nums[0]);
    if (nums.length >= 2) {
      out.salary_min = String(nums[0]);
      out.salary_max = String(nums[nums.length - 1]);
    }
  }

  // Description: the full text, trimmed
  out.description = text.trim().slice(0, 8000);

  return out;
}

const CONTRACT_FALLBACK = "permanent";

export function AdminJobImport({ onImported }: { onImported?: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<"link" | "text">("text");
  const [sourceUrl, setSourceUrl] = React.useState("");
  const [rawText, setRawText] = React.useState("");
  const [parsing, setParsing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<ParsedJob>(EMPTY);
  const [reviewing, setReviewing] = React.useState(false);

  const set = (patch: Partial<ParsedJob>) => setForm((f) => ({ ...f, ...patch }));

  const handleParseText = () => {
    if (rawText.trim().length < 20) {
      toast.error("Paste a bit more text so we can extract the job details.");
      return;
    }
    setParsing(true);
    const extracted = extractFromText(rawText);
    setForm({ ...EMPTY, ...extracted, apply_url: sourceUrl.trim() });
    setReviewing(true);
    setParsing(false);
    toast.success("Extracted what we could — please review and correct.");
  };

  const handleFetchLink = async () => {
    const url = sourceUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      toast.error("Enter a valid http(s) job link.");
      return;
    }
    setParsing(true);
    try {
      // Browser CORS blocks most direct fetches of external job pages.
      // We use a public read-only text proxy to grab the page text, then
      // run the same heuristic extraction. Admin still reviews everything.
      const proxy = `https://r.jina.ai/${url}`;
      const res = await fetch(proxy);
      if (!res.ok) throw new Error("fetch failed");
      const pageText = await res.text();
      const extracted = extractFromText(pageText);
      setForm({ ...EMPTY, ...extracted, apply_url: url });
      setReviewing(true);
      toast.success("Fetched the page — please review and correct the fields.");
    } catch {
      // Graceful fallback: let admin paste the text manually
      toast.error("Couldn't auto-fetch that link. Paste the job text instead.");
      setTab("text");
      set({ apply_url: url });
    } finally {
      setParsing(false);
    }
  };

  const resetAll = () => {
    setForm(EMPTY);
    setRawText("");
    setSourceUrl("");
    setReviewing(false);
    setTab("text");
  };

  const handleSave = async () => {
    if (form.title.trim().length < 3) {
      toast.error("Title is required (min 3 characters).");
      return;
    }
    if (form.description.trim().length < 30) {
      toast.error("Description must be at least 30 characters.");
      return;
    }
    if (!form.industry) {
      toast.error("Pick an industry.");
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be signed in as admin.");
        setSaving(false);
        return;
      }

      // Find or create the company by name (imported jobs need a company_id).
      let companyId: string | null = null;
      const companyName = form.company.trim() || "External listing";

      const { data: existing } = await supabase
        .from("companies")
        .select("id")
        .ilike("name", companyName)
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        companyId = existing.id;
      } else {
        const { data: created, error: cErr } = await supabase
          .from("companies")
          .insert({
            owner_id: user.id,
            name: companyName,
          })
          .select("id")
          .single();
        if (cErr) throw cErr;
        companyId = created.id;
      }

      const { error: jErr } = await supabase.from("jobs").insert({
        company_id: companyId,
        posted_by: user.id,
        created_by_role: "admin",
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim() || "Tanzania",
        region: form.region.trim() || form.location.trim() || null,
        industry: form.industry || "",
        position_level: (form.position_level || "mid") as never,
        contract_type: (form.contract_type || CONTRACT_FALLBACK) as never,
        qualification: (form.qualification || null) as never,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
        currency: "TZS",
        salary_negotiable: !form.salary_min && !form.salary_max,
        status: "published",
        featured: false,
        apply_method: form.apply_url ? "url" : "internal",
        apply_url: form.apply_url.trim() || null,
      } as never);

      if (jErr) throw jErr;

      toast.success("Job imported and published.");
      setOpen(false);
      resetAll();
      onImported?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to import job.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) resetAll();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          <Sparkles className="mr-2 h-4 w-4" />
          Import job
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import a job from another source</DialogTitle>
        </DialogHeader>

        {!reviewing ? (
          <div className="space-y-5">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={tab === "text" ? "default" : "outline"}
                size="sm"
                onClick={() => setTab("text")}
              >
                <ClipboardPaste className="mr-2 h-4 w-4" />
                Paste text
              </Button>
              <Button
                type="button"
                variant={tab === "link" ? "default" : "outline"}
                size="sm"
                onClick={() => setTab("link")}
              >
                <Link2 className="mr-2 h-4 w-4" />
                From link
              </Button>
            </div>

            {tab === "link" ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="src">Job posting URL</Label>
                  <Input
                    id="src"
                    placeholder="https://example.com/jobs/software-engineer"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  We&apos;ll try to read the page and pre-fill the fields. If the site blocks
                  automated reads, paste the text instead.
                </p>
                <Button onClick={handleFetchLink} disabled={parsing} className="w-full">
                  {parsing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fetching…
                    </>
                  ) : (
                    "Fetch & extract"
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="src2">Source link (optional)</Label>
                  <Input
                    id="src2"
                    placeholder="https://… (where this job came from)"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="raw">Paste the full job description</Label>
                  <Textarea
                    id="raw"
                    rows={10}
                    placeholder="Paste the job title, company, location, requirements, salary…"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                  />
                </div>
                <Button onClick={handleParseText} disabled={parsing} className="w-full">
                  {parsing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Extracting…
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Extract fields
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Review and correct the extracted details before publishing.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Job title *</Label>
                <Input value={form.title} onChange={(e) => set({ title: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={form.company} onChange={(e) => set({ company: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={form.location}
                  onChange={(e) => set({ location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Region</Label>
                <Select value={form.region} onValueChange={(v) => set({ region: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Industry *</Label>
                <Select value={form.industry} onValueChange={(v) => set({ industry: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((i) => (
                      <SelectItem key={i.value} value={i.value}>
                        {i.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Level</Label>
                <Select
                  value={form.position_level}
                  onValueChange={(v) => set({ position_level: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITION_LEVELS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contract type</Label>
                <Select
                  value={form.contract_type}
                  onValueChange={(v) => set({ contract_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Qualification</Label>
                <Select
                  value={form.qualification}
                  onValueChange={(v) => set({ qualification: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUALIFICATIONS.map((q) => (
                      <SelectItem key={q.value} value={q.value}>
                        {q.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Source / Apply URL</Label>
                <Input
                  value={form.apply_url}
                  onChange={(e) => set({ apply_url: e.target.value })}
                  placeholder="https://…"
                />
              </div>

              <div className="space-y-2">
                <Label>Salary min (TZS)</Label>
                <Input
                  type="number"
                  value={form.salary_min}
                  onChange={(e) => set({ salary_min: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Salary max (TZS)</Label>
                <Input
                  type="number"
                  value={form.salary_max}
                  onChange={(e) => set({ salary_max: e.target.value })}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Description *</Label>
                <Textarea
                  rows={8}
                  value={form.description}
                  onChange={(e) => set({ description: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-3 pt-2">
              <Button variant="ghost" onClick={() => setReviewing(false)}>
                Back
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing…
                  </>
                ) : (
                  "Publish job"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
