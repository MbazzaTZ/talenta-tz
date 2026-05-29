import * as React from "react";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { aiShortlistCandidates } from "@/lib/ai";

type Applicant = {
  id: string;
  applicant_id?: string;
  email?: string;
  cover_letter?: string;
  profiles?: {
    full_name?: string;
    email?: string;
  } | null;
};

type Job = {
  id: string;
  title: string;
  description: string;
};

export function AIShortlist({
  job,
  applicants,
  onComplete,
}: {
  job: Job;
  applicants: Applicant[];
  onComplete?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [ranked, setRanked] = React.useState<
    { email: string; name: string; score: number; reasoning: string }[]
  >([]);

  const handleShortlist = async () => {
    if (applicants.length === 0) {
      toast.error("No applicants to shortlist.");
      return;
    }

    setLoading(true);
    try {
      // Build JSON for AI
      const appJson = JSON.stringify(
        applicants.map((a) => ({
          email: a.profiles?.email || a.email || `applicant-${a.id}`,
          name: a.profiles?.full_name || "Anonymous",
          coverLetter: a.cover_letter ? a.cover_letter.slice(0, 500) : "",
        })),
      );

      const results = await aiShortlistCandidates(
        job.title,
        job.description,
        appJson,
      );

      if (results.length === 0) {
        toast.error("Could not rank candidates. Try again.");
        return;
      }

      setRanked(results);
      toast.success(`Ranked ${results.length} candidates by fit.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to shortlist.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-blue-100 text-blue-800";
    if (score >= 40) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="h-4 w-4 mr-1" />
          AI Shortlist
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI-Ranked Candidates for {job.title}</DialogTitle>
        </DialogHeader>

        {ranked.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              DeepSeek AI will analyze all {applicants.length} applicants and
              rank them by fit for this role. This takes a moment.
            </p>
            <Button onClick={handleShortlist} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing candidates...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Rank {applicants.length} Candidates
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {ranked.map((candidate, idx) => (
              <div
                key={candidate.email}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-sm">{candidate.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {candidate.email}
                    </p>
                  </div>
                  <Badge className={`${scoreColor(candidate.score)}`}>
                    {candidate.score}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {candidate.reasoning}
                </p>
              </div>
            ))}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-blue-800">
                Review these rankings, but use your judgment. Reach out to
                top candidates for interviews.
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setRanked([]);
                setOpen(false);
                onComplete?.();
              }}
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
