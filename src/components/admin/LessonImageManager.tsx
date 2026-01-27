import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, Image as ImageIcon } from 'lucide-react';

export interface LessonImage {
  id: string;
  url: string;
  caption?: string;
  alt?: string;
  order: number;
}

interface LessonImageManagerProps {
  images: LessonImage[];
  onChange: (images: LessonImage[]) => void;
  disabled?: boolean;
}

const LessonImageManager = ({ images, onChange, disabled }: LessonImageManagerProps) => {
  const [newImageUrl, setNewImageUrl] = useState('');

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    
    const newImage: LessonImage = {
      id: `img-${Date.now()}`,
      url: newImageUrl.trim(),
      caption: '',
      alt: '',
      order: images.length,
    };
    
    onChange([...images, newImage]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (imageId: string) => {
    const updatedImages = images
      .filter(img => img.id !== imageId)
      .map((img, index) => ({ ...img, order: index }));
    onChange(updatedImages);
  };

  const handleUpdateImage = (imageId: string, field: keyof LessonImage, value: string) => {
    const updatedImages = images.map(img =>
      img.id === imageId ? { ...img, [field]: value } : img
    );
    onChange(updatedImages);
  };

  const handleMoveImage = (imageId: string, direction: 'up' | 'down') => {
    const index = images.findIndex(img => img.id === imageId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;
    
    const updatedImages = [...images];
    [updatedImages[index], updatedImages[newIndex]] = [updatedImages[newIndex], updatedImages[index]];
    
    // Update order values
    onChange(updatedImages.map((img, i) => ({ ...img, order: i })));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">תמונות</Label>
        <span className="text-sm text-muted-foreground">{images.length} תמונות</span>
      </div>

      {/* Add new image */}
      <div className="flex gap-2">
        <Input
          placeholder="הכנס כתובת URL של תמונה..."
          value={newImageUrl}
          onChange={(e) => setNewImageUrl(e.target.value)}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleAddImage}
          disabled={disabled || !newImageUrl.trim()}
        >
          <Plus className="w-4 h-4 ml-2" />
          הוסף
        </Button>
      </div>

      {/* Images list */}
      {images.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>אין תמונות עדיין</p>
          <p className="text-sm">הוסף כתובת URL של תמונה למעלה</p>
        </div>
      ) : (
        <div className="space-y-3">
          {images
            .sort((a, b) => a.order - b.order)
            .map((image, index) => (
              <Card key={image.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    {/* Drag handle & reorder buttons */}
                    <div className="flex flex-col items-center justify-center gap-1">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <div className="flex flex-col gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => handleMoveImage(image.id, 'up')}
                          disabled={disabled || index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => handleMoveImage(image.id, 'down')}
                          disabled={disabled || index === images.length - 1}
                        >
                          ↓
                        </Button>
                      </div>
                    </div>

                    {/* Image preview */}
                    <div className="w-24 h-24 flex-shrink-0 bg-muted rounded overflow-hidden">
                      <img
                        src={image.url}
                        alt={image.alt || 'תמונה'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </div>

                    {/* Image details */}
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="כיתוב (מוצג מתחת לתמונה)"
                        value={image.caption || ''}
                        onChange={(e) => handleUpdateImage(image.id, 'caption', e.target.value)}
                        disabled={disabled}
                        className="text-sm"
                      />
                      <Input
                        placeholder="טקסט חלופי (נגישות)"
                        value={image.alt || ''}
                        onChange={(e) => handleUpdateImage(image.id, 'alt', e.target.value)}
                        disabled={disabled}
                        className="text-sm"
                      />
                      <div className="text-xs text-muted-foreground truncate" title={image.url}>
                        {image.url}
                      </div>
                    </div>

                    {/* Remove button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveImage(image.id)}
                      disabled={disabled}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
};

export default LessonImageManager;
