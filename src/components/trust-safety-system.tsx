// @ts-nocheck
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Flag,
  CheckCircle2,
  Clock,
  Shield,
  TrendingDown,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { reportContent, getUserSafetyMetrics } from "@/lib/supabase-enhanced";
import type { Report, SafetyMetrics } from "@/lib/enhanced-types";

interface TrustSafetySystemProps {
  userId?: string;
  isAdmin?: boolean;
}

const reportTypes = [
  {
    value: "fake_profile",
    label: "Fake Profile",
    description: "This appears to be a fake or fraudulent account",
  },
  {
    value: "fake_job",
    label: "Fake Job",
    description: "This job posting appears to be spam or fraudulent",
  },
  {
    value: "harassment",
    label: "Harassment",
    description: "I'm being harassed or threatened",
  },
  {
    value: "inappropriate_content",
    label: "Inappropriate Content",
    description: "This contains inappropriate or offensive material",
  },
  {
    value: "scam",
    label: "Scam",
    description: "This appears to be a scam attempt",
  },
];

const severityLevels = {
  low: { color: "bg-yellow-100 text-yellow-800", label: "Low" },
  medium: { color: "bg-orange-100 text-orange-800", label: "Medium" },
  high: { color: "bg-red-100 text-red-800", label: "High" },
};

export function TrustSafetySystem({
  userId,
  isAdmin = false,
}: TrustSafetySystemProps) {
  const queryClient = useQueryClient();
  const [isReportDialogOpen, setIsReportDialogOpen] = React.useState(false);
  const [reportType, setReportType] = React.useState<string>("");
  const [reportDetails, setReportDetails] = React.useState("");
  const [evidenceUrl, setEvidenceUrl] = React.useState("");

  const { data: safetyMetrics } = useQuery({
    queryKey: ["safety-metrics", userId],
    queryFn: () => (userId ? getUserSafetyMetrics(userId) : Promise.resolve(null)),
    enabled: !!userId,
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!reportType.trim() || !reportDetails.trim()) {
        throw new Error("Report type and details are required");
      }

      return reportContent(userId || "", {
        reported_item_type: "profile",
        reported_item_id: userId || "",
        report_type: reportType as any,
        description: reportDetails,
        evidence_url: evidenceUrl || undefined,
        severity: "medium",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Report submitted successfully. Our team will review it shortly.");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to submit report. Please try again.");
    },
  });

  const resetForm = () => {
    setReportType("");
    setReportDetails("");
    setEvidenceUrl("");
    setIsReportDialogOpen(false);
  };

  const handleSubmitReport = () => {
    reportMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Safety Score Banner */}
      {safetyMetrics && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Safety Score */}
              <div className="text-center">
                <Shield className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-3xl font-bold text-blue-600">
                  {Math.round(safetyMetrics.trust_score)}%
                </div>
                <div className="text-sm text-blue-800 mt-1">Safety Score</div>
              </div>

              {/* Reports Count */}
              <div className="text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <div className="text-3xl font-bold text-orange-600">
                  {safetyMetrics.reports_filed}
                </div>
                <div className="text-sm text-orange-800 mt-1">Reports Filed</div>
              </div>

              {/* Risk Level */}
              <div className="text-center">
                <TrendingDown className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <div className="text-lg font-bold">
                  <Badge
                    className={
                      safetyMetrics.risk_level === "high"
                        ? "bg-red-100 text-red-800"
                        : safetyMetrics.risk_level === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                    }
                  >
                    {safetyMetrics.risk_level?.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-sm text-gray-700 mt-1">Risk Level</div>
              </div>
            </div>

            {safetyMetrics.risk_level === "high" && (
              <div className="mt-4 p-4 bg-red-100 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  ⚠️ This account has been flagged for suspicious activity. Our safety team is investigating.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Report Abuse Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-600" />
            Report a Problem
          </CardTitle>
          <CardDescription>
            Help us keep Talenta-TZ safe by reporting suspicious activity
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Button
            onClick={() => setIsReportDialogOpen(true)}
            variant="outline"
            className="gap-2 text-red-600 hover:text-red-700 border-red-200"
          >
            <Flag className="h-4 w-4" />
            Report This
          </Button>
        </CardContent>
      </Card>

      {/* Safety Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Safety Tips</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="space-y-3">
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium">Verify Identities</h3>
                <p className="text-sm text-gray-600">
                  Always verify the identity of people you interact with. Check their
                  profile verification badge.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium">Meet in Safe Locations</h3>
                <p className="text-sm text-gray-600">
                  For interviews or meetings, choose public locations. Always let someone
                  know where you're going.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium">Protect Personal Information</h3>
                <p className="text-sm text-gray-600">
                  Never share personal details like passwords, banking info, or government
                  IDs.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium">Trust Your Instincts</h3>
                <p className="text-sm text-gray-600">
                  If something feels off, it probably is. Report suspicious activity
                  immediately.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium">Secure Your Account</h3>
                <p className="text-sm text-gray-600">
                  Use a strong password, enable two-factor authentication, and keep your
                  profile updated.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Report a Problem</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium mb-1">
                What are you reporting?
              </label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-gray-600">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Details */}
            <div>
              <label className="block text-sm font-medium mb-1">Details</label>
              <Textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide details about what you're reporting..."
                rows={4}
              />
            </div>

            {/* Evidence URL */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Evidence (Optional)
              </label>
              <Input
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="Link to screenshots or evidence"
              />
            </div>

            {/* Privacy Notice */}
            <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 flex gap-2">
              <Lock className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>
                Your report is confidential. We take all reports seriously and will
                investigate appropriately.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReport}
              disabled={reportMutation.isPending}
              className="gap-2"
            >
              <Flag className="h-4 w-4" />
              {reportMutation.isPending ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
