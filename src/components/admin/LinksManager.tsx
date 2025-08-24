import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Link {
  label: string;
  url: string;
}

interface LinksManagerProps {
  links: Link[];
  onAdd: (link: Link) => void;
  onRemove: (index: number) => void;
  isLoading?: boolean;
}

const LinksManager = ({ links, onAdd, onRemove, isLoading }: LinksManagerProps) => {
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleAdd = () => {
    if (!newLabel.trim()) {
      toast.error('כותרת הלינק נדרשת');
      return;
    }

    if (!newUrl.trim()) {
      toast.error('כתובת הלינק נדרשת');
      return;
    }

    if (!validateUrl(newUrl)) {
      toast.error('יש להזין כתובת URL תקינה (http/https)');
      return;
    }

    onAdd({
      label: newLabel.trim(),
      url: newUrl.trim(),
    });

    setNewLabel('');
    setNewUrl('');
    toast.success('הלינק נוסף בהצלחה');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="font-medium">לינקים מצורפים</h4>
        
        {/* Add new link */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="כותרת הלינק (למשל: מצגת, מאמר)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              disabled={isLoading}
            />
            <Input
              placeholder="כתובת URL (https://example.com)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              disabled={isLoading}
            />
            <Button
              onClick={handleAdd}
              disabled={isLoading || !newLabel.trim() || !newUrl.trim()}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              הוספת לינק
            </Button>
          </CardContent>
        </Card>

        {/* Links list */}
        {links.length > 0 && (
          <div className="space-y-2">
            {links.map((link, index) => (
              <Card key={index}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{link.label}</div>
                      <div className="text-sm text-muted-foreground truncate" dir="ltr">
                        {link.url}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(index)}
                    disabled={isLoading}
                    className="text-destructive hover:text-destructive flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {links.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            עדיין לא נוספו לינקים
          </div>
        )}
      </div>
    </div>
  );
};

export default LinksManager;