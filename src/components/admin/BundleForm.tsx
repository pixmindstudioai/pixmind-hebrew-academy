import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Badge } from '@/components/ui/badge';
import { Package, GripVertical, X } from 'lucide-react';
import ThumbnailUploader from './ThumbnailUploader';
import { useModules } from '@/hooks/useAdminData';
import type { BundleWithModules } from '@/types/bundle';

const bundleSchema = z.object({
  title: z.string().min(2, 'כותרת החבילה חייבת להכיל לפחות 2 תווים').max(120, 'כותרת החבילה לא יכולה להכיל יותר מ-120 תווים'),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  order_index: z.number().min(0, 'מספר הסדר חייב להיות 0 או יותר').optional(),
  is_paid: z.boolean().default(false),
  payment_url: z.string().url('יש להזין כתובת URL תקינה').optional().or(z.literal('')),
  apple_product_id: z.string().optional().or(z.literal('')),
  thumbnail_url: z.string().url('יש להזין כתובת URL תקינה לתמונה').optional().or(z.literal('')),
  regular_price: z.number().min(0, 'המחיר חייב להיות 0 או יותר').optional().nullable(),
  sale_price: z.number().min(0, 'מחיר המבצע חייב להיות 0 או יותר').optional().nullable(),
  sale_active: z.boolean().default(false),
  sale_start_date: z.string().optional().nullable(),
  sale_end_date: z.string().optional().nullable(),
  module_ids: z.array(z.string()).default([]),
}).refine((data) => {
  if (data.is_paid && (!data.payment_url || data.payment_url.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: 'עבור חבילה בתשלום חובה להזין קישור לעמוד תשלום',
  path: ['payment_url'],
}).refine((data) => {
  if (data.sale_active && data.regular_price && data.sale_price) {
    return data.sale_price < data.regular_price;
  }
  return true;
}, {
  message: 'מחיר המבצע חייב להיות נמוך ממחיר רגיל',
  path: ['sale_price'],
});

type BundleFormData = z.infer<typeof bundleSchema>;

interface BundleFormProps {
  bundle?: BundleWithModules;
  onSubmit: (data: BundleFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const BundleForm = ({ bundle, onSubmit, onCancel, isLoading }: BundleFormProps) => {
  const { data: allModules = [] } = useModules();

  const form = useForm<BundleFormData>({
    resolver: zodResolver(bundleSchema),
    defaultValues: {
      title: bundle?.title || '',
      description: bundle?.description || '',
      status: (bundle?.status as 'draft' | 'active' | 'archived') || 'draft',
      order_index: bundle?.order_index || 0,
      is_paid: bundle?.is_paid || false,
      payment_url: bundle?.payment_url || '',
      apple_product_id: bundle?.apple_product_id || '',
      thumbnail_url: bundle?.thumbnail_url || '',
      regular_price: bundle?.regular_price || null,
      sale_price: bundle?.sale_price || null,
      sale_active: bundle?.sale_active || false,
      sale_start_date: bundle?.sale_start_date || null,
      sale_end_date: bundle?.sale_end_date || null,
      module_ids: bundle?.modules?.map(m => m.id) || [],
    },
  });

  const selectedModuleIds = form.watch('module_ids');
  const availableModules = allModules.filter(m => m.status === 'active' || selectedModuleIds.includes(m.id));

  const handleModuleToggle = (moduleId: string, checked: boolean) => {
    const current = form.getValues('module_ids');
    if (checked) {
      form.setValue('module_ids', [...current, moduleId]);
    } else {
      form.setValue('module_ids', current.filter(id => id !== moduleId));
    }
  };

  const moveModule = (index: number, direction: 'up' | 'down') => {
    const current = [...form.getValues('module_ids')];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= current.length) return;

    [current[index], current[newIndex]] = [current[newIndex], current[index]];
    form.setValue('module_ids', current);
  };

  const handleSubmit = (data: BundleFormData) => {
    onSubmit(data);
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto px-1">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6 text-primary" />
          {bundle ? 'עריכת חבילה' : 'יצירת חבילה חדשה'}
        </h2>
        <p className="text-muted-foreground">
          {bundle ? 'ערוך את פרטי החבילה' : 'צור חבילה חדשה המכילה מספר קורסים'}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>כותרת החבילה *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="הזן כותרת לחבילה..." 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    כותרת ברורה ותיאורית לחבילת הקורסים
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
                  <FormLabel>תיאור החבילה</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="תאר את תוכן החבילה..."
                      className="min-h-[100px]"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
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
                    label="תמונת החבילה"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סטטוס</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">טיוטה</SelectItem>
                        <SelectItem value="active">פעיל</SelectItem>
                        <SelectItem value="archived">בארכיון</SelectItem>
                      </SelectContent>
                    </Select>
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
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Modules Selection */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
            <h3 className="text-lg font-semibold">קורסים בחבילה</h3>
            
            {/* Selected Modules (Reorderable) */}
            {selectedModuleIds.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-sm text-muted-foreground">קורסים נבחרים (גרור לסידור מחדש):</p>
                {selectedModuleIds.map((moduleId, index) => {
                  const module = allModules.find(m => m.id === moduleId);
                  if (!module) return null;
                  return (
                    <div 
                      key={moduleId}
                      className="flex items-center gap-2 p-2 bg-card rounded-lg border"
                    >
                      <div className="flex flex-col gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => moveModule(index, 'up')}
                          disabled={index === 0}
                        >
                          <GripVertical className="w-3 h-3" />
                        </Button>
                      </div>
                      <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                      <span className="flex-1 text-sm font-medium">{module.title}</span>
                      {module.is_paid && (
                        <Badge variant="outline" className="text-xs">בתשלום</Badge>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => handleModuleToggle(moduleId, false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Available Modules */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <p className="text-sm text-muted-foreground">הוסף קורסים לחבילה:</p>
              {availableModules.filter(m => !selectedModuleIds.includes(m.id)).map((module) => (
                <div 
                  key={module.id}
                  className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg"
                >
                  <Checkbox
                    id={`module-${module.id}`}
                    checked={selectedModuleIds.includes(module.id)}
                    onCheckedChange={(checked) => handleModuleToggle(module.id, !!checked)}
                  />
                  <label 
                    htmlFor={`module-${module.id}`}
                    className="flex-1 text-sm cursor-pointer"
                  >
                    {module.title}
                  </label>
                  {module.is_paid && (
                    <Badge variant="outline" className="text-xs">בתשלום</Badge>
                  )}
                </div>
              ))}
              {availableModules.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  אין קורסים זמינים להוספה
                </p>
              )}
            </div>
          </div>

          {/* Pricing */}
          <FormField
            control={form.control}
            name="is_paid"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">סוג החבילה</FormLabel>
                  <FormDescription>
                    {field.value ? 'חבילה בתשלום - נדרש קישור לעמוד תשלום' : 'חבילה חינמית - זמינה לכל המשתמשים'}
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
                    <SelectItem value="free">חינמית</SelectItem>
                    <SelectItem value="paid">בתשלום</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {form.watch('is_paid') && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <h3 className="text-lg font-semibold">מחירון ותשלום</h3>
              
              <FormField
                control={form.control}
                name="payment_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>קישור לעמוד תשלום *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://checkout.mysite.com/bundle123"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apple_product_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מזהה מוצר Apple (IAP)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="com.pixmind.academy.bundle.pro"
                        dir="ltr"
                        {...field}
                        value={field.value ?? ''}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      ה-Product ID של החבילה ב-App Store Connect — דרוש לרכישה באפליקציית ה-iOS. השאר ריק אם נמכרת רק באתר.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        placeholder="499.00"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        disabled={isLoading}
                      />
                    </FormControl>
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
                            {field.value ? '🔥 מבצע פעיל' : 'מבצע מושבת'}
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
                                placeholder="299.00"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                disabled={isLoading}
                              />
                            </FormControl>
                            {field.value && form.watch('regular_price') && (
                              <FormDescription className="text-primary font-bold">
                                חיסכון: ₪{(form.watch('regular_price')! - field.value).toFixed(2)} 
                                ({Math.round(((form.watch('regular_price')! - field.value) / form.watch('regular_price')!) * 100)}% הנחה)
                              </FormDescription>
                            )}
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
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              ביטול
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'שומר...' : bundle ? 'עדכון חבילה' : 'יצירת חבילה'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default BundleForm;
