/**
 * Report Abuse Component
 * Allows users to report fake profiles, scam jobs, and other violations
 */

import React from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { AlertTriangle, Flag } from "lucide-react";
import { reportContent } from "@/lib/supabase-enhanced";

const REPORT_TYPES = [
  {
    value: "fake_profile",
    label: "Fake Profile",
    description: "This profile appears to be fake or fraudulent",
  },
  {
    value: "fake_job",
    label: "Fake/Scam Job",
    description: "This job posting is fake or scam-related",
  },
  {
    value: "harassment",
    label: "Harassment",
    description: "I'm being harassed by this user",
  },
  {
    value: "inappropriate_content",
    label: "Inappropriate Content",
    description: "This contains inappropriate or offensive content",
  },
  {
    value: "scam",
    label: "Scam",
    description: "I believe this is a scam attempt",
  },
];

export interface ReportAbusProps {
  reportedUserId?: string;
  reportedJobId?: string;
  trigger?: React.ReactNode;
}

export function ReportAbuse({
  reportedUserId,
  reportedJobId,
  trigger,
}: ReportAbusProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [reportType, setReportType] = React.useState<string>("");
  const [description, setDescription] = React.useState("");
  const [evidenceUrls, setEvidenceUrls] = React.useState<string[]>(["", "", ""]);
  const [agreeToFalseReport, setAgreeToFalseReport] = React.useState(false);

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!reportType || !description.trim()) {
        throw new Error("Please fill in all required fields");
      }

      if (!agreeToFalseReport) {
        throw new Error("Please confirm you understand false reports are prohibited");
      }

      return reportContent({
        reported_by: "", // Will be set from auth context
        reported_user_id: reportedUserId,
        reported_job_id: reportedJobId,
        report_type: reportType as any,
        description: description.trim(),
        evidence_urls: evidenceUrls.filter((url) => url.trim()),
      });
    },
    onSuccess: () => {
      toast.success("Report submitted. Our team will review it shortly.");
      setIsOpen(false);
      setReportType("");
      setDescription("");
      setEvidenceUrls(["", "", ""]);
      setAgreeToFalseReport(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit report");
    },
  });

  const handleAddEvidenceUrl = (index: number, url: string) => {
    const newUrls = [...evidenceUrls];
    newUrls[index] = url;
    setEvidenceUrls(newUrls);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* Trigger Button */}
      {trigger ? (
        <button onClick={() => setIsOpen(true)}>{trigger}</button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="text-red-600 gap-2"
        >
          <Flag className="h-4 w-4" />
          Report
        </Button>
      )}

      {/* Dialog Content */}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Report This {reportedUserId ? "User" : "Job"}
          </DialogTitle>
          <DialogDescription>
            Help us keep Talenta-TZ safe. Your report is confidential.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Type */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              What's the problem? *
            </label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div>{type.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {type.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Tell us more *
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide as much detail as possible. This helps us investigate faster."
              rows={4}
            />
            <div className="text-xs text-muted-foreground mt-1">
              Minimum 20 characters required
            </div>
          </div>

          {/* Evidence Links */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Evidence Links (Optional)
            </label>
            <div className="space-y-2">
              {evidenceUrls.map((url, index) => (
                <Input
                  key={index}
                  value={url}
                  onChange={(e) =>
                    handleAddEvidenceUrl(index, e.target.value)
                  }
                  placeholder={`Evidence URL ${index + 1} (e.g., screenshot, chat log)`}
                  type="url"
                />
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Add links to screenshots or evidence of the violation
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-sm text-yellow-800">
              <strong>Important:</strong> False reports may result in account restrictions or suspension.
              Only submit reports you believe are accurate and in good faith.
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={agreeToFalseReport}
              onCheckedChange={(checked) =>
                setAgreeToFalseReport(checked === true)
              }
              className="mt-1"
            />
            <span className="text-sm">
              I confirm that this report is true and accurate to the best of my
              knowledge.
            </span>
          </label>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <div className="text-sm font-medium text-blue-900">
              What happens next?
            </div>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Our safety team will review your report</li>
              <li>• We'll take action within 24-48 hours</li>
              <li>• You won't be notified of the outcome for privacy reasons</li>
              <li>• We take all reports seriously</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={reportMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => reportMutation.mutate()}
            disabled={
              !reportType ||
              description.length < 20 ||
              !agreeToFalseReport ||
              reportMutation.isPending
            }
          >
            {reportMutation.isPending ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Compact report button for use in lists
 */
export function CompactReportButton({
  reportedUserId,
  reportedJobId,
}: {
  reportedUserId?: string;
  reportedJobId?: string;
}) {
  return (
    <ReportAbuse
      reportedUserId={reportedUserId}
      reportedJobId={reportedJobId}
      trigger={<Flag className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-red-600" />}
    />
  );
}
