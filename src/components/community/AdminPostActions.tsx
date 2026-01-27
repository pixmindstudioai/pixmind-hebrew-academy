import { useState } from 'react';
import { GroupPost, useTogglePostPin, useTogglePostLock, useDeletePost } from '@/hooks/useDiscussionsData';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Pin, PinOff, Lock, Unlock, Trash2 } from 'lucide-react';

interface AdminPostActionsProps {
  post: GroupPost;
  groupId: string;
}

const AdminPostActions = ({ post, groupId }: AdminPostActionsProps) => {
  const togglePin = useTogglePostPin();
  const toggleLock = useTogglePostLock();
  const deletePost = useDeletePost();
  
  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePin.mutate({ postId: post.id, isPinned: !post.is_pinned, groupId });
  };
  
  const handleToggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLock.mutate({ postId: post.id, isLocked: !post.is_locked, groupId });
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('האם למחוק את הפוסט? פעולה זו תמחק גם את כל התגובות.')) {
      deletePost.mutate({ postId: post.id, groupId });
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleTogglePin}>
          {post.is_pinned ? (
            <>
              <PinOff className="w-4 h-4 ml-2" />
              בטל הצמדה
            </>
          ) : (
            <>
              <Pin className="w-4 h-4 ml-2" />
              הצמד פוסט
            </>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleToggleLock}>
          {post.is_locked ? (
            <>
              <Unlock className="w-4 h-4 ml-2" />
              בטל נעילה
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 ml-2" />
              נעל דיון
            </>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="w-4 h-4 ml-2" />
          מחק פוסט
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AdminPostActions;
