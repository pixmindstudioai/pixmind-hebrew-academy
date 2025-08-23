
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminSettings } from '@/types/admin';
import { useToast } from '@/hooks/use-toast';

const settingsSchema = z.object({
  siteName: z.string().min(1, 'שם האתר נדרש'),
  siteDescription: z.string().min(1, 'תיאור האתר נדרש'),
  adminDashboardEnabled: z.boolean(),
  primaryColor: z.string().min(1, 'צבע ראשי נדרש'),
  secondaryColor: z.string().min(1, 'צבע משני נדרש'),
  locale: z.string(),
  direction: z.enum(['ltr', 'rtl']),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const SettingsPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      siteName: 'אקדמיית PixMind Studio',
      siteDescription: 'פלטפורמת למידה מתקדמת עם תוכן איכותי ועדכני',
      adminDashboardEnabled: true,
      primaryColor: '#3B82F6',
      secondaryColor: '#1E293B',
      locale: 'he',
      direction: 'rtl',
    },
  });

  const handleSubmit = async (data: SettingsFormData) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Settings saved:', data);
    
    toast({
      title: "הגדרות נשמרו בהצלחה",
      description: "כל השינויים נשמרו ויופעלו באתר",
    });
    
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">הגדרות מערכת</h2>
        <p className="text-muted-foreground">
          ניהול הגדרות כלליות של האתר ולוח הבקרה
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          {/* Site Settings */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">הגדרות אתר</h3>
              <p className="text-sm text-muted-foreground">
                הגדרות בסיסיות של האתר והמיתוג
              </p>
            </div>

            <FormField
              control={form.control}
              name="siteName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם האתר</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLoading} />
                  </FormControl>
                  <FormDescription>
                    השם שיוצג בכותרת האתר ובמקומות נוספים
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="siteDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>תיאור האתר</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      disabled={isLoading}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormDescription>
                    תיאור קצר שיוצג במנועי חיפוש ובשיתופים ברשתות חברתיות
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Design Settings */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">הגדרות עיצוב</h3>
              <p className="text-sm text-muted-foreground">
                התאמת צבעים ומראה האתר
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="primaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>צבע ראשי</FormLabel>
                    <FormControl>
                      <div className="flex gap-3 items-center">
                        <Input {...field} disabled={isLoading} />
                        <div 
                          className="w-10 h-10 rounded border border-border"
                          style={{ backgroundColor: field.value }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      הצבע העיקרי של האתר (HEX)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secondaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>צבע משני</FormLabel>
                    <FormControl>
                      <div className="flex gap-3 items-center">
                        <Input {...field} disabled={isLoading} />
                        <div 
                          className="w-10 h-10 rounded border border-border"
                          style={{ backgroundColor: field.value }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      צבע משני לרקעים ואלמנטים (HEX)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Localization Settings */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">הגדרות שפה וזמן</h3>
              <p className="text-sm text-muted-foreground">
                הגדרות שפה וכיווניות הטקסט
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="locale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שפת האתר</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר שפה" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="he">עברית</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      השפה הראשית של האתר
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="direction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>כיוון הטקסט</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר כיוון" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="rtl">מימין לשמאל (RTL)</SelectItem>
                        <SelectItem value="ltr">משמאל לימין (LTR)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      כיוון הטקסט והממשק
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Admin Settings */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">הגדרות ניהול</h3>
              <p className="text-sm text-muted-foreground">
                הגדרות לוח הבקרה והרשאות
              </p>
            </div>

            <FormField
              control={form.control}
              name="adminDashboardEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">הפעלת לוח בקרה</FormLabel>
                    <FormDescription>
                      האם לוח הבקרה של המנהלים יהיה זמין ופעיל
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
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'שומר...' : 'שמירת הגדרות'}
            </Button>
            <Button type="button" variant="outline" disabled={isLoading}>
              איפוס לברירת מחדל
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default SettingsPage;
