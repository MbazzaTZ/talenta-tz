// @ts-nocheck
import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Users, Plus, Edit2, Trash2, Award, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { addAgencyStaff, updateStaffMember, removeStaffMember } from "@/lib/supabase-agency";
import type { RecruitmentAgencyStaff } from "@/lib/enhanced-types";

interface AgencyStaffListProps {
  agencyId: string;
  staff: RecruitmentAgencyStaff[];
  isAdmin: boolean;
}

const roleColors = {
  recruiter: "bg-blue-100 text-blue-800",
  manager: "bg-purple-100 text-purple-800",
  lead: "bg-green-100 text-green-800",
  director: "bg-red-100 text-red-800",
};

export function AgencyStaffList({ agencyId, staff, isAdmin }: AgencyStaffListProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingStaff, setEditingStaff] = React.useState<RecruitmentAgencyStaff | null>(null);
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone: "",
    role: "recruiter" as const,
    bio: "",
    specialization: [] as string[],
  });
  const [specializationInput, setSpecializationInput] = React.useState("");

  const addMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      addAgencyStaff(agencyId, {
        user_id: "", // This would come from auth in real app
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        bio: data.bio,
        specialization: data.specialization,
        is_active: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-staff", agencyId] });
      resetForm();
      toast.success("Team member added successfully!");
    },
    onError: () => {
      toast.error("Failed to add team member");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      editingStaff
        ? updateStaffMember(editingStaff.id, {
            name: data.name,
            email: data.email,
            phone: data.phone,
            role: data.role,
            bio: data.bio,
            specialization: data.specialization,
          })
        : Promise.reject("No staff selected"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-staff", agencyId] });
      resetForm();
      toast.success("Team member updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update team member");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (staffId: string) => removeStaffMember(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-staff", agencyId] });
      toast.success("Team member removed");
    },
    onError: () => {
      toast.error("Failed to remove team member");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "recruiter",
      bio: "",
      specialization: [],
    });
    setSpecializationInput("");
    setEditingStaff(null);
    setIsDialogOpen(false);
  };

  const handleAddSpecialization = () => {
    if (specializationInput.trim() && !formData.specialization.includes(specializationInput.trim())) {
      setFormData({
        ...formData,
        specialization: [...formData.specialization, specializationInput.trim()],
      });
      setSpecializationInput("");
    }
  };

  const handleEditStaff = (member: RecruitmentAgencyStaff) => {
    setEditingStaff(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone || "",
      role: member.role,
      bio: member.bio || "",
      specialization: member.specialization || [],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    if (editingStaff) {
      updateMutation.mutate(formData);
    } else {
      addMutation.mutate(formData);
    }
  };

  const recruiterCount = staff.filter((s) => s.role === "recruiter").length;
  const managerCount = staff.filter((s) => s.role === "manager").length;
  const totalPlacements = staff.reduce((sum, s) => sum + (s.candidates_placed || 0), 0);
  const avgSuccess = staff.length > 0 ? Math.round(staff.reduce((sum, s) => sum + (s.success_rate || 0), 0) / staff.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Team Management
          </h2>
          <p className="text-gray-600 mt-1">Manage your recruitment team</p>
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
              <div className="text-sm text-gray-600">Total Members</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{recruiterCount}</div>
              <div className="text-sm text-gray-600">Recruiters</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{totalPlacements}</div>
              <div className="text-sm text-gray-600">Total Placements</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{avgSuccess}%</div>
              <div className="text-sm text-gray-600">Avg. Success Rate</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Grid */}
      {staff.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">No team members yet</h3>
            <p className="text-gray-600 mt-1">Add your first recruiter to get started</p>
            {isAdmin && (
              <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
                Add First Member
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {staff.map((member) => {
            const roleInfo = roleColors[member.role as keyof typeof roleColors];

            return (
              <Card key={member.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <Badge className={`mt-2 ${roleInfo}`}>{member.role}</Badge>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditStaff(member)}
                        >
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
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Contact Info */}
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-gray-600">Email: </span>
                      <a href={`mailto:${member.email}`} className="text-blue-600 hover:underline">
                        {member.email}
                      </a>
                    </div>
                    {member.phone && (
                      <div>
                        <span className="text-gray-600">Phone: </span>
                        <a href={`tel:${member.phone}`} className="text-blue-600 hover:underline">
                          {member.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  {member.bio && (
                    <p className="text-sm text-gray-600">{member.bio}</p>
                  )}

                  {/* Specializations */}
                  {member.specialization && member.specialization.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1">Specializations</div>
                      <div className="flex flex-wrap gap-1">
                        {member.specialization.map((spec) => (
                          <Badge key={spec} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Performance Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                    <div className="text-center">
                      <div className="text-sm font-bold">{member.candidates_placed || 0}</div>
                      <div className="text-xs text-gray-600">Placements</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold flex items-center justify-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        {member.success_rate || 0}%
                      </div>
                      <div className="text-xs text-gray-600">Success</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold">{member.assigned_projects?.length || 0}</div>
                      <div className="text-xs text-gray-600">Projects</div>
                    </div>
                  </div>

                  {/* Last Active */}
                  {member.last_active && (
                    <div className="text-xs text-gray-500 text-center pt-2 border-t">
                      Last active: {new Date(member.last_active).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? "Edit Team Member" : "Add Team Member"}
            </DialogTitle>
            <DialogDescription>
              {editingStaff
                ? "Update team member information"
                : "Add a new recruiter or manager to your team"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Full Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@agency.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Phone (Optional)
              </label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Role
              </label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recruiter">Recruiter</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="lead">Lead Recruiter</SelectItem>
                  <SelectItem value="director">Director</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Bio
              </label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Brief background and expertise..."
                rows={3}
              />
            </div>

            {/* Specializations */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Specializations
              </label>
              <div className="flex gap-2">
                <Input
                  value={specializationInput}
                  onChange={(e) => setSpecializationInput(e.target.value)}
                  placeholder="e.g., Tech Recruitment"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSpecialization();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddSpecialization} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.specialization.map((spec) => (
                  <Badge key={spec} variant="secondary" className="gap-1">
                    {spec}
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          specialization: formData.specialization.filter((s) => s !== spec),
                        })
                      }
                      className="hover:text-red-600"
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
              onClick={handleSubmit}
              disabled={addMutation.isPending || updateMutation.isPending}
            >
              {addMutation.isPending || updateMutation.isPending
                ? "Saving..."
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
