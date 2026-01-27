import { useState } from 'react';
import { useUserAnnouncements, useAnnouncement, Announcement } from '@/hooks/useAnnouncementsData';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Megaphone, 
  Pin, 
  Calendar,
  ArrowRight,
  Image as ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const Announcements = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { data: announcements, isLoading } = useUserAnnouncements();
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null);
  
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12" dir="rtl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Megaphone className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">התחבר כדי לצפות בהכרזות</h3>
            <p className="text-muted-foreground mb-4">
              ההכרזות זמינות רק למשתמשים מחוברים
            </p>
            <Button onClick={() => navigate('/login')}>
              התחברות
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">הכרזות</h1>
        <p className="text-muted-foreground">
          עדכונים והודעות חשובות מהאקדמיה
        </p>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : announcements?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Megaphone className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">אין הכרזות</h3>
            <p className="text-muted-foreground">
              אין הכרזות פעילות כרגע
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements?.map((announcement) => (
            <AnnouncementCard 
              key={announcement.id} 
              announcement={announcement}
              onClick={() => setSelectedAnnouncementId(announcement.id)}
            />
          ))}
        </div>
      )}
      
      <AnnouncementDetailDialog
        announcementId={selectedAnnouncementId}
        onClose={() => setSelectedAnnouncementId(null)}
      />
    </div>
  );
};

interface AnnouncementCardProps {
  announcement: Announcement;
  onClick: () => void;
}

const AnnouncementCard = ({ announcement, onClick }: AnnouncementCardProps) => {
  return (
    <Card 
      className="cursor-pointer hover:border-primary/50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {announcement.image_url && (
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
              <img 
                src={announcement.image_url} 
                alt={announcement.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {announcement.is_pinned && (
                <Badge variant="secondary" className="gap-1">
                  <Pin className="w-3 h-3" />
                  מוצמד
                </Badge>
              )}
              <h3 className="font-semibold text-lg">{announcement.title}</h3>
            </div>
            
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
              {announcement.content}
            </p>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>
                {format(new Date(announcement.publish_date), 'dd MMMM yyyy', { locale: he })}
              </span>
            </div>
          </div>
          
          <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0 rotate-180" />
        </div>
      </CardContent>
    </Card>
  );
};

interface AnnouncementDetailDialogProps {
  announcementId: string | null;
  onClose: () => void;
}

const AnnouncementDetailDialog = ({ announcementId, onClose }: AnnouncementDetailDialogProps) => {
  const { data: announcement, isLoading } = useAnnouncement(announcementId);
  
  return (
    <Dialog open={!!announcementId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-48" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : announcement ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                {announcement.is_pinned && (
                  <Badge variant="secondary" className="gap-1">
                    <Pin className="w-3 h-3" />
                    מוצמד
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-2xl">{announcement.title}</DialogTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(new Date(announcement.publish_date), 'dd MMMM yyyy, HH:mm', { locale: he })}
                </span>
              </div>
            </DialogHeader>
            
            {announcement.image_url && (
              <div className="rounded-lg overflow-hidden my-4">
                <img 
                  src={announcement.image_url} 
                  alt={announcement.title}
                  className="w-full object-cover max-h-80"
                />
              </div>
            )}
            
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                {announcement.content}
              </p>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default Announcements;
