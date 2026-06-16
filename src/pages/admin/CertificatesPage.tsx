import { useState, useRef, useEffect } from 'react';
import { useModules } from '@/hooks/useContentData';
import {
  useCertificateTemplate,
  useUpsertCertificateTemplate,
  uploadCertificateTemplateImage,
} from '@/hooks/useCertificateTemplates';
import {
  CertificateConfig,
  EMPTY_CERT_CONFIG,
} from '@/lib/certificate';
import CertificateEditor from '@/components/admin/CertificateEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Award, Upload, X, Image as ImageIcon, Save } from 'lucide-react';

const CertificatesPage = () => {
  const { data: modules, isLoading: modulesLoading } = useModules('active');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [templateName, setTemplateName] = useState('');
  const [templateImageUrl, setTemplateImageUrl] = useState('');
  const [config, setConfig] = useState<CertificateConfig>(EMPTY_CERT_CONFIG);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: existingTemplate, isLoading: templateLoading } =
    useCertificateTemplate(selectedModuleId || undefined);

  const upsert = useUpsertCertificateTemplate();

  // When the template loads (or module changes), sync into local state
  useEffect(() => {
    if (existingTemplate) {
      setTemplateName(existingTemplate.name);
      setTemplateImageUrl(existingTemplate.template_image_url);
      setConfig(existingTemplate.config ?? EMPTY_CERT_CONFIG);
    } else if (selectedModuleId && !templateLoading) {
      // No template yet for this module — reset to defaults
      const mod = modules?.find((m) => m.id === selectedModuleId);
      setTemplateName(mod ? `תעודת סיום – ${mod.title}` : '');
      setTemplateImageUrl('');
      setConfig(EMPTY_CERT_CONFIG);
    }
  }, [existingTemplate, selectedModuleId, templateLoading, modules]);

  const handleModuleChange = (id: string) => {
    setSelectedModuleId(id);
    // local state will be updated by the useEffect above
    setConfig(EMPTY_CERT_CONFIG);
    setTemplateImageUrl('');
    setTemplateName('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedModuleId) return;

    if (!file.type.startsWith('image/')) {
      toast.error('ניתן להעלות רק קבצי תמונה');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('גודל הקובץ לא יכול לעבור 5MB');
      return;
    }

    setUploading(true);
    try {
      const url = await uploadCertificateTemplateImage(file, selectedModuleId);
      setTemplateImageUrl(url);
      toast.success('התמונה הועלתה בהצלחה');
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'שגיאה בהעלאת התמונה');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!selectedModuleId || !templateImageUrl) return;
    await upsert.mutateAsync({
      module_id: selectedModuleId,
      name: templateName || 'תבנית תעודה',
      template_image_url: templateImageUrl,
      config,
      is_active: true,
    });
  };

  const canSave = !!selectedModuleId && !!templateImageUrl && !upsert.isPending;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Award className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">תעודות</h1>
        </div>
        <p className="text-muted-foreground">
          עיצוב ועריכת תבניות תעודות סיום לפי קורס
        </p>
      </div>

      {/* Module selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">בחירת קורס</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>קורס</Label>
            <Select
              value={selectedModuleId}
              onValueChange={handleModuleChange}
              disabled={modulesLoading}
            >
              <SelectTrigger className="w-full max-w-sm">
                <SelectValue placeholder={modulesLoading ? 'טוען...' : 'בחר קורס'} />
              </SelectTrigger>
              <SelectContent>
                {modules?.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedModuleId && (
            <div className="space-y-2">
              <Label>שם התבנית</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="לדוגמה: תעודת סיום – קורס עיצוב"
                className="max-w-sm"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image upload */}
      {selectedModuleId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">תמונת תבנית</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex flex-wrap gap-3 items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'מעלה...' : 'העלה תמונה'}
              </Button>
              {templateImageUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setTemplateImageUrl('')}
                  className="gap-1 text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                  הסר תמונה
                </Button>
              )}
              <span className="text-xs text-muted-foreground">
                PNG / JPG / WebP, עד 5MB. מומלץ יחס 4:3 (לנדסקייפ)
              </span>
            </div>

            {templateImageUrl ? (
              <div className="relative max-w-xs rounded-lg overflow-hidden border border-border">
                <img
                  src={templateImageUrl}
                  alt="תצוגה מקדימה של התבנית"
                  className="w-full h-auto block"
                />
              </div>
            ) : (
              <div className="w-full max-w-xs aspect-[4/3] bg-muted rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-sm">אין תמונה</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Certificate Editor */}
      {selectedModuleId && templateImageUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">עורך תבנית</CardTitle>
            <p className="text-sm text-muted-foreground">
              גרור את שדות השם והחתימות למקום הרצוי על התבנית. התצוגה משתמשת בשם לדוגמה.
            </p>
          </CardHeader>
          <CardContent>
            <CertificateEditor
              templateImageUrl={templateImageUrl}
              config={config}
              onChange={setConfig}
            />
          </CardContent>
        </Card>
      )}

      {/* Save button */}
      {selectedModuleId && (
        <div className="flex justify-start pb-8">
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="gap-2 min-w-32"
          >
            <Save className="w-4 h-4" />
            {upsert.isPending ? 'שומר...' : 'שמירה'}
          </Button>
          {!templateImageUrl && selectedModuleId && (
            <p className="text-sm text-muted-foreground me-4 self-center">
              יש להעלות תמונת תבנית לפני השמירה
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CertificatesPage;
