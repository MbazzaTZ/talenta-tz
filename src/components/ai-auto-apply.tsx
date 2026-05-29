import * as React from "react";
import { Loader2, Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { aiFindMatchingJobs } from "@/lib/ai";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function AIAutoApply() {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [applying, setApplying] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<{
    keywords: string[];
    jobTitles: string[];
    industries: string[];
    reasoning: string;
  } | null>(null);
  const [appliedJobs, setAppliedJobs] = React.useState<string[]>([]);

  // Fetch user profile for AI analysis
  const { data: profile } = useQuery({
    queryKey: ["seeker-profile", user?.id],
    enabled: !!user?.id && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select(
          "full_name,headline,bio,skills,work_experience,education_items",
        )
        .eq("id", user!.id)
        .single();
      return data;
    },
  });

  const handleAnalyze = async () => {
    if (!profile) {
      toast.error("Could not load your profile.");
      return;
    }

    setAnalyzing(true);
    try {
      const profileText = `
Name: ${profile.full_name}
Headline: ${profile.headline}
Bio: ${profile.bio}
Skills: ${profile.skills?.join(", ")}
Experience: ${
        profile.work_experience
          ? JSON.stringify(profile.work_experience).slice(0, 1000)
          : "Not specified"
      }
Education: ${
        profile.education_items
          ? JSON.stringify(profile.education_items).slice(0, 500)
          : "Not specified"
      }
      `.trim();

      const result = await aiFindMatchingJobs(profileText);
      setSuggestions(result);
      toast.success("Job suggestions ready. Ready to auto-apply?");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to analyze profile.";
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAutoApply = async () => {
    if (!suggestions || !user) return;

    setApplying(true);
    try {
      const { data: matchingJobs } = await supabase
        .from("jobs")
        .select("id,title,salary_min,salary_max")
        .eq("status", "published")
        .or(
          suggestions.jobTitles
            .map((t) => `title.ilike.%${t}%`)
            .join(","),
        );

      if (!matchingJobs || matchingJobs.length === 0) {
        toast.info("No matching jobs found. Broaden your search.");
        return;
      }

      // Get already applied jobs to avoid duplicates
      const { data: existingApps } = await supabase
        .from("applications")
        .select("job_id")
        .eq("applicant_id", user.id);

      const alreadyApplied = new Set(
        existingApps?.map((a) => a.job_id) ?? [],
      );
      const toApply = matchingJobs.filter((j) => !alreadyApplied.has(j.id));

      if (toApply.length === 0) {
        toast.info("You've already applied to all matching jobs.");
        return;
      }

      // Bulk insert applications
      const { error } = await supabase.from("applications").insert(
        toApply.map((job) => ({
          job_id: job.id,
          applicant_id: user.id,
          status: "applied",
          cover_letter: `Auto-applied via Talentra AI. Interested in ${job.title}.`,
        })),
      );

      if (error) throw error;

      setAppliedJobs(toApply.map((j) => j.id));
      toast.success(`Applied to ${toApply.length} matching jobs!`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to apply to jobs.";
      toast.error(msg);
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Zap className="h-4 w-4 mr-1" />
          AI Auto-Apply
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI Auto-Apply to Matching Jobs</DialogTitle>
        </DialogHeader>

        {appliedJobs.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <h4 className="font-semibold text-green-800">Success!</h4>
                <p className="text-sm text-green-700">
                  Applied to {appliedJobs.length} jobs matching your profile.
                </p>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                setOpen(false);
                setSuggestions(null);
                setAppliedJobs([]);
              }}
            >
              Close
            </Button>
          </div>
        ) : suggestions ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-2">Job Suggestions</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {suggestions.reasoning}
              </p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Job titles
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {suggestions.jobTitles.map((t) => (
                      <Badge key={t} variant="secondary">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Industries
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {suggestions.industries.map((i) => (
                      <Badge key={i} variant="outline">
                        {i}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-blue-800">
                AI will search for jobs matching these criteria and apply on
                your behalf.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSuggestions(null)}
                disabled={applying}
              >
                Back
              </Button>
              <Button
                onClick={handleAutoApply}
                disabled={applying}
                className="flex-1"
              >
                {applying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Apply Now
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              AI will analyze your profile and automatically apply to matching
              jobs. This saves you time!
            </p>
            <Button
              onClick={handleAnalyze}
              disabled={analyzing || !profile}
              className="w-full"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing your profile...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Analyze & Get Suggestions
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
