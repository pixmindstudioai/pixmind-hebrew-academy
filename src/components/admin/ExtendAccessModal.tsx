import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateUserAccess } from '@/hooks/useUserAccess';
import { toast } from '@/hooks/use-toast';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { he } from 'date-fns/locale';

const formSchema = z.object({
  expiresAt: z.date().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Enrollment {
  id: string;
  user_email: string;
  user_name?: string;
  module_title: string;
  expires_at?: string;
  notes?: string;
}

interface ExtendAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrollment: Enrollment | null;
  onSuccess: () => void;
}

export function ExtendAccessModal({
  open,
  onOpenChange,
  enrollment,
  onSuccess,
}: ExtendAccessModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateAccessMutation = useUpdateUserAccess();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      expiresAt: enrollment?.expires_at ? new Date(enrollment.expires_at) : undefined,
      notes: enrollment?.notes || '',
    },
  });

  // Reset form when enrollment changes
  useEffect(() => {
    if (enrollment) {
      form.reset({
        expiresAt: enrollment.expires_at ? new Date(enrollment.expires_at) : undefined,
        notes: enrollment.notes || '',
      });
    }
  }, [enrollment, form]);

  const onSubmit = async (data: FormData) => {
    if (!enrollment) return;

    setIsSubmitting(true);
    try {
      await updateAccessMutation.mutateAsync({
        id: enrollment.id,
        expires_at: data.expiresAt?.toISOString(),
        notes: data.notes,
      });

      toast({
        title: 'הגישה עודכנה בהצלחה',
        description: `הגישה עבור ${enrollment.user_email} עודכנה`,
      });

      onSuccess();
    } catch (error) {
      toast({
        title: 'שגיאה בעדכון הגישה',
        description: 'אירעה שגיאה בעדכון הגישה. נסה שוב.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDate = form.watch('expiresAt');

  if (!enrollment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            עדכון גישה
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-4 bg-muted rounded-lg">
          <div className="space-y-1 text-sm">
            <div><strong>משתמש:</strong> {enrollment.user_name || enrollment.user_email}</div>
            <div><strong>קורס:</strong> {enrollment.module_title}</div>
            <div><strong>תפוגה נוכחית:</strong> {
              enrollment.expires_at ? 
                new Date(enrollment.expires_at).toLocaleDateString('he-IL') : 
                'ללא הגבלה'
              }
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* New Expiry Date */}
            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>תאריך תפוגה חדש</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full pl-3 text-right font-normal"
                        >
                          {selectedDate ? (
                            format(selectedDate, 'PPP', { locale: he })
                          ) : (
                            <span>בחר תאריך תפוגה (או השאר ריק לללא הגבלה)</span>
                          )}
                          <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date()
                        }
                        initialFocus
                        locale={he}
                      />
                      <div className="p-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => field.onChange(undefined)}
                          className="w-full"
                        >
                          הסר תאריך תפוגה (ללא הגבלה)
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>הערות</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="הערות על העדכון"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                ביטול
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'מעדכן...' : 'עדכן גישה'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}