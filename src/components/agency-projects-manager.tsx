// @ts-nocheck
/**
 * Agency Projects Management Component
 * Manage recruitment projects on behalf of employers
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
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Users,
  Target,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  getAgencyProjects,
  createProject,
  updateProject,
  getProjectCandidates,
} from "@/lib/supabase-agency";
import type { RecruitmentProject } from "@/lib/enhanced-types";

interface AgencyProjectsManagerProps {
  agencyId: string;
}

const statusConfig = {
  draft: { color: "bg-gray-100 text-gray-800", label: "Draft", icon: Clock },
  active: { color: "bg-blue-100 text-blue-800", label: "Active", icon: CheckCircle2 },
  onhold: { color: "bg-yellow-100 text-yellow-800", label: "On Hold", icon: Clock },
  completed: { color: "bg-green-100 text-green-800", label: "Completed", icon: CheckCircle2 },
  archived: { color: "bg-gray-100 text-gray-800", label: "Archived", icon: Trash2 },
};

export function AgencyProjectsManager({ agencyId }: AgencyProjectsManagerProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<RecruitmentProject | null>(null);
  const [formData, setFormData] = React.useState({
    project_name: "",
    description: "",
    target_count: 1,
    target_positions: [] as string[],
    required_skills: [] as string[],
    budget: 0,
    timeline: {
      start_date: new Date().toISOString().split("T")[0],
      urgency: "medium" as const,
    },
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["agency-projects", agencyId],
    queryFn: () => getAgencyProjects(agencyId),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      createProject(agencyId, {
        project_name: data.project_name,
        description: data.description,
        target_positions: data.target_positions,
        target_count: data.target_count,
        required_skills: data.required_skills,
        budget: data.budget || undefined,
        timeline: {
          start_date: data.timeline.start_date,
          urgency: data.timeline.urgency,
        },
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

  const resetForm = () => {
    setFormData({
      project_name: "",
      description: "",
      target_count: 1,
      target_positions: [],
      required_skills: [],
      budget: 0,
      timeline: {
        start_date: new Date().toISOString().split("T")[0],
        urgency: "medium",
      },
    });
    setEditingProject(null);
    setIsDialogOpen(false);
  };

  const handleAddPosition = (position: string) => {
    if (position.trim() && !formData.target_positions.includes(position.trim())) {
      setFormData({
        ...formData,
        target_positions: [...formData.target_positions, position.trim()],
      });
    }
  };

  const handleAddSkill = (skill: string) => {
    if (skill.trim() && !formData.required_skills.includes(skill.trim())) {
      setFormData({
        ...formData,
        required_skills: [...formData.required_skills, skill.trim()],
      });
    }
  };

  const activeProjects = projects.filter((p) => p.status === "active");
  const draftProjects = projects.filter((p) => p.status === "draft");
  const completedProjects = projects.filter((p) => p.status === "completed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Projects
          </h2>
          <p className="text-muted-foreground mt-1">Manage recruitment projects</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{activeProjects.length}</div>
              <div className="text-sm text-muted-foreground">Active Projects</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">{draftProjects.length}</div>
              <div className="text-sm text-muted-foreground">Drafts</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {completedProjects.length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading projects...
          </CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No projects yet. Create your first project to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const config = statusConfig[project.status as keyof typeof statusConfig];
            const StatusIcon = config.icon;

            return (
              <Card key={project.id} className="hover:shadow-lg transition">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{project.project_name}</h3>
                          <Badge className={config.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {/* Positions */}
                      {project.target_count && (
                        <div>
                          <div className="font-medium flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            Positions
                          </div>
                          <div className="text-muted-foreground">
                            {project.positions_filled || 0}/{project.target_count}
                          </div>
                        </div>
                      )}

                      {/* Timeline */}
                      {project.timeline?.start_date && (
                        <div>
                          <div className="font-medium flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Started
                          </div>
                          <div className="text-muted-foreground">
                            {new Date(project.timeline.start_date).toLocaleDateString()}
                          </div>
                        </div>
                      )}

                      {/* Budget */}
                      {project.budget && (
                        <div>
                          <div className="font-medium flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            Budget
                          </div>
                          <div className="text-muted-foreground">
                            ${project.budget.toLocaleString()}
                          </div>
                        </div>
                      )}

                      {/* Industry */}
                      {project.industry && (
                        <div>
                          <div className="font-medium">Industry</div>
                          <div className="text-muted-foreground">{project.industry}</div>
                        </div>
                      )}
                    </div>

                    {/* Skills & Positions */}
                    <div className="space-y-2">
                      {project.target_positions && project.target_positions.length > 0 && (
                        <div>
                          <div className="text-xs font-medium mb-1">Positions</div>
                          <div className="flex flex-wrap gap-1">
                            {project.target_positions.map((pos) => (
                              <Badge key={pos} variant="secondary" className="text-xs">
                                {pos}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {project.required_skills && project.required_skills.length > 0 && (
                        <div>
                          <div className="text-xs font-medium mb-1">Required Skills</div>
                          <div className="flex flex-wrap gap-1">
                            {project.required_skills.slice(0, 5).map((skill) => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {project.required_skills.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{project.required_skills.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <Button
                      className="w-full gap-2"
                      onClick={() =>
                        console.log(`View project ${project.id}`)
                      }
                    >
                      <Users className="h-4 w-4" />
                      View Candidates ({project.positions_filled || 0})
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Edit Project" : "Create New Project"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Project Name */}
            <div>
              <label className="text-sm font-medium">Project Name *</label>
              <Input
                value={formData.project_name}
                onChange={(e) =>
                  setFormData({ ...formData, project_name: e.target.value })
                }
                placeholder="e.g., Senior Software Engineers - Tech Startup"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Project details and requirements..."
                rows={3}
              />
            </div>

            {/* Target Count */}
            <div>
              <label className="text-sm font-medium">Number of Positions</label>
              <Input
                type="number"
                min={1}
                value={formData.target_count}
                onChange={(e) =>
                  setFormData({ ...formData, target_count: parseInt(e.target.value) })
                }
              />
            </div>

            {/* Positions */}
            <div>
              <label className="text-sm font-medium">Target Positions</label>
              <Input
                placeholder="e.g., Software Engineer - press Enter to add"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddPosition((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.target_positions.map((pos) => (
                  <Badge key={pos} variant="secondary" className="gap-1">
                    {pos}
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          target_positions: formData.target_positions.filter(
                            (p) => p !== pos
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

            {/* Skills */}
            <div>
              <label className="text-sm font-medium">Required Skills</label>
              <Input
                placeholder="e.g., React, Node.js - press Enter to add"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddSkill((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.required_skills.map((skill) => (
                  <Badge key={skill} variant="outline" className="gap-1">
                    {skill}
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          required_skills: formData.required_skills.filter(
                            (s) => s !== skill
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

            {/* Budget */}
            <div>
              <label className="text-sm font-medium">Budget (Optional)</label>
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
              <label className="text-sm font-medium">Start Date</label>
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
              <label className="text-sm font-medium">Urgency</label>
              <div className="grid grid-cols-2 gap-2">
                {["low", "medium", "high", "urgent"].map((level) => (
                  <Button
                    key={level}
                    variant={
                      formData.timeline.urgency === level ? "default" : "outline"
                    }
                    onClick={() =>
                      setFormData({
                        ...formData,
                        timeline: { ...formData.timeline, urgency: level as any },
                      })
                    }
                    className="capitalize"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.project_name.trim() || createMutation.isPending}
            >
              {createMutation.isPending
                ? "Creating..."
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