import EnhancedVideoPlayer from '@/components/EnhancedVideoPlayer';
import AddToNotebookButton from '@/components/notebook/AddToNotebookButton';

interface VideoLessonContentProps {
  videoUrl: string;
  title: string;
  lessonId: string;
  moduleId?: string;
  chapterId?: string;
  description?: string;
  richText?: string;
  onNextLesson?: () => void;
  nextLessonTitle?: string;
}

const VideoLessonContent = ({ 
  videoUrl, 
  title, 
  lessonId,
  moduleId,
  chapterId,
  description,
  richText,
  onNextLesson,
  nextLessonTitle
}: VideoLessonContentProps) => {
  return (
    <div className="space-y-6">
      {/* Video player */}
      <div className="w-full">
        <EnhancedVideoPlayer
          videoUrl={videoUrl}
          title={title}
          lessonId={lessonId}
          className="w-full"
          onNextLesson={onNextLesson}
          nextLessonTitle={nextLessonTitle}
        />
      </div>

      {/* Add to Smart Notebook Button */}
      <div className="flex justify-start">
        <AddToNotebookButton
          lessonId={lessonId}
          lessonTitle={title}
          moduleId={moduleId}
          chapterId={chapterId}
          videoUrl={videoUrl}
        />
      </div>

      {/* Text content below video */}
      {(description || richText) && (
        <div className="prose prose-lg max-w-none rtl text-right mt-6">
          {description && (
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
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
    </div>
  );
};

export default VideoLessonContent;
