import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LessonImage {
  id?: string;
  url: string;
  caption?: string;
  alt?: string;
  order?: number;
}

interface ImageGalleryContentProps {
  images: LessonImage[];
  richText?: string;
  description?: string;
}

const ImageGalleryContent = ({ images, richText, description }: ImageGalleryContentProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const sortedImages = [...images].sort((a, b) => (a.order || 0) - (b.order || 0));

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : sortedImages.length - 1));
    } else {
      setCurrentImageIndex((prev) => (prev < sortedImages.length - 1 ? prev + 1 : 0));
    }
  };

  return (
    <div className="space-y-6">
      {/* Text content */}
      {(description || richText) && (
        <div className="prose prose-lg max-w-none rtl text-right">
          {description && (
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              {description}
            </p>
          )}
          
          {richText && (
            <div 
              className="lesson-content"
              dangerouslySetInnerHTML={{ __html: richText }}
            />
          )}
        </div>
      )}

      {/* Image gallery */}
      {sortedImages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-right">תמונות</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedImages.map((image, index) => (
              <figure 
                key={image.id || index} 
                className="group cursor-pointer"
                onClick={() => openLightbox(index)}
              >
                <div className="relative aspect-video overflow-hidden rounded-lg bg-muted border">
                  <img
                    src={image.url}
                    alt={image.alt || image.caption || `תמונה ${index + 1}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
                {image.caption && (
                  <figcaption className="mt-2 text-sm text-muted-foreground text-center">
                    {image.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-black/95 border-none">
          <div className="relative flex items-center justify-center min-h-[60vh]">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 left-2 z-10 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Navigation - Previous */}
            {sortedImages.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                onClick={() => navigateImage('prev')}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            )}

            {/* Image */}
            <div className="max-w-full max-h-[80vh] p-4">
              <img
                src={sortedImages[currentImageIndex]?.url}
                alt={sortedImages[currentImageIndex]?.alt || ''}
                className="max-w-full max-h-[70vh] object-contain mx-auto"
              />
              {sortedImages[currentImageIndex]?.caption && (
                <p className="text-white text-center mt-4 text-lg">
                  {sortedImages[currentImageIndex].caption}
                </p>
              )}
            </div>

            {/* Navigation - Next */}
            {sortedImages.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                onClick={() => navigateImage('next')}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
            )}

            {/* Image counter */}
            {sortedImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
                {currentImageIndex + 1} / {sortedImages.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageGalleryContent;
