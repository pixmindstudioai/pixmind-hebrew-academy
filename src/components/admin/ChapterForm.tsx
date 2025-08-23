
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const chapterSchema = z.object({
  title: z.string().min(2, 'כותרת הפרק חייבת להכיל לפחות 2 תווים').max(120, 'כותרת הפרק לא יכולה להכיל יותר מ-120 תווים'),
  description: z.string().optional(),
  module_id: z.string().min(1, 'יש לבחור מודול'),
  order_index: z.number().min(0, 'מספר הסדר חייב להיות 0 או יותר'),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
});

type ChapterFormData = z.infer<typeof chapterSchema>;

interface Module {
  id: string;
  title: string;
  status: 'draft' | 'active' | 'archived';
}

interface Chapter {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  order_index: number;
  status: 'draft' | 'active' | 'archived';
  created_at: string;
  updated_at: string;
  published_at?: string;
}

interface ChapterFormProps {
  chapter?: Chapter;
  modules: Module[];
  onSubmit: (data: ChapterFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ChapterForm = ({ chapter, modules, onSubmit, onCancel, isLoading }: ChapterFormProps) => {
  const form = useForm<ChapterFormData>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      title: chapter?.title || '',
      description: chapter?.description || '',
      module_id: chapter?.module_id || '',
      order_index: chapter?.order_index || 0,
      status: chapter?.status || 'draft',
    },
  });

  const handleSubmit = (data: ChapterFormData) => {
    onSubmit(data);
  };

  const selectedModuleStatus = modules.find(m => m.id === form.watch('module_id'))?.status;
  const canPublish = selectedModuleStatus === 'active';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          {chapter ? 'עריכת פרק' : 'יצירת פרק חדש'}
        </h2>
        <p className="text-muted-foreground">
          {chapter ? 'ערוך את פרטי הפרק' : 'צור פרק חדש עם שיעורים'}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="module_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>מודול האב *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!chapter || isLoading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר מודול..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.title} ({module.status === 'active' ? 'פעיל' : module.status === 'draft' ? 'טיוטה' : 'בארכיון'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  הפרק יוקם תחת המודול הנבחר
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>כותרת הפרק *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="הזן כותרת לפרק..." 
                    {...field} 
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  כותרת ברורה ותיאורית לפרק הלימוד (2-120 תווים)
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
                <FormLabel>תיאור הפרק</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="תאר את תוכן הפרק (אופציונלי)..."
                    className="min-h-[100px]"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  תיאור קצר שיעזור לתלמידים להבין את תוכן הפרק
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="order_index"
            render={({ field }) => (
              <FormItem>
                <FormLabel>מספר סדר</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  קביעת סדר הפרק במודול (0 = ראשון)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">סטטוס הפרק</FormLabel>
                  <FormDescription>
                    {!canPublish && field.value === 'active' && (
                      <span className="text-orange-600">
                        ⚠️ המודול האב חייב להיות פעיל כדי לפרסם פרק
                      </span>
                    )}
                    {canPublish && field.value === 'active' && (
                      <span className="text-green-600">
                        ✓ הפרק יהיה זמין לתלמידים
                      </span>
                    )}
                    {field.value === 'draft' && 'הפרק נשמר כטיוטה'}
                    {field.value === 'archived' && 'הפרק בארכיון'}
                  </FormDescription>
                </div>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                  <FormControl>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">טיוטה</SelectItem>
                    <SelectItem value="active" disabled={!canPublish}>
                      פעיל
                    </SelectItem>
                    <SelectItem value="archived">בארכיון</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'שומר...' : chapter ? 'עדכון פרק' : 'יצירת פרק'}
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

export default ChapterForm;
