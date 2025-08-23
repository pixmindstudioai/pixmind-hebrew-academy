
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { AdminModule } from '@/types/admin';

const moduleSchema = z.object({
  title: z.string().min(1, 'כותרת המודול נדרשת'),
  description: z.string().min(1, 'תיאור המודול נדרש'),
  isPublished: z.boolean().default(false),
});

type ModuleFormData = z.infer<typeof moduleSchema>;

interface ModuleFormProps {
  module?: AdminModule;
  onSubmit: (data: ModuleFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ModuleForm = ({ module, onSubmit, onCancel, isLoading }: ModuleFormProps) => {
  const form = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      title: module?.title || '',
      description: module?.description || '',
      isPublished: module?.isPublished || false,
    },
  });

  const handleSubmit = (data: ModuleFormData) => {
    onSubmit(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          {module ? 'עריכת מודול' : 'יצירת מודול חדש'}
        </h2>
        <p className="text-muted-foreground">
          {module ? 'ערוך את פרטי המודול' : 'צור מודול חדש עם פרקים ושיעורים'}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>כותרת המודול *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="הזן כותרת למודול..." 
                    {...field} 
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  כותרת ברורה ותיאורית למודול הלימוד
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>תיאור המודול *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="תאר את תוכן המודול, מה התלמידים ילמדו ואיך זה יעזור להם..."
                    className="min-h-[120px]"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  תיאור מפורט שיעזור לתלמידים להבין מה הם ילמדו במודול
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isPublished"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">פרסום המודול</FormLabel>
                  <FormDescription>
                    האם המודול יהיה זמין לתלמידים או יישאר כטיוטה
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'שומר...' : module ? 'עדכון מודול' : 'יצירת מודול'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              ביטול
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ModuleForm;
