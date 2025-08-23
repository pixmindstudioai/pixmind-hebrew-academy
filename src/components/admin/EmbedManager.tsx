
import { useState } from 'react';
import { Plus, ExternalLink, Trash2, Link, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LessonEmbed } from '@/types/admin';

interface EmbedManagerProps {
  embeds: LessonEmbed[];
  onAdd: (embed: LessonEmbed) => void;
  onRemove: (embedId: string) => void;
  isLoading?: boolean;
}

const EmbedManager = ({ embeds, onAdd, onRemove, isLoading }: EmbedManagerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [embedType, setEmbedType] = useState<'link' | 'iframe'>('link');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');

  const handleAdd = () => {
    if (!url.trim()) return;

    const newEmbed: LessonEmbed = {
      id: `embed-${Date.now()}`,
      type: embedType,
      title: title.trim() || undefined,
      url: url.trim(),
      description: description.trim() || undefined,
    };

    onAdd(newEmbed);
    
    // Reset form
    setTitle('');
    setUrl('');
    setDescription('');
    setIsDialogOpen(false);
  };

  const getEmbedIcon = (type: string) => {
    return type === 'iframe' ? Monitor : Link;
  };

  const isValidUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">קישורים וטמעות</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              הוספת קישור
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>הוספת קישור או טמעה</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">סוג</label>
                <Select value={embedType} onValueChange={(value: 'link' | 'iframe') => setEmbedType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">קישור חיצוני</SelectItem>
                    <SelectItem value="iframe">טמעה (iframe)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">כתובת URL *</label>
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">כותרת (אופציונלי)</label>
                <Input
                  placeholder="כותרת לקישור..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">תיאור (אופציונלי)</label>
                <Textarea
                  placeholder="תיאור קצר של הקישור..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleAdd} 
                  disabled={!url.trim() || !isValidUrl(url) || isLoading}
                  className="flex-1"
                >
                  הוספה
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isLoading}
                >
                  ביטול
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {embeds.length > 0 ? (
        <div className="grid gap-3">
          {embeds.map((embed) => {
            const Icon = getEmbedIcon(embed.type);
            return (
              <div
                key={embed.id}
                className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {embed.title && (
                        <h4 className="font-medium truncate mb-1">{embed.title}</h4>
                      )}
                      <p className="text-sm text-muted-foreground truncate mb-2">
                        {embed.url}
                      </p>
                      {embed.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {embed.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Badge variant="secondary" className="text-xs">
                        {embed.type === 'iframe' ? 'טמעה' : 'קישור'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button size="sm" variant="ghost" asChild>
                    <a href={embed.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemove(embed.id)}
                    disabled={isLoading}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
          <Link className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>לא הוספו קישורים עדיין</p>
          <p className="text-xs">השתמש בכפתור "הוספת קישור" להוספת קישורים חיצוניים</p>
        </div>
      )}
    </div>
  );
};

export default EmbedManager;
