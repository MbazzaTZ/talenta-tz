// @ts-nocheck
// Types will be regenerated after migration runs
import { supabase } from '@/integrations/supabase/client';

export interface JobAlert {
  id: string;
  user_id: string;
  keywords: string[];
  regions: string[];
  industries: string[];
  position_levels: string[];
  enabled: boolean;
  email_frequency: 'daily' | 'weekly' | 'immediately';
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any> | null;
  read: boolean;
  read_at: string | null;
  sent_at: string;
  email_sent: boolean;
  created_at: string;
}

// Job Alerts
export async function getJobAlert(userId: string): Promise<JobAlert | null> {
  const { data, error } = await supabase
    .from('job_alerts')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as JobAlert;
}

export async function createJobAlert(
  userId: string,
  alert: Partial<JobAlert>
): Promise<JobAlert | null> {
  const { data, error } = await supabase
    .from('job_alerts')
    .insert([
      {
        user_id: userId,
        keywords: alert.keywords || [],
        regions: alert.regions || [],
        industries: alert.industries || [],
        position_levels: alert.position_levels || [],
        email_frequency: alert.email_frequency || 'daily',
        enabled: alert.enabled !== false,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating job alert:', error);
    return null;
  }
  return data as JobAlert;
}

export async function updateJobAlert(
  userId: string,
  alert: Partial<JobAlert>
): Promise<JobAlert | null> {
  const { data, error } = await supabase
    .from('job_alerts')
    .update({
      keywords: alert.keywords,
      regions: alert.regions,
      industries: alert.industries,
      position_levels: alert.position_levels,
      email_frequency: alert.email_frequency,
      enabled: alert.enabled,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating job alert:', error);
    return null;
  }
  return data as JobAlert;
}

export async function deleteJobAlert(userId: string): Promise<boolean> {
  const { error } = await (supabase as any).from('job_alerts').delete().eq('user_id', userId);

  if (error) {
    console.error('Error deleting job alert:', error);
    return false;
  }
  return true;
}

// Notifications
export async function getNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
  let query = (supabase as any).from('notifications').select('*').eq('user_id', userId);

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  return (data || []) as Notification[];
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
  return true;
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
  return true;
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  const { error } = await (supabase as any).from('notifications').delete().eq('id', notificationId);

  if (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
  return true;
}

// Profile settings
export async function toggleOpenToWork(userId: string, enabled: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({
      open_to_work: enabled,
      open_to_work_updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating open_to_work status:', error);
    return false;
  }
  return true;
}

export async function getOpenToWorkStatus(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('open_to_work')
    .eq('id', userId)
    .single();

  if (error || !data) return false;
  return data.open_to_work || false;
}
