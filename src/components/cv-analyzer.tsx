import * as React from "react";
import { Loader2, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { aiAnalyzeCv } from "@/lib/ai";
import { extractTextFromFile } from "@/lib/file-extract";

export function CVAnalyzer() {
  const [cv, setCv] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadFile = async (file?: File) => {
    if (!file) return;
    setLoading(true);
    try {
      const { text } = await extractTextFromFile(file);
      if (text.length < 50) {
        toast.error("Couldn't extract enough text from the file.");
        return;
      }
      setCv(text);
      toast.success("CV loaded. Click Analyze to get feedback.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to read file.";
      toast.error(msg);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAnalyze = async () => {
    if (cv.trim().length < 50) {
      toast.error("Please paste or upload a CV first (at least 50 characters).");
      return;
    }
    setLoading(true);
    try {
      const result = await aiAnalyzeCv(cv);
      setFeedback(result);
      toast.success("Analysis complete!");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to analyze CV.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            CV Analyzer
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Upload or paste your CV below. Our AI will analyze it and give you
            detailed feedback on how to improve it.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Your CV</label>
            <div className="space-y-3">
              <Textarea
                placeholder="Paste your CV text here... (or upload a PDF/Word file)"
                value={cv}
                onChange={(e) => setCv(e.target.value)}
                rows={10}
                className="font-mono text-xs"
              />

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={(e) => handleUploadFile(e.target.files?.[0])}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-8 text-center transition hover:border-accent hover:bg-muted/50 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">
                  {loading ? "Reading file..." : "Click to upload CV"}
                </span>
                <span className="text-xs text-muted-foreground">
                  PDF, Word (.docx) or .txt · max 15 MB
                </span>
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleAnalyze}
              disabled={loading || cv.trim().length < 50}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze & Get Feedback"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCv("");
                setFeedback(null);
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {feedback && (
        <Card>
          <CardHeader>
            <CardTitle>AI Feedback & Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <pre className="bg-muted p-4 rounded-lg overflow-auto whitespace-pre-wrap text-sm text-foreground font-sans">
                {feedback}
              </pre>
            </div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                navigator.clipboard.writeText(feedback);
                toast.success("Feedback copied to clipboard!");
              }}
            >
              Copy Feedback
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
