import * as React from 'react';
import { toast } from 'sonner';
import { Camera, Loader2 } from 'lucide-react';
import { uploadAvatarFile } from '@/lib/supabase-data';
import { useAuth } from '@/lib/auth';
import { useQueryClient } from '@tanstack/react-query';

interface AvatarUploadProps {
  avatarUrl?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
}

const SIZES = {
  sm: { outer: 'h-10 w-10', text: 'text-sm', icon: 'h-3 w-3', badge: 'h-5 w-5' },
  md: { outer: 'h-16 w-16', text: 'text-xl', icon: 'h-4 w-4', badge: 'h-6 w-6' },
  lg: { outer: 'h-24 w-24', text: 'text-3xl', icon: 'h-5 w-5', badge: 'h-8 w-8' },
};

export function AvatarUpload({
  avatarUrl,
  name,
  size = 'md',
  editable = false,
}: AvatarUploadProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const sz = SIZES[size];
  const displayUrl = previewUrl ?? avatarUrl;
  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be under 5 MB');
      return;
    }

    // Show instant preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      await uploadAvatarFile(user.id, file);
      toast.success('Profile photo updated');
      queryClient.invalidateQueries({ queryKey: ['supabase-profile', user.id] });
    } catch (err) {
      toast.error((err as Error).message || 'Upload failed');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="relative inline-block">
      <div
        className={`${sz.outer} rounded-2xl overflow-hidden border-2 border-border bg-accent/10 grid place-items-center shrink-0`}
      >
        {displayUrl ? (
          <img src={displayUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className={`font-display font-bold text-accent ${sz.text}`}>{initials}</span>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/40 grid place-items-center rounded-2xl">
            <Loader2 className={`${sz.icon} text-white animate-spin`} />
          </div>
        )}
      </div>

      {editable && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`absolute -bottom-1 -right-1 ${sz.badge} rounded-full bg-accent text-accent-foreground border-2 border-background grid place-items-center hover:bg-accent/90 transition-colors`}
            aria-label="Change profile photo"
          >
            <Camera className={sz.icon} />
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleChange}
          />
        </>
      )}
    </div>
  );
}
