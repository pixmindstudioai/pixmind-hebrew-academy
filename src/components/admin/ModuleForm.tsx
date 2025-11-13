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
import ThumbnailUploader from './ThumbnailUploader';

const moduleSchema = z.object({
  title: z.string().min(2, 'כותרת המודול חייבת להכיל לפחות 2 תווים').max(120, 'כותרת המודול לא יכולה להכיל יותר מ-120 תווים'),
  description: z.string().min(1, 'תיאור המודול נדרש'),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  order_index: z.number().min(0, 'מספר הסדר חייב להיות 0 או יותר').optional(),
  is_paid: z.boolean().default(false),
  is_hidden: z.boolean().default(false),
  payment_url: z.string().url('יש להזין כתובת URL תקינה').optional().or(z.literal('')),
  thumbnail_url: z.string().url('יש להזין כתובת URL תקינה לתמונה').optional().or(z.literal('')),
  regular_price: z.number().min(0, 'המחיר חייב להיות 0 או יותר').optional().nullable(),
  sale_price: z.number().min(0, 'מחיר המבצע חייב להיות 0 או יותר').optional().nullable(),
  sale_active: z.boolean().default(false),
  sale_start_date: z.string().optional().nullable(),
  sale_end_date: z.string().optional().nullable(),
}).refine((data) => {
  // If is_paid is true, payment_url must be provided and not empty
  if (data.is_paid && (!data.payment_url || data.payment_url.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: 'עבור מודול בתשלום חובה להזין קישור לעמוד תשלום',
  path: ['payment_url'],
}).refine((data) => {
  // If sale_active is true and prices exist, sale_price must be less than regular_price
  if (data.sale_active && data.regular_price && data.sale_price) {
    return data.sale_price < data.regular_price;
  }
  return true;
}, {
  message: 'מחיר המבצע חייב להיות נמוך ממחיר רגיל',
  path: ['sale_price'],
});

type ModuleFormData = z.infer<typeof moduleSchema>;

interface Module {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'archived';
  order_index: number;
  is_paid: boolean;
  is_hidden: boolean;
  payment_url?: string;
  thumbnail_url?: string;
  regular_price?: number | null;
  sale_price?: number | null;
  sale_active?: boolean;
  sale_start_date?: string | null;
  sale_end_date?: string | null;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

interface ModuleFormProps {
  module?: Module;
  onSubmit: (data: ModuleFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  showActions?: boolean;
}

const ModuleForm = ({ module, onSubmit, onCancel, isLoading, showActions = true }: ModuleFormProps) => {
  const form = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      title: module?.title || '',
      description: module?.description || '',
      status: module?.status || 'draft',
      order_index: module?.order_index || 0,
      is_paid: module?.is_paid || false,
      is_hidden: module?.is_hidden || false,
      payment_url: module?.payment_url || '',
      thumbnail_url: module?.thumbnail_url || '',
      regular_price: module?.regular_price || null,
      sale_price: module?.sale_price || null,
      sale_active: module?.sale_active || false,
      sale_start_date: module?.sale_start_date || null,
      sale_end_date: module?.sale_end_date || null,
    },
  });

  const handleSubmit = (data: ModuleFormData) => {
    onSubmit(data);
  };

  return (
    <div className="space-y-6">
      {showActions && (
        <div>
          <h2 className="text-2xl font-bold">
            {module ? 'עריכת מודול' : 'יצירת מודול חדש'}
          </h2>
          <p className="text-muted-foreground">
            {module ? 'ערוך את פרטי המודול' : 'צור מודול חדש עם פרקים ושיעורים'}
          </p>
        </div>
      )}

      <Form {...form}>
        <form 
          id="module-form"
          onSubmit={form.handleSubmit(handleSubmit)} 
          className="space-y-6"
        >
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
            name="thumbnail_url"
            render={({ field }) => (
              <FormItem>
                <ThumbnailUploader
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isLoading}
                  label="תמונת ת׳אמבנייל"
                />
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
            <>
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

              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <h3 className="text-lg font-semibold">מחירון ומבצעים</h3>
                
                <FormField
                  control={form.control}
                  name="regular_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>מחיר רגיל (₪)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="299.00"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        המחיר הרגיל של הקורס בשקלים
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('regular_price') && (
                  <>
                    <FormField
                      control={form.control}
                      name="sale_active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-background">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">הפעל מבצע</FormLabel>
                            <FormDescription>
                              {field.value ? '🔥 מבצע פעיל - מחיר מבצע יוצג למשתמשים' : 'מבצע מושבת'}
                            </FormDescription>
                          </div>
                          <Select 
                            onValueChange={(value) => field.onChange(value === 'active')} 
                            value={field.value ? 'active' : 'inactive'}
                            disabled={isLoading}
                          >
                            <FormControl>
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="inactive">לא פעיל</SelectItem>
                              <SelectItem value="active">פעיל</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    {form.watch('sale_active') && (
                      <>
                        <FormField
                          control={form.control}
                          name="sale_price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>מחיר מבצע (₪) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="199.00"
                                  {...field}
                                  value={field.value || ''}
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                  disabled={isLoading}
                                />
                              </FormControl>
                              <FormDescription>
                                {field.value && form.watch('regular_price') && (
                                  <span className="text-primary font-bold">
                                    חיסכון: ₪{(form.watch('regular_price')! - field.value).toFixed(2)} 
                                    ({Math.round(((form.watch('regular_price')! - field.value) / form.watch('regular_price')!) * 100)}% הנחה)
                                  </span>
                                )}
                                {(!field.value || !form.watch('regular_price')) && 'המחיר שיוצג במהלך המבצע'}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="sale_start_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>תאריך התחלה (אופציונלי)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="datetime-local"
                                    {...field}
                                    value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
                                    disabled={isLoading}
                                  />
                                </FormControl>
                                <FormDescription>
                                  המבצע יתחיל בתאריך זה
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="sale_end_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>תאריך סיום (אופציונלי)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="datetime-local"
                                    {...field}
                                    value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
                                    disabled={isLoading}
                                  />
                                </FormControl>
                                <FormDescription>
                                  המבצע יסתיים בתאריך זה
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          <FormField
            control={form.control}
            name="is_hidden"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">נראות הקורס</FormLabel>
                  <FormDescription>
                    {field.value ? '🔒 הקורס מוסתר - רק משתמשים רשומים רואים אותו' : '👁️ הקורס גלוי - מופיע לכל המבקרים'}
                  </FormDescription>
                </div>
                <Select 
                  onValueChange={(value) => field.onChange(value === 'hidden')} 
                  value={field.value ? 'hidden' : 'visible'}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="visible">גלוי</SelectItem>
                    <SelectItem value="hidden">מוסתר</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

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

          {showActions && (
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'שומר...' : module ? 'עדכון מודול' : 'יצירת מודול'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                ביטול
              </Button>
            </div>
          )}
          
          {/* Add bottom padding when actions are not shown to prevent content from being hidden behind sticky footer */}
          {!showActions && <div className="pb-6" />}
        </form>
      </Form>
    </div>
  );
};

export default ModuleForm;