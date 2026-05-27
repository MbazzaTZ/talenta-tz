/**
 * ProfilePosts — post feed for a user's profile overview.
 * Supports creating, liking, and deleting posts.
 */
import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Heart, Trash2, Briefcase, Trophy, Search, Users, FileText, Plus, X } from 'lucide-react';
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
import { AvatarUpload } from '@/components/avatar-upload';

type PostType = 'update' | 'achievement' | 'job_search' | 'hiring' | 'article';

interface Post {
  id: string;
  author_id: string;
  content: string;
  post_type: PostType;
  image_url: string | null;
  likes_count: number;
  created_at: string;
  profiles: { full_name: string | null; headline: string | null; avatar_url: string | null } | null;
}

const POST_TYPES: { value: PostType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'update', label: 'General update', icon: FileText, color: 'text-blue-600' },
  { value: 'achievement', label: 'Achievement', icon: Trophy, color: 'text-amber-600' },
  { value: 'job_search', label: 'Open to work', icon: Search, color: 'text-emerald-600' },
  { value: 'hiring', label: 'Hiring', icon: Users, color: 'text-purple-600' },
  { value: 'article', label: 'Article', icon: Briefcase, color: 'text-slate-600' },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short' });
}

interface ProfilePostsProps {
  /** Profile owner's user ID — whose posts to show */
  profileUserId: string;
  /** Whether the viewing user is the profile owner (can post/delete) */
  isOwner: boolean;
  ownerName: string;
  ownerAvatarUrl?: string | null;
}

export function ProfilePosts({
  profileUserId,
  isOwner,
  ownerName,
  ownerAvatarUrl,
}: ProfilePostsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [composing, setComposing] = React.useState(false);
  const [content, setContent] = React.useState('');
  const [postType, setPostType] = React.useState<PostType>('update');
  const [posting, setPosting] = React.useState(false);

  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ['profile-posts', profileUserId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('posts')
        .select(
          'id,author_id,content,post_type,image_url,likes_count,created_at,profiles!author_id(full_name,headline,avatar_url)',
        )
        .eq('author_id', profileUserId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as Post[];
    },
  });

  // Which posts the current user has liked
  const { data: likedPostIds } = useQuery<string[]>({
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

  const submitPost = async () => {
    if (!content.trim() || !user) return;
    setPosting(true);
    try {
      const { error } = await (supabase as any).from('posts').insert({
        author_id: user.id,
        content: content.trim(),
        post_type: postType,
      });
      if (error) throw error;
      toast.success('Post shared');
      setContent('');
      setComposing(false);
      queryClient.invalidateQueries({ queryKey: ['profile-posts', profileUserId] });
    } catch (e) {
      toast.error((e as Error).message || 'Could not post');
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (post: Post) => {
    if (!user) {
      toast.error('Sign in to like posts');
      return;
    }
    const liked = likedPostIds?.includes(post.id);
    if (liked) {
      await (supabase as any)
        .from('post_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id);
    } else {
      await (supabase as any).from('post_likes').insert({ post_id: post.id, user_id: user.id });
    }
    queryClient.invalidateQueries({ queryKey: ['profile-posts', profileUserId] });
    queryClient.invalidateQueries({ queryKey: ['liked-posts', user.id] });
  };

  const deletePost = async (postId: string) => {
    await (supabase as any).from('posts').delete().eq('id', postId);
    toast.success('Post deleted');
    queryClient.invalidateQueries({ queryKey: ['profile-posts', profileUserId] });
  };

  const getTypeInfo = (type: PostType) => POST_TYPES.find((t) => t.value === type) ?? POST_TYPES[0];

  return (
    <div className="space-y-4">
      {/* Compose box — only for profile owner */}
      {isOwner && (
        <Card className="p-4">
          {!composing ? (
            <button
              onClick={() => setComposing(true)}
              className="w-full flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground hover:border-accent/50 hover:bg-muted/30 transition-colors text-left"
            >
              <AvatarUpload avatarUrl={ownerAvatarUrl} name={ownerName} size="sm" />
              <span>Share an update, achievement, or article…</span>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <AvatarUpload avatarUrl={ownerAvatarUrl} name={ownerName} size="sm" />
                <Textarea
                  autoFocus
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind? Share an update, experience, or achievement…"
                  rows={4}
                  maxLength={3000}
                  className="flex-1 resize-none"
                />
              </div>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Select value={postType} onValueChange={(v) => setPostType(v as PostType)}>
                    <SelectTrigger className="h-8 text-xs w-40">
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
                  <span className="text-xs text-muted-foreground">{content.length}/3000</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setComposing(false);
                      setContent('');
                    }}
                  >
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={!content.trim() || posting}
                    onClick={submitPost}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {posting ? 'Posting…' : 'Post'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Posts feed */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i} className="p-5">
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-1/3 bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-3/4 bg-muted rounded" />
              </div>
            </Card>
          ))}
        </div>
      ) : posts?.length ? (
        <div className="space-y-3">
          {posts.map((post) => {
            const typeInfo = getTypeInfo(post.post_type);
            const liked = likedPostIds?.includes(post.id);
            const isAuthor = user?.id === post.author_id;

            return (
              <Card key={post.id} className="p-5">
                <div className="flex items-start gap-3">
                  <AvatarUpload
                    avatarUrl={post.profiles?.avatar_url}
                    name={post.profiles?.full_name ?? 'U'}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm leading-tight">
                          {post.profiles?.full_name ?? 'Unknown'}
                        </p>
                        {post.profiles?.headline && (
                          <p className="text-xs text-muted-foreground">{post.profiles.headline}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className={`text-[10px] gap-0.5 ${typeInfo.color}`}
                        >
                          <typeInfo.icon className="h-2.5 w-2.5" />
                          {typeInfo.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(post.created_at)}
                        </span>
                        {isAuthor && (
                          <button
                            onClick={() => deletePost(post.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            aria-label="Delete post"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-foreground/90 mt-2 whitespace-pre-wrap leading-relaxed">
                      {post.content}
                    </p>
                    <div className="mt-3 flex items-center gap-4">
                      <button
                        onClick={() => toggleLike(post)}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? 'text-accent' : 'text-muted-foreground hover:text-accent'}`}
                      >
                        <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                        <span>
                          {post.likes_count > 0 ? post.likes_count : ''}{' '}
                          {post.likes_count === 1
                            ? 'Like'
                            : post.likes_count > 1
                              ? 'Likes'
                              : 'Like'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center border-dashed">
          <p className="text-sm text-muted-foreground">
            {isOwner ? 'Share your first post above.' : 'No posts yet.'}
          </p>
        </Card>
      )}
    </div>
  );
}
