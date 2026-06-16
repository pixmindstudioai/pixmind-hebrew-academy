import { Bell, UserPlus, Heart, MessageSquare, Mail, BookOpen, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNotifications, type AppNotification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

const ICONS: Record<string, typeof Bell> = {
  follow: UserPlus,
  like: Heart,
  comment: MessageSquare,
  message: Mail,
  course_access: BookOpen,
  chapter: Sparkles,
};

export const NotificationBell = ({ className }: { className?: string }) => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const open = (n: AppNotification) => {
    if (!n.is_read) void markAsRead(n.id);
    if (n.route) navigate(n.route);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative h-9 w-9 text-muted-foreground hover:text-foreground', className)}
          title="התראות"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 glass-card" sideOffset={8} dir="rtl">
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <h3 className="text-sm font-semibold">התראות</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void markAllAsRead()}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              סמן הכל כנקרא
            </Button>
          )}
        </div>

        <ScrollArea className="h-[320px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <Bell className="mb-3 h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">אין התראות חדשות</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notifications.map((n) => {
                const Icon = ICONS[n.type] ?? Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => open(n)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-right transition-colors hover:bg-accent/50',
                      !n.is_read && 'bg-accent/30'
                    )}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      {n.body && <p className="mt-0.5 truncate text-xs text-muted-foreground">{n.body}</p>}
                      <p className="mt-1 text-[11px] text-muted-foreground/70">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: he })}
                      </p>
                    </div>
                    {!n.is_read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
