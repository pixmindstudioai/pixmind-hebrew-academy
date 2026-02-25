import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: 'live_lesson' | 'deadline' | 'meeting' | 'broadcast' | 'other';
  start_datetime: string;
  end_datetime: string | null;
  location: string | null;
  external_link: string | null;
  attachment_url: string | null;
  access_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CalendarEventVisibility {
  id: string;
  event_id: string;
  module_id: string | null;
  bundle_id: string | null;
  cohort_id: string | null;
  created_at: string;
}

export interface CalendarEventFormData {
  title: string;
  description: string;
  event_type: 'live_lesson' | 'deadline' | 'meeting' | 'broadcast' | 'other';
  start_datetime: string;
  end_datetime: string;
  location: string;
  external_link: string;
  attachment_url: string;
  access_type: 'all' | 'restricted';
  is_active: boolean;
  visibility_modules: string[];
  visibility_bundles: string[];
  visibility_cohorts: string[];
}

const eventTypeLabels: Record<string, string> = {
  live_lesson: 'שיעור חי',
  deadline: 'דדליין',
  meeting: 'מפגש',
  broadcast: 'שידור',
  other: 'אחר'
};

export const getEventTypeLabel = (type: string): string => {
  return eventTypeLabels[type] || type;
};

export const useCalendarData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all events (admin view)
  const { data: allEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['admin-calendar-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('start_datetime', { ascending: true });

      if (error) throw error;
      return data as CalendarEvent[];
    }
  });

  // Fetch user-visible events
  const { data: userEvents = [], isLoading: userEventsLoading } = useQuery({
    queryKey: ['user-calendar-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('is_active', true)
        .order('start_datetime', { ascending: true });

      if (error) throw error;
      return data as CalendarEvent[];
    }
  });

  // Fetch visibility settings for an event
  const fetchEventVisibility = async (eventId: string): Promise<CalendarEventVisibility[]> => {
    const { data, error } = await supabase
      .from('calendar_event_visibility')
      .select('*')
      .eq('event_id', eventId);

    if (error) throw error;
    return data || [];
  };

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (formData: CalendarEventFormData) => {
      // Create the event
      const { data: event, error: eventError } = await supabase
        .from('calendar_events')
        .insert({
          title: formData.title,
          description: formData.description || null,
          event_type: formData.event_type,
          start_datetime: formData.start_datetime,
          end_datetime: formData.end_datetime || null,
          location: formData.location || null,
          external_link: formData.external_link || null,
          attachment_url: formData.attachment_url || null,
          access_type: formData.access_type,
          is_active: formData.is_active
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Add visibility settings if restricted
      if (formData.access_type === 'restricted') {
        const visibilityRecords = [
          ...formData.visibility_modules.map(moduleId => ({
            event_id: event.id,
            module_id: moduleId,
            bundle_id: null,
            cohort_id: null
          })),
          ...formData.visibility_bundles.map(bundleId => ({
            event_id: event.id,
            module_id: null,
            bundle_id: bundleId,
            cohort_id: null
          })),
          ...formData.visibility_cohorts.map(cohortId => ({
            event_id: event.id,
            module_id: null,
            bundle_id: null,
            cohort_id: cohortId
          }))
        ];

        if (visibilityRecords.length > 0) {
          const { error: visError } = await supabase
            .from('calendar_event_visibility')
            .insert(visibilityRecords);

          if (visError) throw visError;
        }
      }

      return event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['user-calendar-events'] });
      toast({
        title: 'אירוע נוצר בהצלחה',
        description: 'האירוע נוסף ליומן'
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה ביצירת אירוע',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: CalendarEventFormData }) => {
      // Update the event
      const { data: event, error: eventError } = await supabase
        .from('calendar_events')
        .update({
          title: formData.title,
          description: formData.description || null,
          event_type: formData.event_type,
          start_datetime: formData.start_datetime,
          end_datetime: formData.end_datetime || null,
          location: formData.location || null,
          external_link: formData.external_link || null,
          attachment_url: formData.attachment_url || null,
          access_type: formData.access_type,
          is_active: formData.is_active
        })
        .eq('id', id)
        .select()
        .single();

      if (eventError) throw eventError;

      // Delete existing visibility settings
      const { error: deleteError } = await supabase
        .from('calendar_event_visibility')
        .delete()
        .eq('event_id', id);

      if (deleteError) throw deleteError;

      // Add new visibility settings if restricted
      if (formData.access_type === 'restricted') {
        const visibilityRecords = [
          ...formData.visibility_modules.map(moduleId => ({
            event_id: id,
            module_id: moduleId,
            bundle_id: null,
            cohort_id: null
          })),
          ...formData.visibility_bundles.map(bundleId => ({
            event_id: id,
            module_id: null,
            bundle_id: bundleId,
            cohort_id: null
          })),
          ...formData.visibility_cohorts.map(cohortId => ({
            event_id: id,
            module_id: null,
            bundle_id: null,
            cohort_id: cohortId
          }))
        ];

        if (visibilityRecords.length > 0) {
          const { error: visError } = await supabase
            .from('calendar_event_visibility')
            .insert(visibilityRecords);

          if (visError) throw visError;
        }
      }

      return event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['user-calendar-events'] });
      toast({
        title: 'אירוע עודכן בהצלחה',
        description: 'השינויים נשמרו'
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה בעדכון אירוע',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['user-calendar-events'] });
      toast({
        title: 'אירוע נמחק בהצלחה'
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה במחיקת אירוע',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Toggle event active status
  const toggleEventActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('calendar_events')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['user-calendar-events'] });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה בעדכון סטטוס',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  return {
    allEvents,
    userEvents,
    eventsLoading,
    userEventsLoading,
    fetchEventVisibility,
    createEvent: createEventMutation.mutate,
    updateEvent: updateEventMutation.mutate,
    deleteEvent: deleteEventMutation.mutate,
    toggleEventActive: toggleEventActiveMutation.mutate,
    isCreating: createEventMutation.isPending,
    isUpdating: updateEventMutation.isPending,
    isDeleting: deleteEventMutation.isPending
  };
};
