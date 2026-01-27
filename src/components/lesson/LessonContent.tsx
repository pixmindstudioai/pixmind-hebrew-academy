import TextLessonContent from './TextLessonContent';
import ImageGalleryContent from './ImageGalleryContent';
import VideoLessonContent from './VideoLessonContent';

export type LessonType = 'text' | 'text_with_images' | 'video';

interface LessonImage {
  id?: string;
  url: string;
  caption?: string;
  alt?: string;
  order?: number;
}

interface LessonContentProps {
  lessonType: LessonType;
  title: string;
  lessonId: string;
  description?: string;
  richText?: string;
  videoUrl?: string;
  images?: LessonImage[];
  onNextLesson?: () => void;
  nextLessonTitle?: string;
}

const LessonContent = ({
  lessonType,
  title,
  lessonId,
  description,
  richText,
  videoUrl,
  images = [],
  onNextLesson,
  nextLessonTitle,
}: LessonContentProps) => {
  // Determine effective lesson type based on content
  const effectiveType = getEffectiveLessonType(lessonType, videoUrl, images);

  switch (effectiveType) {
    case 'video':
      return videoUrl ? (
        <VideoLessonContent
          videoUrl={videoUrl}
          title={title}
          lessonId={lessonId}
          description={description}
          richText={richText}
          onNextLesson={onNextLesson}
          nextLessonTitle={nextLessonTitle}
        />
      ) : (
        <TextLessonContent richText={richText} description={description} />
      );

    case 'text_with_images':
      return (
        <ImageGalleryContent
          images={images}
          richText={richText}
          description={description}
        />
      );

    case 'text':
    default:
      return <TextLessonContent richText={richText} description={description} />;
  }
};

// Helper to determine effective lesson type based on available content
function getEffectiveLessonType(
  declaredType: LessonType,
  videoUrl?: string,
  images?: LessonImage[]
): LessonType {
  // If type is explicitly set and has matching content, use it
  if (declaredType === 'video' && videoUrl) return 'video';
  if (declaredType === 'text_with_images' && images && images.length > 0) return 'text_with_images';
  if (declaredType === 'text') return 'text';
  
  // Fallback: auto-detect based on content
  if (videoUrl) return 'video';
  if (images && images.length > 0) return 'text_with_images';
  return 'text';
}

export default LessonContent;
