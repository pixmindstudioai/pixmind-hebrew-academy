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

const moduleSchema = z.object({
  title: z.string().min(2, 'כותרת המודול חייבת להכיל לפחות 2 תווים').max(120, 'כותרת המודול לא יכולה להכיל יותר מ-120 תווים'),
  description: z.string().min(1, 'תיאור המודול נדרש'),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  order_index: z.number().min(0, 'מספר הסדר חייב להיות 0 או יותר').optional(),
  is_paid: z.boolean().default(false),
  payment_url: z.string().url('יש להזין כתובת URL תקינה').optional().or(z.literal('')),
}).refine((data) => {
  // If is_paid is true, payment_url must be provided and not empty
  if (data.is_paid && (!data.payment_url || data.payment_url.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: 'עבור מודול בתשלום חובה להזין קישור לעמוד תשלום',
  path: ['payment_url'],
});

type ModuleFormData = z.infer<typeof moduleSchema>;

interface Module {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'archived';
  order_index: number;
  is_paid: boolean;
  payment_url?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

interface ModuleFormProps {
  module?: Module;
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
      status: module?.status || 'draft',
      order_index: module?.order_index || 0,
      is_paid: module?.is_paid || false,
      payment_url: module?.payment_url || '',
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
                  כותרת ברורה ותיאורית למודול הלימוד (2-120 תווים)
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
                  קביעת סדר המודול באתר (0 = ראשון)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_paid"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">סוג המודול</FormLabel>
                  <FormDescription>
                    {field.value ? 'מודול בתשלום - נדרש קישור לעמוד תשלום' : 'מודול חינמי - זמין לכל המשתמשים'}
                  </FormDescription>
                </div>
                <Select 
                  onValueChange={(value) => field.onChange(value === 'paid')} 
                  value={field.value ? 'paid' : 'free'}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="free">חינמי</SelectItem>
                    <SelectItem value="paid">בתשלום</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {form.watch('is_paid') && (
            <FormField
              control={form.control}
              name="payment_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>קישור לעמוד תשלום *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://checkout.mysite.com/module123" 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    הקישור שאליו יועברו המשתמשים כדי לרכוש את המודול
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">סטטוס המודול</FormLabel>
                  <FormDescription>
                    {field.value === 'active' && '✓ המודול יהיה זמין לתלמידים'}
                    {field.value === 'draft' && 'המודול נשמר כטיוטה'}
                    {field.value === 'archived' && 'המודול בארכיון'}
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
                    <SelectItem value="active">פעיל</SelectItem>
                    <SelectItem value="archived">בארכיון</SelectItem>
                  </SelectContent>
                </Select>
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