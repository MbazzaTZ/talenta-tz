import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Settings, Save } from "lucide-react";
import { toast } from "sonner";
import { updateRecruitmentAgency } from "@/lib/supabase-agency";
import type { RecruitmentAgency } from "@/lib/enhanced-types";

interface AgencySettingsProps {
  agencyId: string;
  agency: RecruitmentAgency;
}

export function AgencySettings({ agencyId, agency }: AgencySettingsProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = React.useState({
    name: agency.name,
    email: agency.email,
    phone: agency.phone || "",
    website: agency.website || "",
    description: agency.description || "",
    location: agency.location || "",
    country: agency.country || "",
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateRecruitmentAgency(agencyId, {
        ...formData,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency", agencyId] });
      toast.success("Settings updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update settings");
    },
  });

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    updateMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Agency Settings
          </CardTitle>
          <CardDescription>Manage your agency information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Agency Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Agency Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your Agency Name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Email Address
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@agency.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Phone Number
            </label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Website
            </label>
            <Input
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://www.agency.com"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Location
            </label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="City, State"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Country
            </label>
            <Input
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="Country"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              About Your Agency
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell potential clients about your agency..."
              rows={4}
            />
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={updateMutation.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Info */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Your current plan and limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Current Plan</div>
              <Badge className="mt-2 capitalize">{agency.subscription_tier || "free"}</Badge>
            </div>
            <div>
              <div className="text-sm text-gray-600">Active Projects</div>
              <div className="text-2xl font-bold mt-2">{agency.max_projects || 10}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Max Team Size</div>
              <div className="text-2xl font-bold mt-2">{agency.max_staff || 50}</div>
            </div>
          </div>

          {agency.subscription_tier === "free" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-900">
                Upgrade your plan to unlock more projects and team members. Contact support for details.
              </p>
              <Button variant="outline" className="mt-3">
                View Plans
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agency Status */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Status</CardTitle>
          <CardDescription>Your agency's verification status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Agency Verification</h3>
              <p className="text-sm text-gray-600 mt-1">
                {agency.verified
                  ? "Your agency is verified and appears with a badge on your profile"
                  : "Complete verification to build trust with clients"}
              </p>
            </div>
            <Badge className={agency.verified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
              {agency.verified ? "✓ Verified" : "Not Verified"}
            </Badge>
          </div>

          {!agency.verified && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-900 mb-3">
                To get verified, you need to:
              </p>
              <ul className="text-sm text-yellow-800 space-y-1 ml-4">
                <li>• Complete your agency profile with all details</li>
                <li>• Verify your email and phone number</li>
                <li>• Complete at least one successful placement</li>
                <li>• Maintain a positive rating from clients</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
