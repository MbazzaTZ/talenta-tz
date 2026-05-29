// @ts-nocheck
import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, Upload } from "lucide-react";
import { toast } from "sonner";
import { requestStudentVerification } from "@/lib/supabase-enhanced";

interface StudentVerificationRequestProps {
  studentId: string;
  studentName: string;
  studentEmail: string;
}

const INSTITUTIONS = [
  "University of Dar es Salaam",
  "Dar es Salaam Institute of Technology",
  "Open University of Tanzania",
  "Tanzanian Technical College",
  "Arusha Technical College",
];

export function StudentVerificationRequest({
  studentId,
  studentName,
  studentEmail,
}: StudentVerificationRequestProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = React.useState({
    institution_name: "",
    enrollment_number: "",
    graduation_date: "",
    document_url: "",
    notes: "",
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      requestStudentVerification(studentId, "", {
        student_name: studentName,
        student_email: studentEmail,
        institution_name: formData.institution_name,
        enrollment_number: formData.enrollment_number,
        graduation_date: formData.graduation_date,
        document_url: formData.document_url,
        notes: formData.notes,
        status: "pending",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-status", studentId] });
      toast.success("Verification request submitted! The institution will review it soon.");
      setFormData({
        institution_name: "",
        enrollment_number: "",
        graduation_date: "",
        document_url: "",
        notes: "",
      });
    },
    onError: () => {
      toast.error("Failed to submit verification request. Please try again.");
    },
  });

  const handleSubmit = () => {
    if (!formData.institution_name.trim() || !formData.enrollment_number.trim()) {
      toast.error("Institution and enrollment number are required");
      return;
    }
    submitMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-blue-600" />
          Student Verification
        </CardTitle>
        <CardDescription>
          Get verified by your institution to earn a verification badge and increase your credibility
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">How verification works:</h3>
              <ul className="text-sm text-blue-800 mt-1 space-y-1">
                <li>1. Submit your institution details and enrollment proof</li>
                <li>2. Your institution receives a verification request</li>
                <li>3. They review and approve or reject your request</li>
                <li>4. You get a "Verified Student" or "Verified Graduate" badge</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Institution */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Institution Name
            </label>
            <Select
              value={formData.institution_name}
              onValueChange={(value) =>
                setFormData({ ...formData, institution_name: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your institution" />
              </SelectTrigger>
              <SelectContent>
                {INSTITUTIONS.map((inst) => (
                  <SelectItem key={inst} value={inst}>
                    {inst}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Enrollment Number */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Enrollment/Student Number
            </label>
            <Input
              value={formData.enrollment_number}
              onChange={(e) =>
                setFormData({ ...formData, enrollment_number: e.target.value })
              }
              placeholder="e.g., STU2024001"
            />
          </div>

          {/* Graduation Date */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Graduation Date (if applicable)
            </label>
            <Input
              type="date"
              value={formData.graduation_date}
              onChange={(e) =>
                setFormData({ ...formData, graduation_date: e.target.value })
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty if still studying
            </p>
          </div>

          {/* Document URL */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Enrollment Proof (URL)
            </label>
            <Input
              value={formData.document_url}
              onChange={(e) =>
                setFormData({ ...formData, document_url: e.target.value })
              }
              placeholder="https://example.com/enrollment-certificate.pdf"
            />
            <p className="text-xs text-gray-500 mt-1">
              Link to your enrollment certificate or student ID
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Additional Information (Optional)
            </label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Any additional information to help with verification..."
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="w-full gap-2"
          >
            {submitMutation.isPending ? (
              <>
                <Clock className="h-4 w-4" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Submit Verification Request
              </>
            )}
          </Button>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              ⚠️ Make sure all information is accurate. False information may result in permanent rejection.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
