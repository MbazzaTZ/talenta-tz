/**
 * Talent Showcase Component
 * Displays user projects, achievements, and work samples
 */

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Eye, Edit2, Star } from "lucide-react";
import { getUserShowcase, createShowcaseItem } from "@/lib/supabase-enhanced";
import type { TalentShowcase } from "@/lib/enhanced-types";

interface TalentShowcaseProps {
  userId: string;
  isEditable?: boolean;
  showFeaturedOnly?: boolean;
}

const typeConfig = {
  project: { label: "Project", color: "bg-blue-100 text-blue-800" },
  achievement: { label: "Achievement", color: "bg-green-100 text-green-800" },
  work_sample: { label: "Work Sample", color: "bg-purple-100 text-purple-800" },
  award: { label: "Award", color: "bg-yellow-100 text-yellow-800" },
};

const visibilityConfig = {
  public: "Public",
  private: "Private",
  recruiters_only: "Recruiters Only",
};

export function TalentShowcase({
  userId,
  isEditable = false,
  showFeaturedOnly = false,
}: TalentShowcaseProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<TalentShowcase | null>(null);
  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    type: "project" as const,
    media_url: "",
    media_type: "image" as const,
    visibility: "public" as const,
    tags: [] as string[],
    featured: false,
  });

  const { data: items = [] } = useQuery({
    queryKey: ["talent-showcase", userId, showFeaturedOnly],
    queryFn: () =>
      getUserShowcase(userId, showFeaturedOnly ? "all" : "public").then((all) =>
        showFeaturedOnly ? all.filter((item) => item.featured) : all
      ),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      createShowcaseItem(userId, {
        title: data.title,
        description: data.description,
        type: data.type,
        media_url: data.media_url,
        media_type: data.media_type,
        visibility: data.visibility,
        tags: data.tags,
        featured: data.featured,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["talent-showcase", userId] });
      setFormData({
        title: "",
        description: "",
        type: "project",
        media_url: "",
        media_type: "image",
        visibility: "public",
        tags: [],
        featured: false,
      });
      setIsDialogOpen(false);
      toast.success("Showcase item created!");
    },
    onError: () => {
      toast.error("Failed to create showcase item");
    },
  });

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag.trim()],
      });
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Talent Showcase</h2>
          <p className="text-muted-foreground">
            {showFeaturedOnly ? "Featured projects and achievements" : "Your projects, achievements, and work samples"}
          </p>
        </div>
        {isEditable && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        )}
      </div>

      {/* Gallery */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              {isEditable
                ? "No showcase items yet. Add your first project or achievement!"
                : "No public showcase items"}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const typeInfo = typeConfig[item.type as keyof typeof typeConfig];

            return (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition">
                {/* Thumbnail */}
                {item.thumbnail_url && (
                  <div className="relative h-40 bg-muted overflow-hidden">
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition"
                    />
                    {item.featured && (
                      <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 rounded-full p-2">
                        <Star className="h-4 w-4 fill-current" />
                      </div>
                    )}
                  </div>
                )}

                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {/* Type Badge */}
                    <Badge className={typeInfo.color}>{typeInfo.label}</Badge>

                    {/* Title */}
                    <h3 className="font-semibold line-clamp-2">{item.title}</h3>

                    {/* Description */}
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {item.views_count} views
                      </div>
                      <div className="text-xs">
                        {visibilityConfig[item.visibility]}
                      </div>
                    </div>

                    {/* Actions */}
                    {isEditable && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={() => {
                            setEditingItem(item);
                            setFormData({
                              title: item.title,
                              description: item.description || "",
                              type: item.type,
                              media_url: item.media_url || "",
                              media_type: (item.media_type || "image") as any,
                              visibility: item.visibility,
                              tags: item.tags || [],
                              featured: item.featured,
                            });
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-2 text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Showcase Item" : "Add Showcase Item"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., E-commerce Platform, Award Winning Design"
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
                placeholder="Describe your project or achievement..."
                rows={3}
              />
            </div>

            {/* Type */}
            <div>
              <label className="text-sm font-medium">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(typeConfig).map(([value, config]) => (
                  <Button
                    key={value}
                    variant={formData.type === value ? "default" : "outline"}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        type: value as any,
                      })
                    }
                  >
                    {config.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Media URL */}
            <div>
              <label className="text-sm font-medium">Media URL</label>
              <Input
                value={formData.media_url}
                onChange={(e) =>
                  setFormData({ ...formData, media_url: e.target.value })
                }
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="text-sm font-medium">Visibility</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(visibilityConfig).map(([value, label]) => (
                  <Button
                    key={value}
                    variant={formData.visibility === value ? "default" : "outline"}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        visibility: value as any,
                      })
                    }
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) =>
                  setFormData({ ...formData, featured: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <label className="text-sm font-medium">Featured</label>
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-medium">Tags</label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add a tag and press Enter"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddTag((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-2 cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag}
                    <span>×</span>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.title.trim() || createMutation.isPending}
            >
              {createMutation.isPending
                ? "Saving..."
                : editingItem
                  ? "Update Item"
                  : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
