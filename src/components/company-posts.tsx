/**
 * CompanyPosts — post feed for a company profile page.
 * Company owner can post updates, products, services, announcements,
 * media (images) and documents on behalf of the company.
 */
import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Heart,
  Trash2,
  Plus,
  X,
  Image,
  FileText,
  Megaphone,
  Package,
  Wrench,
  Newspaper,
  Upload,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

type PostType =
  | 'update'
  | 'product'
  | 'service'
  | 'announcement'
  | 'media'
  | 'document'
  | 'hiring'
  | 'article';

interface CompanyPost {
  id: string;
  author_id: string;
  company_author_id: string;
  content: string;
  post_type: PostType;
  media_urls: string[];
  document_url: string | null;
  document_name: string | null;
  likes_count: number;
  created_at: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
}

const POST_TYPES: { value: PostType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'update', label: 'Company update', icon: Megaphone, color: 'text-blue-600' },
  { value: 'announcement', label: 'Announcement', icon: Megaphone, color: 'text-purple-600' },
  { value: 'product', label: 'Product', icon: Package, color: 'text-emerald-600' },
  { value: 'service', label: 'Service', icon: Wrench, color: 'text-amber-600' },
  { value: 'hiring', label: "We're hiring", icon: Plus, color: 'text-accent' },
  { value: 'article', label: 'Article / Blog', icon: Newspaper, color: 'text-slate-600' },
  { value: 'media', label: 'Photo / Video', icon: Image, color: 'text-pink-600' },
  { value: 'document', label: 'Document', icon: FileText, color: 'text-indigo-600' },
];

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-TZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function isImage(url: string) {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
}

interface CompanyPostsProps {
  companyId: string;
  companyName: string;
  companyLogoUrl?: string | null;
  isOwner: boolean;
}

