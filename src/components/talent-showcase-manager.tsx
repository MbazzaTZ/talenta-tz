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
  Plus,
  Edit2,
  Trash2,
  Eye,
  Star,
  Image as ImageIcon,
  Video,
  FileText,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { createShowcaseItem, getUserShowcase, getFeaturedShowcaseItems } from "@/lib/supabase-enhanced";
import type { TalentShowcase } from "@/lib/enhanced-types";

interface TalentShowcaseManagerProps {
  userId: string;
  isOwner: boolean;
}

const typeIcons = {
  project: ImageIcon,
  achievement: Star,
  work_sample: FileText,
  award: Star,
};

const typeColors = {
  project: "bg-blue-100 text-blue-800",
  achievement: "bg-green-100 text-green-800",
  work_sample: "bg-purple-100 text-purple-800",
  award: "bg-yellow-100 text-yellow-800",
};

export function TalentShowcaseManager({
  userId,
  isOwner,
}: TalentShowcaseManagerProps) {
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
  const [tagInput, setTagInput] = React.useState("");

  const { data: items = [] } = useQuery({
    queryKey: ["talent-showcase", userId],
    queryFn: () => getUserShowcase(userId, "all"),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createShowcaseItem(userId, {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        media_url: formData.media_url,
        media_type: formData.media_type,
        visibility: formData.visibility,
        tags: formData.tags,
        featured: formData.featured,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["talent-showcase", userId] });
      resetForm();
      toast.success("Showcase item added!");
    },
    onError: () => {
      toast.error("Failed to add showcase item");
    },
  });

  const resetForm = () => {
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
    setTagInput("");
    setEditingItem(null);
    setIsDialogOpen(false);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    createMutation.mutate();
  };

  const publicItems = items.filter((i) => i.visibility === "public");
  const featuredItems = items.filter((i) => i.featured && i.visibility === "public");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Talent Showcase</h2>
          <p className="text-gray-600 mt-1">
            {isOwner
              ? "Show off your best work and achievements"
              : "View featured projects and achievements"}
          </p>
        </div>
        {isOwner && (
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        )}
      </div>

      {/* Featured Section */}
      {featuredItems.length > 0 && (
        <Card className="border-2 border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              Featured Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredItems.map((item) => (
                <ShowcaseCard
                  key={item.id}
                  item={item}
                  isOwner={isOwner}
                  onEdit={() => {
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
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Items */}
      <Card>
        <CardHeader>
          <CardTitle>All Items ({publicItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {publicItems.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              {isOwner ? "Add your first showcase item to get started!" : "No public items yet"}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicItems.map((item) => (
                <ShowcaseCard
                  key={item.id}
                  item={item}
                  isOwner={isOwner}
                  onEdit={() => {
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
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Showcase Item" : "Add Showcase Item"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., E-commerce Platform, Design Award"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Tell the story of your project..."
                rows={3}
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="achievement">Achievement</SelectItem>
                  <SelectItem value="work_sample">Work Sample</SelectItem>
                  <SelectItem value="award">Award</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Media URL */}
            <div>
              <label className="block text-sm font-medium mb-1">Media URL</label>
              <Input
                value={formData.media_url}
                onChange={(e) =>
                  setFormData({ ...formData, media_url: e.target.value })
                }
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Media Type */}
            <div>
              <label className="block text-sm font-medium mb-1">Media Type</label>
              <Select
                value={formData.media_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, media_type: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium mb-1">Visibility</label>
              <Select
                value={formData.visibility}
                onValueChange={(value) =>
                  setFormData({ ...formData, visibility: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="recruiters_only">Recruiters Only</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Featured */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) =>
                  setFormData({ ...formData, featured: e.target.checked })
                }
                className="h-4 w-4"
              />
              <label className="text-sm font-medium">Feature this item</label>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-1">Tags</label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          tags: formData.tags.filter((t) => t !== tag),
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
              onClick={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Saving..." : "Save Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ShowcaseCardProps {
  item: TalentShowcase;
  isOwner: boolean;
  onEdit: () => void;
}

function ShowcaseCard({ item, isOwner, onEdit }: ShowcaseCardProps) {
  const typeConfig = typeColors[item.type as keyof typeof typeColors];
  const Icon = typeIcons[item.type as keyof typeof typeIcons] || ImageIcon;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition">
      {/* Thumbnail */}
      {item.media_url && (
        <div className="relative h-40 bg-gray-200 overflow-hidden">
          {item.media_type === "image" && (
            <img
              src={item.media_url}
              alt={item.title}
              className="w-full h-full object-cover hover:scale-110 transition"
            />
          )}
          {item.featured && (
            <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 rounded-full p-2">
              <Star className="h-4 w-4 fill-current" />
            </div>
          )}
        </div>
      )}

      <CardContent className="pt-4">
        <Badge className={typeConfig}>{item.type}</Badge>
        <h3 className="font-semibold mt-2 line-clamp-2">{item.title}</h3>
        {item.description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-600 mt-3 pt-3 border-t">
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {item.views_count} views
          </div>
          <div className="text-xs">{item.visibility}</div>
        </div>

        {/* Actions */}
        {isOwner && (
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={onEdit}
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
