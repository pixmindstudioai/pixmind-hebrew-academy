
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
import { useCohorts } from '@/hooks/useCohortsData';

const chapterSchema = z.object({
  title: z.string().min(2, 'כותרת הפרק חייבת להכיל לפחות 2 תווים').max(120, 'כותרת הפרק לא יכולה להכיל יותר מ-120 תווים'),
  description: z.string().optional(),
  module_id: z.string().min(1, 'יש לבחור מודול'),
  order_index: z.number().min(0, 'מספר הסדר חייב להיות 0 או יותר'),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  visibility_mode: z.enum(['all', 'cohort']).default('all'),
  cohort_id: z.string().nullable().optional(),
}).refine(
  (data) => data.visibility_mode !== 'cohort' || (data.cohort_id && data.cohort_id.length > 0),
  {
    message: 'יש לבחור מחזור לפרק זה',
    path: ['cohort_id'],
  }
);

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
  visibility_mode?: string;
  cohort_id?: string | null;
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
      visibility_mode: (chapter?.visibility_mode as 'all' | 'cohort') || 'all',
      cohort_id: chapter?.cohort_id || null,
    },
  });

  const selectedModuleId = form.watch('module_id');
  const visibilityMode = form.watch('visibility_mode');

  // Fetch cohorts for the selected module
  const { data: cohorts = [] } = useCohorts(selectedModuleId);
  const activeCohorts = cohorts.filter(c => c.is_active);

  const handleSubmit = (data: ChapterFormData) => {
    // Clear cohort_id if visibility is not cohort-specific
    if (data.visibility_mode !== 'cohort') {
      data.cohort_id = null;
    }
    onSubmit(data);
  };

  const selectedModuleStatus = modules.find(m => m.id === selectedModuleId)?.status;
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

          {/* Visibility Section */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">נגישות הפרק</h3>
            
            <FormField
              control={form.control}
              name="visibility_mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>מי יכול לראות את הפרק</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Clear cohort_id when switching away from cohort mode
                      if (value !== 'cohort') {
                        form.setValue('cohort_id', null);
                      }
                    }} 
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">פתוח לכל מי שיש לו גישה למודול</SelectItem>
                      <SelectItem value="cohort">זמין רק למחזור מסוים</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {field.value === 'all' && 'הפרק יהיה גלוי לכל התלמידים שיש להם גישה למודול'}
                    {field.value === 'cohort' && 'הפרק יהיה גלוי רק לתלמידים במחזור הנבחר'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {visibilityMode === 'cohort' && (
              <FormField
                control={form.control}
                name="cohort_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>בחר מחזור *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ''} 
                      disabled={isLoading || !selectedModuleId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר מחזור..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeCohorts.length === 0 ? (
                          <SelectItem value="" disabled>
                            אין מחזורים פעילים למודול זה
                          </SelectItem>
                        ) : (
                          activeCohorts.map((cohort) => (
                            <SelectItem key={cohort.id} value={cohort.id}>
                              {cohort.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      רק תלמידים במחזור זה יוכלו לצפות בפרק
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

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
