import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Download, FileText, ArrowRight, ArrowLeft, CheckCircle, Loader2, AlertCircle, ExternalLink, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import EmbeddedVideoPlayer from "@/components/EmbeddedVideoPlayer";
import CommentSection from "@/components/CommentSection";
import ProgressBadge from "@/components/ProgressBadge";
import LessonRating from "@/components/LessonRating";
import AccessGuard from "@/components/AccessGuard";
import ProgressToggle from "@/components/ProgressToggle";
import { 
  useLesson, 
  useLessonAttachments, 
  useLessonEmbeds,
  useUpdateProgress,
  useLessons,
  useLessonProgress
} from "@/hooks/useContentData";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const LessonView = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // Fetch lesson data
  const { data: lesson, isLoading: lessonLoading, error: lessonError } = useLesson(lessonId!);
  const { data: attachments = [] } = useLessonAttachments(lessonId!);
  const { data: embeds = [] } = useLessonEmbeds(lessonId!);
  const { data: chapterLessons = [] } = useLessons(lesson?.chapter_id || '', 'active');
  const { data: userProgress } = useLessonProgress(lessonId!, user?.id);
  
  // Find current lesson index and navigation
  const currentLessonIndex = chapterLessons.findIndex(l => l.id === lessonId);
  const previousLesson = currentLessonIndex > 0 ? chapterLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < chapterLessons.length - 1 ? chapterLessons[currentLessonIndex + 1] : null;

  // Calculate chapter progress
  const completedCount = Math.floor(chapterLessons.length * 0.3); // Mock progress for now
  const progressPercentage = chapterLessons.length > 0 ? (completedCount / chapterLessons.length) * 100 : 0;

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('zip') || mimeType?.includes('rar')) return '🗜️';
    if (mimeType?.includes('word')) return '📝';
    if (mimeType?.includes('excel')) return '📊';
    if (mimeType?.includes('powerpoint')) return '📋';
    if (mimeType?.includes('image')) return '🖼️';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'גודל לא ידוע';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Loading state
  if (lessonLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">טוען שיעור...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (lessonError || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            שגיאה בטעינת השיעור. נסה לרענן את הדף.
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              רענן דף
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <AccessGuard 
      moduleId={lesson.chapters?.module_id!} 
      moduleTitle={lesson.chapters?.title}
      paymentUrl={null}
      isPaid={false}
    >
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 space-x-reverse text-sm text-muted-foreground mb-8">
            <Link to="/courses" className="hover:text-foreground transition-colors">
              הקורסים
            </Link>
            <ArrowLeft className="w-4 h-4" />
            <Link 
              to={`/courses/${lesson.chapters?.module_id}`} 
              className="hover:text-foreground transition-colors"
            >
              {lesson.chapters?.modules?.title}
            </Link>
            <ArrowLeft className="w-4 h-4" />
            <span className="hover:text-foreground transition-colors">
              {lesson.chapters?.title}
            </span>
            <ArrowLeft className="w-4 h-4" />
            <span className="text-foreground">{lesson.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Lesson Thumbnail */}
              {lesson.thumbnail_url && (
                <div className="aspect-video rounded-xl overflow-hidden mb-4">
                  <img
                    src={lesson.thumbnail_url}
                    alt={lesson.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Video Player */}
              <EmbeddedVideoPlayer
                videoUrl={lesson.video_url}
                title={lesson.title}
                className="w-full"
              />

              {/* Lesson Info */}
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{lesson.title}</CardTitle>
                      <p className="text-muted-foreground leading-relaxed">
                        {lesson.description}
                      </p>
                      {lesson.rich_text && (
                        <div 
                          className="prose prose-sm max-w-none mt-4"
                          dangerouslySetInnerHTML={{ __html: lesson.rich_text }}
                        />
                      )}
                    </div>
                    <ProgressBadge percentage={progressPercentage} />
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {lesson.duration_sec ? `משך השיעור: ${Math.ceil(lesson.duration_sec / 60)} דקות` : 'משך לא צוין'}
                    </div>
                    
                    <ProgressToggle 
                      lessonId={lessonId!}
                      className="button-glow"
                    />
                  </div>
                  
                  {!isAuthenticated && (
                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        יש להתחבר כדי לסמן שיעורים כהושלמו ולעקוב אחר ההתקדמות
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Lesson Rating */}
              <LessonRating lessonId={lesson.id} />

              {/* Embeds Section */}
              {embeds.length > 0 && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-lg">משאבים נוספים</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {embeds.map((embed) => (
                      <div key={embed.id} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">{embed.title}</h4>
                        {embed.description && (
                          <p className="text-sm text-muted-foreground mb-3">{embed.description}</p>
                        )}
                        {embed.type === 'iframe' ? (
                          <iframe
                            src={embed.url}
                            title={embed.title || 'Embedded content'}
                            className="w-full h-64 rounded border"
                            allowFullScreen
                          />
                        ) : (
                          <a
                            href={embed.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {embed.url}
                          </a>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Comments */}
              <CommentSection lessonId={lesson.id!} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Progress */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">התקדמות בפרק</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={progressPercentage} className="h-3" />
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(progressPercentage)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        מהפרק הושלם
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attachments */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2 space-x-reverse">
                    <FileText className="w-5 h-5" />
                    <span>קבצים להורדה</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {attachments.length > 0 ? attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors border border-border/10"
                    >
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-lg">{getFileIcon(attachment.mime)}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {attachment.name}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>{formatFileSize(attachment.size || 0)}</span>
                            <Badge variant="outline" className="text-xs">
                              {attachment.kind}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        asChild
                        className="hover:bg-primary hover:text-primary-foreground"
                      >
                        <a 
                          href={attachment.url} 
                          download={attachment.name} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          הורד קובץ
                        </a>
                      </Button>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>אין קבצים להורדה בשיעור זה</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex flex-col space-y-2">
                {previousLesson && (
                  <Button 
                    variant="outline" 
                    className="justify-between"
                    onClick={() => navigate(`/lesson/${previousLesson.id}`)}
                  >
                    <span>השיעור הקודם</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
                {nextLesson && (
                  <Button 
                    variant="outline" 
                    className="justify-between"
                    onClick={() => navigate(`/lesson/${nextLesson.id}`)}
                  >
                    <span>השיעור הבא</span>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}
                {!previousLesson && !nextLesson && (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    זה השיעור היחיד בפרק
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AccessGuard>
  );
};

export default LessonView;