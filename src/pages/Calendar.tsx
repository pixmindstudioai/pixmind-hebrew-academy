import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCalendarData, CalendarEvent, getEventTypeLabel } from '@/hooks/useCalendarData';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar as CalendarIcon, 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  MapPin, 
  Link as LinkIcon,
  List,
  CalendarDays,
  ExternalLink
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const Calendar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { userEvents, userEventsLoading } = useCalendarData();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    navigate('/login');
    return null;
  }

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Group events by date for calendar view
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    userEvents.forEach(event => {
      const dateKey = format(new Date(event.start_datetime), 'yyyy-MM-dd');
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(event);
    });
    return grouped;
  }, [userEvents]);

  // Get upcoming events sorted by date
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return userEvents
      .filter(event => new Date(event.start_datetime) >= now)
      .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());
  }, [userEvents]);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'live_lesson': return 'bg-blue-500';
      case 'deadline': return 'bg-red-500';
      case 'meeting': return 'bg-green-500';
      case 'broadcast': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (authLoading || userEventsLoading) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8" dir="rtl">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">יומן</h1>
          <p className="text-muted-foreground">אירועים, מפגשים ודדליינים</p>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'calendar' | 'list')}>
          <TabsList>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarDays className="w-4 h-4" />
              לוח שנה
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="w-4 h-4" />
              רשימה
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === 'calendar' ? (
        <Card>
          <CardContent className="p-4 md:p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronRight className="w-5 h-5" />
              </Button>
              <h2 className="text-base sm:text-xl font-semibold">
                {format(currentMonth, 'MMMM yyyy', { locale: he })}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
              {['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: calendarDays[0].getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[64px] sm:min-h-[80px] md:min-h-[100px] bg-muted/30 rounded-lg" />
              ))}

              {calendarDays.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayEvents = eventsByDate[dateKey] || [];
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={dateKey}
                    className={cn(
                      "min-h-[64px] sm:min-h-[80px] md:min-h-[100px] p-0.5 sm:p-1 md:p-2 rounded-lg border transition-colors",
                      isCurrentDay ? "border-primary bg-primary/5" : "border-border/50 hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "text-sm font-medium mb-1",
                      isCurrentDay && "text-primary"
                    )}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <button
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={cn(
                            "w-full text-right text-xs p-1 rounded truncate text-white",
                            getEventTypeColor(event.event_type)
                          )}
                        >
                          {event.title}
                        </button>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{dayEvents.length - 2} נוספים
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {upcomingEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">אין אירועים קרובים</h3>
                <p className="text-muted-foreground">לא נמצאו אירועים בלוח השנה</p>
              </CardContent>
            </Card>
          ) : (
            upcomingEvents.map(event => (
              <Card 
                key={event.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedEvent(event)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-2 h-full min-h-[60px] rounded-full",
                      getEventTypeColor(event.event_type)
                    )} />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold">{event.title}</h3>
                        <Badge variant="outline">{getEventTypeLabel(event.event_type)}</Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {format(new Date(event.start_datetime), 'EEEE, dd בMMMM yyyy', { locale: he })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(event.start_datetime), 'HH:mm')}
                          {event.end_datetime && (
                            <> - {format(new Date(event.end_datetime), 'HH:mm')}</>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <span>{selectedEvent?.title}</span>
              <Badge variant="outline">{selectedEvent && getEventTypeLabel(selectedEvent.event_type)}</Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  {format(new Date(selectedEvent.start_datetime), 'EEEE, dd בMMMM yyyy', { locale: he })}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  {format(new Date(selectedEvent.start_datetime), 'HH:mm')}
                  {selectedEvent.end_datetime && (
                    <> - {format(new Date(selectedEvent.end_datetime), 'HH:mm')}</>
                  )}
                </div>
              </div>

              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {selectedEvent.location}
                </div>
              )}

              {selectedEvent.description && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{selectedEvent.description}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-4">
                {selectedEvent.external_link && (
                  <Button asChild variant="outline" className="gap-2">
                    <a href={selectedEvent.external_link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                      פתח קישור
                    </a>
                  </Button>
                )}
                {selectedEvent.attachment_url && (
                  <Button asChild variant="outline" className="gap-2">
                    <a href={selectedEvent.attachment_url} target="_blank" rel="noopener noreferrer">
                      <LinkIcon className="w-4 h-4" />
                      קובץ מצורף
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;
