
import { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VideoUrlInput from './VideoUrlInput';
import AttachmentManager from './AttachmentManager';
import EmbedManager from './EmbedManager';
import LinksManager from './LinksManager';
import ThumbnailUploader from './ThumbnailUploader';
import LessonCommentsButton from './LessonCommentsButton';
import { AdminLesson, AdminChapter, LessonVideo, LessonEmbed, LessonAttachment } from '@/types/admin';
import { useCohorts } from '@/hooks/useCohortsData';
import { supabase } from '@/integrations/supabase/client';

const lessonSchema = z.object({
  title: z.string().min(2, 'כותרת השיעור חייבת להכיל לפחות 2 תווים').max(120, 'כותרת השיעור לא יכולה להכיל יותר מ-120 תווים'),
  description: z.string().min(1, 'תיאור השיעור נדרש'),
  chapter_id: z.string().min(1, 'יש לבחור פרק'),
  order: z.number().min(0, 'מספר הסדר חייב להיות 0 או יותר'),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  duration_sec: z.number().optional(),
  rich_text: z.string().optional(),
  thumbnail_url: z.string().url('יש להזין כתובת URL תקינה לתמונה').optional().or(z.literal('')),
  visibility_mode: z.enum(['inherit', 'all', 'cohort']).default('inherit'),
  cohort_id: z.string().nullable().optional(),
}).refine(
  (data) => data.visibility_mode !== 'cohort' || (data.cohort_id && data.cohort_id.length > 0),
  {
    message: 'יש לבחור מחזור לשיעור זה',
    path: ['cohort_id'],
  }
);

type LessonFormData = z.infer<typeof lessonSchema>;

interface LessonFormProps {
  lesson?: AdminLesson;
  chapters: AdminChapter[];
  onSubmit: (data: LessonFormData & {
    video?: LessonVideo;
    embeds: LessonEmbed[];
    attachments: LessonAttachment[];
    links: Array<{ label: string; url: string; }>;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const LessonForm = ({ lesson, chapters, onSubmit, onCancel, isLoading }: LessonFormProps) => {
  const [video, setVideo] = useState<LessonVideo | undefined>(lesson?.video);
  const [embeds, setEmbeds] = useState<LessonEmbed[]>(lesson?.embeds || []);
  const [attachments, setAttachments] = useState<LessonAttachment[]>(lesson?.attachments || []);
  const [links, setLinks] = useState<Array<{ label: string; url: string; }>>(lesson?.links || []);
  const [moduleId, setModuleId] = useState<string>('');

  const form = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: lesson?.title || '',
      description: lesson?.description || '',
      chapter_id: lesson?.chapterId || '',
      order: lesson?.order || 0,
      status: lesson?.status || 'draft',
      duration_sec: lesson?.durationSec || undefined,
      rich_text: lesson?.richText || '',
      thumbnail_url: lesson?.thumbnailUrl || '',
      visibility_mode: ((lesson as any)?.visibility_mode as 'inherit' | 'all' | 'cohort') || 'inherit',
      cohort_id: (lesson as any)?.cohort_id || null,
    },
  });

  const selectedChapterId = form.watch('chapter_id');
  const visibilityMode = form.watch('visibility_mode');

  // Get module ID from the selected chapter
  useEffect(() => {
    const chapter = chapters.find(c => c.id === selectedChapterId);
    if (chapter) {
      setModuleId(chapter.moduleId);
    }
  }, [selectedChapterId, chapters]);

  // Fetch cohorts for the module
  const { data: cohorts = [] } = useCohorts(moduleId);
  const activeCohorts = cohorts.filter(c => c.is_active);

  const handleSubmit = (data: LessonFormData) => {
    // Clear cohort_id if visibility is not cohort-specific
    if (data.visibility_mode !== 'cohort') {
      data.cohort_id = null;
    }
    onSubmit({
      ...data,
      video,
      embeds,
      attachments,
      links,
    });
  };

  const selectedChapter = chapters.find(c => c.id === form.watch('chapter_id'));
  const canPublish = selectedChapter?.status === 'active';

  const handleVideoChange = (newVideo: LessonVideo | undefined) => {
    setVideo(newVideo);
  };

  const handleAddEmbed = (embed: LessonEmbed) => {
    setEmbeds(prev => [...prev, embed]);
  };

  const handleRemoveEmbed = (embedId: string) => {
    setEmbeds(prev => prev.filter(e => e.id !== embedId));
  };

  const handleAddAttachment = (file: File) => {
    const newAttachment: LessonAttachment = {
      id: `attachment-${Date.now()}`,
      lessonId: lesson?.id || 'new',
      name: file.name,
      url: URL.createObjectURL(file),
      mime: file.type,
      size: file.size,
      kind: getFileKind(file.type),
      uploadedAt: new Date(),
    };
    setAttachments(prev => [...prev, newAttachment]);
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
  };

  const handleAddLink = (link: { label: string; url: string; }) => {
    setLinks(prev => [...prev, link]);
  };

  const handleRemoveLink = (linkIndex: number) => {
    setLinks(prev => prev.filter((_, index) => index !== linkIndex));
  };

  const getFileKind = (mimeType: string): LessonAttachment['kind'] => {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'docx';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'xlsx';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'pptx';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'zip';
    if (mimeType.startsWith('image/')) return 'image';
    return 'other';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          {lesson ? 'עריכת שיעור' : 'יצירת שיעור חדש'}
        </h2>
        <p className="text-muted-foreground">
          {lesson ? 'ערוך את תוכן השיעור' : 'צור שיעור חדש עם וידאו וחומרים'}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="chapter_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>פרק האב *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!lesson || isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר פרק..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {chapters.map((chapter) => (
                        <SelectItem key={chapter.id} value={chapter.id}>
                          {chapter.title} ({chapter.status === 'active' ? 'פעיל' : chapter.status === 'draft' ? 'טיוטה' : 'בארכיון'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>מספר סדר</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="יחושב אוטומטית"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      disabled={true} // Make it read-only since it's auto-calculated
                    />
                  </FormControl>
                  <FormDescription>
                    מספר הסדר יחושב אוטומטית על פי השיעורים הקיימים בפרק
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>כותרת השיעור *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="הזן כותרת לשיעור..." 
                    {...field} 
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  כותרת ברורה ותיאורית לשיעור (2-120 תווים)
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
                <FormLabel>תיאור השיעור *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="תאר את תוכן השיעור, מה התלמידים ילמדו..."
                    className="min-h-[100px]"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  תיאור מפורט שיעזור לתלמידים להבין את תוכן השיעור
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

          <Tabs defaultValue="video" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="video">וידאו</TabsTrigger>
              <TabsTrigger value="content">תוכן</TabsTrigger>
              <TabsTrigger value="links">לינקים</TabsTrigger>
              <TabsTrigger value="attachments">קבצים</TabsTrigger>
            </TabsList>

            <TabsContent value="video" className="space-y-4">
              <VideoUrlInput
                video={video}
                onChange={handleVideoChange}
                disabled={isLoading}
              />
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <FormField
                control={form.control}
                name="rich_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תוכן נוסף</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="הוסף תוכן טקסט עשיר לשיעור..."
                        className="min-h-[200px]"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      תוכן טקסט נוסף שיוצג יחד עם הוידאו
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration_sec"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>משך השיעור (שניות)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="לדוגמה: 1800 (30 דקות)"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      משך השיעור בשניות (אופציונלי)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            <TabsContent value="links" className="space-y-4">
              <LinksManager
                links={links}
                onAdd={handleAddLink}
                onRemove={handleRemoveLink}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="attachments" className="space-y-4">
              <AttachmentManager
                attachments={attachments}
                onAdd={handleAddAttachment}
                onRemove={handleRemoveAttachment}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>

          {/* Visibility Section */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">נגישות השיעור</h3>
            
            <FormField
              control={form.control}
              name="visibility_mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>מי יכול לראות את השיעור</FormLabel>
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
                      <SelectItem value="inherit">לפי הגדרת הפרק</SelectItem>
                      <SelectItem value="all">פתוח לכל מי שיש לו גישה למודול</SelectItem>
                      <SelectItem value="cohort">זמין רק למחזור מסוים</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {field.value === 'inherit' && 'השיעור יהיה גלוי לפי הגדרת הפרק שאליו הוא שייך'}
                    {field.value === 'all' && 'השיעור יהיה גלוי לכל התלמידים שיש להם גישה למודול'}
                    {field.value === 'cohort' && 'השיעור יהיה גלוי רק לתלמידים במחזור הנבחר'}
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
                      disabled={isLoading || !moduleId}
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
                      רק תלמידים במחזור זה יוכלו לצפות בשיעור
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
                  <FormLabel className="text-base">סטטוס השיעור</FormLabel>
                  <FormDescription>
                    {!canPublish && field.value === 'active' && (
                      <span className="text-warning">
                        ⚠️ הפרק האב חייב להיות פעיל כדי לפרסם שיעור
                      </span>
                    )}
                    {canPublish && field.value === 'active' && (
                      <span className="text-success">
                        ✓ השיעור יהיה זמין לתלמידים
                      </span>
                    )}
                    {field.value === 'draft' && 'השיעור נשמר כטיוטה'}
                    {field.value === 'archived' && 'השיעור בארכיון'}
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

          <div className="flex gap-3 pt-4 flex-wrap">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'שומר...' : lesson ? 'עדכון שיעור' : 'יצירת שיעור'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              ביטול
            </Button>
            {lesson && (
              <LessonCommentsButton lessonId={lesson.id} lessonTitle={lesson.title} />
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};

export default LessonForm;