export function CompanyPosts({
  companyId,
  companyName,
  companyLogoUrl,
  isOwner,
}: CompanyPostsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [composing, setComposing] = React.useState(false);
  const [content, setContent] = React.useState('');
  const [postType, setPostType] = React.useState<PostType>('update');
  const [mediaFiles, setMediaFiles] = React.useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = React.useState<string[]>([]);
  const [docFile, setDocFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const mediaInputRef = React.useRef<HTMLInputElement>(null);
  const docInputRef = React.useRef<HTMLInputElement>(null);

  const { data: posts, isLoading } = useQuery<CompanyPost[]>({
    queryKey: ['company-posts', companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('posts')
        .select(
          'id,author_id,company_author_id,content,post_type,media_urls,document_url,document_name,likes_count,created_at,profiles!author_id(full_name,avatar_url)',
        )
        .eq('company_author_id', companyId)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as CompanyPost[];
    },
  });

  const { data: likedIds } = useQuery<string[]>({
    queryKey: ['liked-posts', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user!.id);
      return (data ?? []).map((r: { post_id: string }) => r.post_id);
    },
  });

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length + mediaFiles.length > 6) {
      toast.error('Max 6 images per post');
      return;
    }
    setMediaFiles((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setMediaPreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
    e.target.value = '';
  };

  const removeMedia = (idx: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== idx));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const { error } = await supabase.storage
      .from('company-media')
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const {
      data: { publicUrl },
    } = supabase.storage.from('company-media').getPublicUrl(path);
    return publicUrl;
  };

  const submitPost = async () => {
    if (!content.trim() && !mediaFiles.length && !docFile) return;
    if (!user) return;
    setUploading(true);

    try {
      const ts = Date.now();
      // Upload media images
      const mediaUrls: string[] = [];
      for (let i = 0; i < mediaFiles.length; i++) {
        const ext = mediaFiles[i].name.split('.').pop();
        const url = await uploadFile(mediaFiles[i], `${companyId}/${ts}_img${i}.${ext}`);
        mediaUrls.push(url);
      }

      // Upload document
      let docUrl: string | null = null;
      let docName: string | null = null;
      if (docFile) {
        const ext = docFile.name.split('.').pop();
        docUrl = await uploadFile(docFile, `${companyId}/${ts}_doc.${ext}`);
        docName = docFile.name;
      }

      const { error } = await (supabase as any).from('posts').insert({
        author_id: user.id,
        company_author_id: companyId,
        content: content.trim(),
        post_type: postType,
        media_urls: mediaUrls,
        document_url: docUrl,
        document_name: docName,
      });

      if (error) throw error;

      toast.success('Post shared');
      setContent('');
      setMediaFiles([]);
      setMediaPreviews([]);
      setDocFile(null);
      setComposing(false);
      setPostType('update');
      queryClient.invalidateQueries({ queryKey: ['company-posts', companyId] });
    } catch (e) {
      toast.error((e as Error).message || 'Could not post');
    } finally {
      setUploading(false);
    }
  };

  const toggleLike = async (post: CompanyPost) => {
    if (!user) {
      toast.error('Sign in to like');
      return;
    }
    const liked = likedIds?.includes(post.id);
    if (liked) {
      await (supabase as any)
        .from('post_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id);
    } else {
      await (supabase as any).from('post_likes').insert({ post_id: post.id, user_id: user.id });
    }
    queryClient.invalidateQueries({ queryKey: ['company-posts', companyId] });
    queryClient.invalidateQueries({ queryKey: ['liked-posts', user.id] });
  };

  const deletePost = async (postId: string) => {
    await (supabase as any).from('posts').delete().eq('id', postId);
    toast.success('Post deleted');
    queryClient.invalidateQueries({ queryKey: ['company-posts', companyId] });
  };

  const getTypeInfo = (type: PostType) => POST_TYPES.find((t) => t.value === type) ?? POST_TYPES[0];

  return (
    <div className="space-y-4">
      {/* Compose — only for company owner */}
      {isOwner && (
        <Card className="p-4">
          {!composing ? (
            <button
              onClick={() => setComposing(true)}
              className="w-full flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground hover:border-accent/50 hover:bg-muted/30 transition-colors text-left"
            >
              {companyLogoUrl ? (
                <img
                  src={companyLogoUrl}
                  alt={companyName}
                  className="h-9 w-9 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="h-9 w-9 rounded-lg bg-accent/10 grid place-items-center font-bold text-accent shrink-0">
                  {companyName[0]}
                </div>
              )}
              <span>Share an update, product, service, or media as {companyName}…</span>
            </button>
          ) : (
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center gap-3">
                {companyLogoUrl ? (
                  <img
                    src={companyLogoUrl}
                    alt={companyName}
                    className="h-9 w-9 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-lg bg-accent/10 grid place-items-center font-bold text-accent shrink-0">
                    {companyName[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm">{companyName}</p>
                  <Select value={postType} onValueChange={(v) => setPostType(v as PostType)}>
                    <SelectTrigger className="h-6 text-xs border-0 p-0 shadow-none w-40 focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POST_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          <span className="flex items-center gap-2">
                            <t.icon className={`h-3.5 w-3.5 ${t.color}`} />
                            {t.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Content */}
              <Textarea
                autoFocus
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Share a ${postType} as ${companyName}…`}
                rows={4}
                maxLength={3000}
                className="resize-none"
              />

              {/* Media previews */}
              {mediaPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {mediaPreviews.map((url, i) => (
                    <div
                      key={i}
                      className="relative rounded-lg overflow-hidden aspect-square bg-muted"
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeMedia(i)}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white grid place-items-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Document preview */}
              {docFile && (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-3">
                  <FileText className="h-5 w-5 text-accent shrink-0" />
                  <p className="text-sm flex-1 truncate">{docFile.name}</p>
                  <button
                    onClick={() => setDocFile(null)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Toolbar + actions */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex gap-2">
                  {/* Image upload */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => mediaInputRef.current?.click()}
                    disabled={mediaFiles.length >= 6}
                    className="h-8 text-xs"
                  >
                    <Image className="h-3.5 w-3.5 mr-1" />
                    Photo ({mediaFiles.length}/6)
                  </Button>
                  {/* Document upload */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => docInputRef.current?.click()}
                    disabled={!!docFile}
                    className="h-8 text-xs"
                  >
                    <FileText className="h-3.5 w-3.5 mr-1" />
                    Document
                  </Button>
                  <span className="text-xs text-muted-foreground self-center">
                    {content.length}/3000
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setComposing(false);
                      setContent('');
                      setMediaFiles([]);
                      setMediaPreviews([]);
                      setDocFile(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={(!content.trim() && !mediaFiles.length && !docFile) || uploading}
                    onClick={submitPost}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Posting…
                      </>
                    ) : (
                      'Post'
                    )}
                  </Button>
                </div>
              </div>

              {/* Hidden inputs */}
              <input
                ref={mediaInputRef}
                type="file"
                multiple
                accept="image/*"
                className="sr-only"
                onChange={handleMediaChange}
              />
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setDocFile(f);
                  e.target.value = '';
                }}
              />
            </div>
          )}
        </Card>
      )}

      {/* Posts feed */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 bg-muted rounded" />
                  <div className="h-3 w-full bg-muted rounded" />
                  <div className="h-3 w-3/4 bg-muted rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : posts?.length ? (
        <div className="space-y-4">
          {posts.map((post) => {
            const typeInfo = getTypeInfo(post.post_type);
            const liked = likedIds?.includes(post.id);
            const images = (post.media_urls ?? []).filter((u) => isImage(u));
            const videos = (post.media_urls ?? []).filter((u) => !isImage(u));

            return (
              <Card key={post.id} className="p-5">
                {/* Post header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {companyLogoUrl ? (
                      <img
                        src={companyLogoUrl}
                        alt={companyName}
                        className="h-10 w-10 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-accent/10 grid place-items-center font-bold text-accent shrink-0">
                        {companyName[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm">{companyName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] gap-0.5 ${typeInfo.color}`}
                        >
                          <typeInfo.icon className="h-2.5 w-2.5" />
                          {typeInfo.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {timeAgo(post.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => deletePost(post.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Content */}
                {post.content && (
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed mb-3">
                    {post.content}
                  </p>
                )}

                {/* Image grid */}
                {images.length > 0 && (
                  <div
                    className={`grid gap-2 mb-3 ${images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}
                  >
                    {images.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-xl overflow-hidden bg-muted aspect-video"
                      >
                        <img
                          src={url}
                          alt=""
                          className="h-full w-full object-cover hover:scale-[1.02] transition-transform"
                        />
                      </a>
                    ))}
                  </div>
                )}

                {/* Document */}
                {post.document_url && (
                  <a
                    href={post.document_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3 hover:bg-muted/60 transition-colors mb-3"
                  >
                    <div className="h-10 w-10 rounded-lg bg-accent/10 grid place-items-center shrink-0">
                      <FileText className="h-5 w-5 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {post.document_name ?? 'Document'}
                      </p>
                      <p className="text-xs text-muted-foreground">Click to open ↗</p>
                    </div>
                  </a>
                )}

                {/* Like */}
                <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                  <button
                    onClick={() => toggleLike(post)}
                    className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? 'text-accent' : 'text-muted-foreground hover:text-accent'}`}
                  >
                    <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                    <span>
                      {post.likes_count > 0 ? post.likes_count : ''}{' '}
                      {post.likes_count === 1 ? 'Like' : 'Likes'}
                    </span>
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center border-dashed">
          <p className="text-sm text-muted-foreground">
            {isOwner ? 'Share your first post above.' : 'No posts from this company yet.'}
          </p>
        </Card>
      )}
    </div>
  );
}
