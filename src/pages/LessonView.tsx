import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Download, FileText, ArrowRight, ArrowLeft, CheckCircle, Loader2, AlertCircle, ExternalLink, Paperclip, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { LessonContent, LessonType } from "@/components/lesson";
import CommentSection from "@/components/CommentSection";
import ProgressBadge from "@/components/ProgressBadge";
import LessonRating from "@/components/LessonRating";
import AccessGuard from "@/components/AccessGuard";
import AuthGuard from "@/components/AuthGuard";
import ProgressToggle from "@/components/ProgressToggle";
import TaskSubmissionSection from "@/components/lesson/TaskSubmissionSection";
import { 
  useLesson, 
  useLessonAttachments, 
  useLessonEmbeds,
  useUpdateProgress,
  useLessons,
  useLessonProgress
} from "@/hooks/useContentData";
import { useAuth } from "@/hooks/useAuth";
import { useCanProceedToLesson, useLessonTask, useUserTaskSubmission, getEffectiveStatus } from "@/hooks/useTasksData";
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
  
  // Task-related data
  const { data: canProceedData } = useCanProceedToLesson(lessonId!);
  const { data: currentTask } = useLessonTask(lessonId!);
  const { data: currentSubmission } = useUserTaskSubmission(currentTask?.id || '');
  
  // Progress management - now handled by ProgressToggle component
  const [isCompleted, setIsCompleted] = useState(false);

  // Find current lesson index and navigation
  const currentLessonIndex = chapterLessons.findIndex(l => l.id === lessonId);
  const previousLesson = currentLessonIndex > 0 ? chapterLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < chapterLessons.length - 1 ? chapterLessons[currentLessonIndex + 1] : null;

  // Calculate chapter progress
  const completedCount = Math.floor(chapterLessons.length * 0.3); // Mock progress for now
  const progressPercentage = chapterLessons.length > 0 ? (completedCount / chapterLessons.length) * 100 : 0;

  // Set completion state from user progress
  useEffect(() => {
    if (userProgress) {
      setIsCompleted(userProgress.completed);
    }
  }, [userProgress]);

  const handleProgressToggle = (completed: boolean) => {
    setIsCompleted(completed);
  };

  // Check if next lesson navigation should be blocked
  const isNextLessonBlocked = () => {
    if (!currentTask || !currentTask.is_mandatory) return false;
    const status = getEffectiveStatus(currentSubmission);
    return status !== 'approved';
  };

  // Handle navigation to next lesson with blocking check
  const handleNextLesson = () => {
    if (isNextLessonBlocked()) {
      toast.error('יש להשלים את המשימה לפני המעבר לשיעור הבא');
      return;
    }
    if (nextLesson) {
      navigate(`/lesson/${nextLesson.id}`);
    }
  };

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

  // Check if this lesson is blocked due to previous incomplete task
  const isCurrentLessonBlocked = canProceedData && !canProceedData.canProceed;

  return (
    <AuthGuard>
    <AccessGuard 
      moduleId={lesson.chapters?.module_id!} 
      moduleTitle={lesson.chapters?.title}
      paymentUrl={null}
      isPaid={false}
    >
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Blocked Lesson Alert */}
          {isCurrentLessonBlocked && (
            <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-950/30">
              <Lock className="w-4 h-4 text-red-600" />
              <AlertTitle className="text-red-800 dark:text-red-300">שיעור נעול</AlertTitle>
              <AlertDescription className="text-red-700 dark:text-red-400">
                עליך להשלים את המשימה בשיעור הקודם לפני שתוכל לגשת לשיעור זה.
                <Button 
                  variant="link" 
                  className="text-red-700 dark:text-red-400 p-0 h-auto mr-2"
                  onClick={() => navigate(`/lesson/${canProceedData?.blockedByLessonId}`)}
                >
                  עבור לשיעור עם המשימה
                </Button>
              </AlertDescription>
            </Alert>
          )}
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
              {/* Lesson Thumbnail - only show for text lessons without video */}
              {lesson.thumbnail_url && !lesson.video_url && lesson.lesson_type !== 'video' && (
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted">
                  <img
                    src={lesson.thumbnail_url}
                    alt={lesson.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Dynamic Lesson Content based on type */}
              <LessonContent
                lessonType={(lesson.lesson_type as LessonType) || 'text'}
                title={lesson.title}
                lessonId={lesson.id!}
                description={lesson.description}
                richText={lesson.rich_text}
                videoUrl={lesson.video_url}
                images={lesson.images || []}
                onNextLesson={nextLesson ? handleNextLesson : undefined}
                nextLessonTitle={nextLesson?.title}
              />

              {/* Lesson Info Card */}
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-2xl">{lesson.title}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {lesson.lesson_type === 'video' && 'וידאו'}
                          {lesson.lesson_type === 'text_with_images' && 'טקסט + תמונות'}
                          {(lesson.lesson_type === 'text' || !lesson.lesson_type) && 'טקסט'}
                        </Badge>
                      </div>
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
                      lessonId={lesson.id!}
                      initialCompleted={userProgress?.completed || false}
                      onToggle={handleProgressToggle}
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

              {/* Lesson Links Section - Issue A fix */}
              {lesson.links && Array.isArray(lesson.links) && lesson.links.length > 0 && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-lg">לינקים מצורפים</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {lesson.links.map((link: any, index: number) => {
                      // Validate URL
                      const isValidUrl = link.url && (link.url.startsWith('http://') || link.url.startsWith('https://'));
                      
                      if (!isValidUrl) {
                        console.warn('Invalid URL found in lesson links:', link.url);
                        return null;
                      }
                      
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors border border-border/10"
                        >
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <ExternalLink className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                {link.label || 'קישור'}
                              </div>
                              <div className="text-xs text-muted-foreground truncate max-w-xs">
                                {link.url}
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
                              href={link.url}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              פתח קישור
                            </a>
                          </Button>
                        </div>
                      );
                    }).filter(Boolean)}
                  </CardContent>
                </Card>
              )}

              {/* Lesson Attachments Section - Issue B fix */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2 space-x-reverse">
                    <FileText className="w-5 h-5" />
                    <span>קבצים מצורפים</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {lesson.attachments && Array.isArray(lesson.attachments) && lesson.attachments.length > 0 ? lesson.attachments.map((attachment: any, index: number) => {
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

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors border border-border/10"
                      >
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <span className="text-lg">{getFileIcon(attachment.type)}</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium">
                              {attachment.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.size || 0)}
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
                            הורדה
                          </a>
                        </Button>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>אין קבצים להורדה בשיעור זה</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lesson Rating */}
              <LessonRating lessonId={lesson.id} />

              {/* Task Submission Section */}
              <TaskSubmissionSection lessonId={lessonId!} />

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
    </AuthGuard>
  );
};

export default LessonView;