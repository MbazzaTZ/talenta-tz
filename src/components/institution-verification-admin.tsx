/**
 * Institution Verification Admin Interface
 * Allows institutions to review and approve student verification requests
 */

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, Download } from "lucide-react";
import { getVerificationRequests, approveVerification, rejectVerification } from "@/lib/supabase-enhanced";
import type { StudentVerificationRequest } from "@/lib/enhanced-types";

interface InstitutionVerificationAdminProps {
  institutionId: string;
  adminId: string;
}

const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending", icon: Clock },
  verified: { color: "bg-green-100 text-green-800", label: "Verified", icon: CheckCircle2 },
  rejected: { color: "bg-red-100 text-red-800", label: "Rejected", icon: XCircle },
};

export function InstitutionVerificationAdmin({
  institutionId,
  adminId,
}: InstitutionVerificationAdminProps) {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = React.useState<StudentVerificationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [isApproving, setIsApproving] = React.useState(false);
  const [isRejecting, setIsRejecting] = React.useState(false);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["verification-requests", institutionId],
    queryFn: () => getVerificationRequests(institutionId),
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => approveVerification(requestId, adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-requests", institutionId] });
      setSelectedRequest(null);
      setIsApproving(false);
      toast.success("Student verified successfully!");
    },
    onError: () => {
      toast.error("Failed to verify student");
      setIsApproving(false);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => rejectVerification(requestId, rejectionReason, adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-requests", institutionId] });
      setSelectedRequest(null);
      setRejectionReason("");
      setIsRejecting(false);
      toast.success("Request rejected");
    },
    onError: () => {
      toast.error("Failed to reject request");
      setIsRejecting(false);
    },
  });

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "verified");
  const rejectedRequests = requests.filter((r) => r.status === "rejected");

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{pendingRequests.length}</div>
              <div className="text-sm text-muted-foreground">Pending Reviews</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{approvedRequests.length}</div>
              <div className="text-sm text-muted-foreground">Verified Students</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{rejectedRequests.length}</div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Verification Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading requests...</div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No pending requests</div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-start justify-between rounded-lg border p-4 hover:bg-muted/50 transition">
                  <div className="flex-1">
                    <div className="font-medium">{request.student_name}</div>
                    <div className="text-sm text-muted-foreground">{request.student_email}</div>
                    {request.enrollment_number && (
                      <div className="text-sm text-muted-foreground">Enrollment: {request.enrollment_number}</div>
                    )}
                    {request.graduation_date && (
                      <div className="text-sm text-muted-foreground">Graduation: {request.graduation_date}</div>
                    )}
                    {request.document_url && (
                      <div className="mt-2">
                        <a
                          href={request.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Download className="h-4 w-4" />
                          View Document
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => {
                        setSelectedRequest(request);
                        setIsApproving(true);
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRequest(request);
                        setIsRejecting(true);
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approved Requests */}
      {approvedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Verified Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {approvedRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3">
                  <div>
                    <div className="font-medium text-green-900">{request.student_name}</div>
                    <div className="text-sm text-green-700">{request.student_email}</div>
                  </div>
                  <Badge className="bg-green-600">Verified</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Dialog */}
      <Dialog open={isApproving} onOpenChange={setIsApproving}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium">Student Name</div>
              <div className="text-sm text-muted-foreground">{selectedRequest?.student_name}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Email</div>
              <div className="text-sm text-muted-foreground">{selectedRequest?.student_email}</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              Once approved, this student will receive a "Verified Student" badge on their profile.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproving(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedRequest) {
                  approveMutation.mutate(selectedRequest.id);
                }
              }}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? "Verifying..." : "Verify Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={isRejecting} onOpenChange={setIsRejecting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Verification Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium">Student Name</div>
              <div className="text-sm text-muted-foreground">{selectedRequest?.student_name}</div>
            </div>
            <div>
              <label className="text-sm font-medium">Reason for Rejection</label>
              <Textarea
                placeholder="Explain why this request is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejecting(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedRequest && rejectionReason.trim()) {
                  rejectMutation.mutate(selectedRequest.id);
                } else {
                  toast.error("Please provide a reason for rejection");
                }
              }}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
