// @ts-nocheck
/**
 * Agency Staff Management Component
 * Manage recruitment team members and assign to projects
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Award,
  TrendingUp,
} from "lucide-react";
import { getAgencyStaff, addAgencyStaff, updateStaffMember, removeStaffMember } from "@/lib/supabase-agency";
import type { RecruitmentAgencyStaff } from "@/lib/enhanced-types";

interface AgencyStaffManagerProps {
  agencyId: string;
  isAdmin?: boolean;
}

const roleConfig = {
  recruiter: { color: "bg-blue-100 text-blue-800", label: "Recruiter" },
  manager: { color: "bg-purple-100 text-purple-800", label: "Manager" },
  lead: { color: "bg-green-100 text-green-800", label: "Lead Recruiter" },
  director: { color: "bg-red-100 text-red-800", label: "Director" },
};

export function AgencyStaffManager({ agencyId, isAdmin = false }: AgencyStaffManagerProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingStaff, setEditingStaff] = React.useState<RecruitmentAgencyStaff | null>(null);
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone: "",
    role: "recruiter" as const,
    specialization: [] as string[],
    bio: "",
  });

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["agency-staff", agencyId],
    queryFn: () => getAgencyStaff(agencyId),
  });

  const addMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      addAgencyStaff(agencyId, {
        user_id: "", // In real app, get from auth
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        specialization: data.specialization,
        bio: data.bio,
        is_active: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-staff", agencyId] });
      resetForm();
      toast.success("Staff member added successfully!");
    },
    onError: () => {
      toast.error("Failed to add staff member");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (staffId: string) => removeStaffMember(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-staff", agencyId] });
      toast.success("Staff member removed");
    },
    onError: () => {
      toast.error("Failed to remove staff member");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "recruiter",
      specialization: [],
      bio: "",
    });
    setEditingStaff(null);
    setIsDialogOpen(false);
  };

  const handleAddSpecialization = (spec: string) => {
    if (spec.trim() && !formData.specialization.includes(spec.trim())) {
      setFormData({
        ...formData,
        specialization: [...formData.specialization, spec.trim()],
      });
    }
  };

  const recruiterCount = staff.filter((s) => s.role === "recruiter").length;
  const managerCount = staff.filter((s) => s.role === "manager").length;
  const totalPlacements = staff.reduce((sum, s) => sum + (s.candidates_placed || 0), 0);
  const avgSuccessRate =
    staff.length > 0
      ? Math.round(
          staff.reduce((sum, s) => sum + (s.success_rate || 0), 0) / staff.length
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Team Management
          </h2>
          <p className="text-muted-foreground mt-1">Manage recruitment team members</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Member
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{staff.length}</div>
              <div className="text-sm text-muted-foreground">Team Members</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{recruiterCount}</div>
              <div className="text-sm text-muted-foreground">Recruiters</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{totalPlacements}</div>
              <div className="text-sm text-muted-foreground">Total Placements</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{avgSuccessRate}%</div>
              <div className="text-sm text-muted-foreground">Avg. Success Rate</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading team members...
          </CardContent>
        </Card>
      ) : staff.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No team members yet. {isAdmin && "Add your first recruiter to get started."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {staff.map((member) => {
            const roleInfo = roleConfig[member.role as keyof typeof roleConfig];

            return (
              <Card key={member.id} className="hover:shadow-lg transition">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{member.name}</div>
                        <Badge className={roleInfo.color}>{roleInfo.label}</Badge>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => removeMutation.mutate(member.id)}
                            disabled={removeMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-1 text-sm">
                      {member.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a href={`mailto:${member.email}`} className="hover:underline">
                            {member.email}
                          </a>
                        </div>
                      )}
                      {member.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${member.phone}`} className="hover:underline">
                            {member.phone}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Bio */}
                    {member.bio && (
                      <p className="text-sm text-muted-foreground">{member.bio}</p>
                    )}

                    {/* Specializations */}
                    {member.specialization && member.specialization.length > 0 && (
                      <div>
                        <div className="text-xs font-medium mb-1">Specializations</div>
                        <div className="flex flex-wrap gap-1">
                          {member.specialization.map((spec) => (
                            <Badge key={spec} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Performance */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                      <div className="text-center">
                        <div className="text-sm font-semibold">
                          {member.candidates_placed || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Placements</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold flex items-center justify-center gap-1">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          {member.success_rate || 0}%
                        </div>
                        <div className="text-xs text-muted-foreground">Success</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold">
                          {member.assigned_projects?.length || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Active</div>
                      </div>
                    </div>

                    {/* Last Active */}
                    {member.last_active && (
                      <div className="text-xs text-muted-foreground">
                        Last active: {new Date(member.last_active).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? "Edit Team Member" : "Add Team Member"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm font-medium">Full Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@agency.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            {/* Role */}
            <div>
              <label className="text-sm font-medium">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(roleConfig).map(([value, config]) => (
                  <Button
                    key={value}
                    variant={formData.role === value ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, role: value as any })}
                    className="capitalize"
                  >
                    {config.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="text-sm font-medium">Bio</label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Brief bio and background..."
                rows={3}
              />
            </div>

            {/* Specializations */}
            <div>
              <label className="text-sm font-medium">Specializations</label>
              <Input
                placeholder="e.g., Tech Recruitment - press Enter to add"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddSpecialization((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.specialization.map((spec) => (
                  <Badge key={spec} variant="secondary" className="gap-1">
                    {spec}
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          specialization: formData.specialization.filter(
                            (s) => s !== spec
                          ),
                        })
                      }
                      className="ml-1 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              onClick={() => addMutation.mutate(formData)}
              disabled={!formData.name.trim() || !formData.email.trim() || addMutation.isPending}
            >
              {addMutation.isPending
                ? "Adding..."
                : editingStaff
                  ? "Update Member"
                  : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}