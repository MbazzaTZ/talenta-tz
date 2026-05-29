// @ts-nocheck
import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
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
import { Briefcase, Plus, Edit2, Trash2, Calendar, DollarSign, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { createProject, updateProject } from "@/lib/supabase-agency";
import type { RecruitmentProject } from "@/lib/enhanced-types";

interface AgencyProjectsListProps {
  agencyId: string;
  projects: RecruitmentProject[];
}

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  active: "bg-blue-100 text-blue-800",
  onhold: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-800",
};

export function AgencyProjectsList({ agencyId, projects }: AgencyProjectsListProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<RecruitmentProject | null>(null);
  const [formData, setFormData] = React.useState({
    project_name: "",
    description: "",
    target_count: 1,
    budget: 0,
    industry: "",
    timeline: {
      start_date: new Date().toISOString().split("T")[0],
      urgency: "medium" as const,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      createProject(agencyId, {
        project_name: data.project_name,
        description: data.description,
        target_count: data.target_count,
        budget: data.budget || undefined,
        industry: data.industry,
        timeline: data.timeline,
        status: "draft",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-projects", agencyId] });
      resetForm();
      toast.success("Project created successfully!");
    },
    onError: () => {
      toast.error("Failed to create project");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      editingProject
        ? updateProject(editingProject.id, {
            project_name: data.project_name,
            description: data.description,
            target_count: data.target_count,
            budget: data.budget || undefined,
            industry: data.industry,
          })
        : Promise.reject("No project selected"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-projects", agencyId] });
      resetForm();
      toast.success("Project updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update project");
    },
  });

  const resetForm = () => {
    setFormData({
      project_name: "",
      description: "",
      target_count: 1,
      budget: 0,
      industry: "",
      timeline: {
        start_date: new Date().toISOString().split("T")[0],
        urgency: "medium",
      },
    });
    setEditingProject(null);
    setIsDialogOpen(false);
  };

  const handleEditProject = (project: RecruitmentProject) => {
    setEditingProject(project);
    setFormData({
      project_name: project.project_name,
      description: project.description || "",
      target_count: project.target_count || 1,
      budget: project.budget || 0,
      industry: project.industry || "",
      timeline: {
        start_date: project.timeline?.start_date || new Date().toISOString().split("T")[0],
        urgency: (project.timeline?.urgency as any) || "medium",
      },
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.project_name.trim()) {
      toast.error("Project name is required");
      return;
    }

    if (editingProject) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Projects
          </h2>
          <p className="text-gray-600 mt-1">Manage your recruitment projects</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">No projects yet</h3>
            <p className="text-gray-600 mt-1">Create your first recruitment project to get started</p>
            <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
              Create First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.project_name}</CardTitle>
                    <Badge className={`mt-2 ${statusColors[project.status as keyof typeof statusColors]}`}>
                      {project.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditProject(project)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {project.description && (
                  <p className="text-sm text-gray-600">{project.description}</p>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {project.target_count && (
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                        <Users className="h-4 w-4" />
                        Positions
                      </div>
                      <div className="text-lg font-bold">
                        {project.positions_filled || 0}/{project.target_count}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round(
                          ((project.positions_filled || 0) / project.target_count) * 100
                        )}% filled
                      </div>
                    </div>
                  )}

                  {project.timeline?.start_date && (
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="h-4 w-4" />
                        Started
                      </div>
                      <div className="text-lg font-bold">
                        {new Date(project.timeline.start_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {project.timeline.urgency || "normal"} urgency
                      </div>
                    </div>
                  )}

                  {project.budget && (
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                        <DollarSign className="h-4 w-4" />
                        Budget
                      </div>
                      <div className="text-lg font-bold">${project.budget.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Total allocation</div>
                    </div>
                  )}

                  {project.required_skills && project.required_skills.length > 0 && (
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                        <Zap className="h-4 w-4" />
                        Skills
                      </div>
                      <div className="text-lg font-bold">{project.required_skills.length}</div>
                      <div className="text-xs text-gray-500">Required</div>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <Button
                  className="w-full"
                  onClick={() => navigate({ to: `/project/${project.id}` })}
                >
                  View Candidates
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Edit Project" : "Create New Project"}
            </DialogTitle>
            <DialogDescription>
              {editingProject
                ? "Update project details"
                : "Create a new recruitment project for your client"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Project Name
              </label>
              <Input
                value={formData.project_name}
                onChange={(e) =>
                  setFormData({ ...formData, project_name: e.target.value })
                }
                placeholder="e.g., Senior React Engineers - TechCorp"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Project details and requirements..."
                rows={3}
              />
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Industry
              </label>
              <Input
                value={formData.industry}
                onChange={(e) =>
                  setFormData({ ...formData, industry: e.target.value })
                }
                placeholder="e.g., Technology, Finance, Healthcare"
              />
            </div>

            {/* Target Count */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Number of Positions
              </label>
              <Input
                type="number"
                min={1}
                value={formData.target_count}
                onChange={(e) =>
                  setFormData({ ...formData, target_count: parseInt(e.target.value) || 1 })
                }
              />
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Budget (Optional)
              </label>
              <Input
                type="number"
                min={0}
                value={formData.budget}
                onChange={(e) =>
                  setFormData({ ...formData, budget: parseInt(e.target.value) || 0 })
                }
                placeholder="0"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={formData.timeline.start_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    timeline: { ...formData.timeline, start_date: e.target.value },
                  })
                }
              />
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Urgency
              </label>
              <Select
                value={formData.timeline.urgency}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    timeline: { ...formData.timeline, urgency: value as any },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : editingProject
                  ? "Update Project"
                  : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
