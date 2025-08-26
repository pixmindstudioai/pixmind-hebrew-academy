import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useGrantAccess } from '@/hooks/useEnrollmentData';
import { toast } from '@/hooks/use-toast';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { he } from 'date-fns/locale';

const formSchema = z.object({
  userEmail: z.string().email('כתובת אימייל לא תקינה').min(1, 'שדה חובה'),
  moduleIds: z.array(z.string()).min(1, 'יש לבחור לפחות קורס אחד'),
  expiresAt: z.date().optional(),
  provider: z.string().default('manual'),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Module {
  id: string;
  title: string;
}

interface GrantAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modules: Module[];
  onSuccess: () => void;
}

export function GrantAccessModal({
  open,
  onOpenChange,
  modules,
  onSuccess,
}: GrantAccessModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const grantAccessMutation = useGrantAccess();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userEmail: '',
      moduleIds: [],
      provider: 'manual',
      transactionId: '',
      notes: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await grantAccessMutation.mutateAsync({
        userEmail: data.userEmail.toLowerCase().trim(),
        moduleIds: data.moduleIds,
        expiresAt: data.expiresAt,
        provider: data.provider,
        transactionId: data.transactionId,
        notes: data.notes,
      });

      toast({
        title: 'גישה נוספה בהצלחה',
        description: `נוספה גישה ל-${data.moduleIds.length} קורסים עבור ${data.userEmail}`,
      });

      form.reset();
      onSuccess();
    } catch (error) {
      toast({
        title: 'שגיאה במתן גישה',
        description: 'אירעה שגיאה במתן הגישה. נסה שוב.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModuleToggle = (moduleId: string, checked: boolean) => {
    const currentModules = form.getValues('moduleIds');
    if (checked) {
      form.setValue('moduleIds', [...currentModules, moduleId]);
    } else {
      form.setValue('moduleIds', currentModules.filter(id => id !== moduleId));
    }
  };

  const selectedModuleIds = form.watch('moduleIds');
  const selectedDate = form.watch('expiresAt');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            הוסף גישה לקורס
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* User Email */}
            <FormField
              control={form.control}
              name="userEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>כתובת אימייל *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="user@example.com"
                      {...field}
                      dir="ltr"
                      className="text-left"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Module Selection */}
            <FormField
              control={form.control}
              name="moduleIds"
              render={() => (
                <FormItem>
                  <FormLabel>קורסים *</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded-lg p-4 max-h-40 overflow-y-auto">
                    {modules.map((module) => (
                      <div key={module.id} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={module.id}
                          checked={selectedModuleIds.includes(module.id)}
                          onCheckedChange={(checked) => 
                            handleModuleToggle(module.id, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={module.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          {module.title}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Expiry Date */}
            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>תאריך תפוגה (אופציונלי)</FormLabel>
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
                            <span>בחר תאריך תפוגה</span>
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
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Provider */}
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ספק תשלום</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר ספק תשלום" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="manual">ידני</SelectItem>
                      <SelectItem value="meshulam">משולם</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="other">אחר</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Transaction ID */}
            <FormField
              control={form.control}
              name="transactionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>מזהה עסקה (אופציונלי)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="מזהה עסקה או הזמנה"
                      {...field}
                    />
                  </FormControl>
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
                  <FormLabel>הערות (אופציונלי)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="הערות נוספות על מתן הגישה"
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
                {isSubmitting ? 'מעניק גישה...' : 'הוסף גישה'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}