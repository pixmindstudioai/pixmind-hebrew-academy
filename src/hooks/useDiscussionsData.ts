import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface DiscussionGroup {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_active: boolean;
  allow_posting: boolean;
  access_type: 'open' | 'restricted';
  created_at: string;
  updated_at: string;
}

export interface GroupAccess {
  id: string;
  group_id: string;
  module_id: string | null;
  bundle_id: string | null;
  created_at: string;
  module?: { id: string; title: string };
  bundle?: { id: string; title: string };
}

export interface GroupPost {
  id: string;
  group_id: string;
  user_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  user?: { full_name: string; profile_picture_url: string | null };
  comments_count?: number;
}

export interface GroupComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  user?: { full_name: string; profile_picture_url: string | null };
}

// Admin hooks for managing groups
export const useAdminGroups = () => {
  return useQuery({
    queryKey: ['admin-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discussion_groups')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DiscussionGroup[];
    },
  });
};

export const useGroupAccess = (groupId: string | null) => {
  return useQuery({
    queryKey: ['group-access', groupId],
    queryFn: async () => {
      if (!groupId) return [];
      
      const { data, error } = await supabase
        .from('group_access')
        .select(`
          *,
          module:modules(id, title),
          bundle:bundles(id, title)
        `)
        .eq('group_id', groupId);
      
      if (error) throw error;
      return data as GroupAccess[];
    },
    enabled: !!groupId,
  });
};

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (group: { title: string; description?: string; is_active?: boolean; allow_posting?: boolean; access_type?: 'open' | 'restricted' }) => {
      const { data, error } = await supabase
        .from('discussion_groups')
        .insert({
          title: group.title,
          description: group.description || null,
          is_active: group.is_active ?? true,
          allow_posting: group.allow_posting ?? true,
          access_type: group.access_type || 'restricted',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-groups'] });
      toast.success('הקבוצה נוצרה בהצלחה');
    },
    onError: (error) => {
      toast.error('שגיאה ביצירת הקבוצה');
      console.error(error);
    },
  });
};

export const useUpdateGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DiscussionGroup> & { id: string }) => {
      const { data, error } = await supabase
        .from('discussion_groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-groups'] });
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      toast.success('הקבוצה עודכנה בהצלחה');
    },
    onError: (error) => {
      toast.error('שגיאה בעדכון הקבוצה');
      console.error(error);
    },
  });
};

export const useDeleteGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('discussion_groups')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-groups'] });
      toast.success('הקבוצה נמחקה בהצלחה');
    },
    onError: (error) => {
      toast.error('שגיאה במחיקת הקבוצה');
      console.error(error);
    },
  });
};

export const useAddGroupAccess = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (access: { group_id: string; module_id?: string; bundle_id?: string }) => {
      const { data, error } = await supabase
        .from('group_access')
        .insert(access)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-access', variables.group_id] });
      toast.success('הרשאת גישה נוספה');
    },
    onError: (error) => {
      toast.error('שגיאה בהוספת הרשאה');
      console.error(error);
    },
  });
};

export const useRemoveGroupAccess = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, groupId }: { id: string; groupId: string }) => {
      const { error } = await supabase
        .from('group_access')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-access', groupId] });
      toast.success('הרשאת גישה הוסרה');
    },
    onError: (error) => {
      toast.error('שגיאה בהסרת הרשאה');
      console.error(error);
    },
  });
};

// User hooks for viewing groups and discussions
export const useUserGroups = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-groups', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discussion_groups')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DiscussionGroup[];
    },
    enabled: !!user,
  });
};

export const useGroupPosts = (groupId: string | null) => {
  return useQuery({
    queryKey: ['group-posts', groupId],
    queryFn: async () => {
      if (!groupId) return [];
      
      // Get posts with user info
      const { data: posts, error } = await supabase
        .from('group_posts')
        .select(`
          *,
          user:users(full_name, profile_picture_url)
        `)
        .eq('group_id', groupId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get comment counts for each post
      const postsWithCounts = await Promise.all(
        (posts || []).map(async (post) => {
          const { count } = await supabase
            .from('group_comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);
          
          return { ...post, comments_count: count || 0 };
        })
      );
      
      return postsWithCounts as GroupPost[];
    },
    enabled: !!groupId,
  });
};

export const usePostComments = (postId: string | null) => {
  return useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      if (!postId) return [];
      
      const { data, error } = await supabase
        .from('group_comments')
        .select(`
          *,
          user:users(full_name, profile_picture_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as GroupComment[];
    },
    enabled: !!postId,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ groupId, title, content }: { groupId: string; title: string; content: string }) => {
      if (!user) throw new Error('לא מחובר');
      
      const { data, error } = await supabase
        .from('group_posts')
        .insert({
          group_id: groupId,
          user_id: user.id,
          title,
          content,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-posts', variables.groupId] });
      toast.success('הפוסט נוצר בהצלחה');
    },
    onError: (error) => {
      toast.error('שגיאה ביצירת הפוסט');
      console.error(error);
    },
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ postId, content, parentCommentId }: { postId: string; content: string; parentCommentId?: string }) => {
      if (!user) throw new Error('לא מחובר');
      
      const { data, error } = await supabase
        .from('group_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
          parent_comment_id: parentCommentId || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['group-posts'] });
      toast.success('התגובה נוספה');
    },
    onError: (error) => {
      toast.error('שגיאה בהוספת תגובה');
      console.error(error);
    },
  });
};

// Admin moderation hooks
export const useTogglePostPin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, isPinned, groupId }: { postId: string; isPinned: boolean; groupId: string }) => {
      const { error } = await supabase
        .from('group_posts')
        .update({ is_pinned: isPinned })
        .eq('id', postId);
      
      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-posts', groupId] });
      toast.success('הפוסט עודכן');
    },
  });
};

export const useTogglePostLock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, isLocked, groupId }: { postId: string; isLocked: boolean; groupId: string }) => {
      const { error } = await supabase
        .from('group_posts')
        .update({ is_locked: isLocked })
        .eq('id', postId);
      
      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-posts', groupId] });
      toast.success('הפוסט עודכן');
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, groupId }: { postId: string; groupId: string }) => {
      const { error } = await supabase
        .from('group_posts')
        .delete()
        .eq('id', postId);
      
      if (error) throw error;
      return groupId;
    },
    onSuccess: (groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-posts', groupId] });
      toast.success('הפוסט נמחק');
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      const { error } = await supabase
        .from('group_comments')
        .delete()
        .eq('id', commentId);
      
      if (error) throw error;
      return postId;
    },
    onSuccess: (postId) => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['group-posts'] });
      toast.success('התגובה נמחקה');
    },
  });
};
