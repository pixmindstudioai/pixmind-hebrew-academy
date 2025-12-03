
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight, Clock, BookOpen, Users, Star, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ChapterAccordion from "@/components/shared/ChapterAccordion";
import ChapterProgressTracker from "@/components/ChapterProgressTracker";
import { useModules, useChapters, useLessons, useUserProgress, useUpdateProgress, Chapter, Lesson } from "@/hooks/useContentData";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import AccessGuard from "@/components/AccessGuard";
import AuthGuard from "@/components/AuthGuard";
import { SaleBadge } from "@/components/SaleBadge";
import { PriceDisplay } from "@/components/PriceDisplay";
import { useUserCohortsForModule, filterVisibleChapters, filterVisibleLessons } from "@/hooks/useUserCohorts";

// Wrapper component to fetch lessons for each chapter with visibility filtering
const ChapterLessonsWrapper = ({ 
  chapter, 
  userProgress, 
  onLessonClick,
  allowedCohortIds,
}: {
  chapter: Chapter;
  userProgress: any[];
  onLessonClick: (lesson: any) => void;
  allowedCohortIds: string[];
}) => {
  const { data: lessons = [] } = useLessons(chapter.id, 'active');
  
  // Filter lessons based on visibility rules
  const visibleLessons = filterVisibleLessons(lessons, chapter, allowedCohortIds);
  
  if (visibleLessons.length === 0 && lessons.length > 0) {
    // Chapter has lessons but none visible to this user
    return null;
  }
  
  return (
    <div className="space-y-4">
      {/* Chapter Progress Tracker */}
      <ChapterProgressTracker 
        chapterId={chapter.id}
        chapterTitle={chapter.title}
      />
      
      {/* Chapter Accordion */}
      <ChapterAccordion
        chapter={chapter}
        lessons={visibleLessons}
        completedLessons={userProgress.filter(p => p.completed).map(p => p.lesson_id)}
        onLessonClick={onLessonClick}
      />
    </div>
  );
};

const CourseDetail = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();

  const { data: modules = [] } = useModules('active');
  const { data: chapters = [] } = useChapters(moduleId || '', 'active');
  const { data: userProgress = [] } = useUserProgress("current-user-id");
  const updateProgress = useUpdateProgress();
  
  // Get user's cohort memberships for this module
  const { data: userCohorts = [] } = useUserCohortsForModule(moduleId || '');
  const allowedCohortIds = userCohorts.map(c => c.cohort_id);

  const module = modules.find(m => m.id === moduleId);
  
  // Filter chapters based on visibility
  const visibleChapters = filterVisibleChapters(chapters, allowedCohortIds);

  const handleLessonClick = (lesson: any) => {
    navigate(`/lesson/${lesson.id}`);
  };

  const handleStartCourse = () => {
    if (visibleChapters.length > 0 && visibleChapters[0]) {
      navigate(`/lesson/first-lesson-id`);
    }
  };

  // Check if module is hidden and user doesn't have access
  if (!module) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">קורס לא נמצא</h1>
          <p className="text-muted-foreground mb-6">
            הקורס שחיפשת אינו זמין או שאין לך הרשאה לצפות בו
          </p>
          <Button onClick={() => navigate('/courses')}>
            <ArrowRight className="w-4 h-4 ml-2" />
            חזור לקורסים
          </Button>
        </div>
      </div>
    );
  }

  // Calculate progress
  const totalLessons = visibleChapters.reduce((acc, chapter) => {
    return acc + 5; // Placeholder
  }, 0);
  
  const completedLessons = userProgress.filter(p => p.completed).length;
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <AuthGuard>
    <AccessGuard 
      moduleId={moduleId!} 
      moduleTitle={module?.title}
      paymentUrl={module?.payment_url}
      isPaid={module?.is_paid}
    >
      <div className="min-h-screen bg-background" dir="rtl">
        {/* Hero Section */}
        <div className="relative bg-gradient-primary text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <div className="container mx-auto px-4 py-16 relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/courses')}
                  className="text-white/80 hover:text-white mb-6 p-0"
                >
                  <ArrowRight className="w-4 h-4 ml-2" />
                  חזור לקורסים
                </Button>

                <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                  {module.title}
                </h1>
                
                <p className="text-xl text-white/90 leading-relaxed mb-8">
                  {module.description}
                </p>

                <div className="flex flex-wrap items-center gap-6 mb-8 text-white/80">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>15 שעות</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    <span>{visibleChapters.length} פרקים</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span>1,234 תלמידים</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <span>4.8 (156 ביקורות)</span>
                  </div>
                </div>

                {module.is_paid && (
                  <div className="mb-6 space-y-2">
                    <SaleBadge module={module} size="lg" />
                    <PriceDisplay module={module} size="lg" />
                  </div>
                )}

                {progressPercentage > 0 && (
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/90">ההתקדמות שלך</span>
                      <span className="text-white/90">{progressPercentage.toFixed(0)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-3" />
                  </div>
                )}

                <Button 
                  size="lg" 
                  className="button-glow text-lg px-8 py-6"
                  onClick={handleStartCourse}
                >
                  <Play className="w-5 h-5 ml-2" />
                  {progressPercentage > 0 ? 'המשך לימוד' : 'התחל קורס'}
                </Button>
              </div>

              <div className="lg:justify-self-end">
                {module.image_url ? (
                  <img 
                    src={module.image_url} 
                    alt={module.title}
                    className="w-full max-w-md rounded-2xl shadow-2xl"
                  />
                ) : (
                  <div className="w-full max-w-md aspect-video bg-white/10 rounded-2xl flex items-center justify-center">
                    <BookOpen className="w-24 h-24 text-white/50" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-bold mb-8">תוכן הקורס</h2>
              
              <div className="space-y-4">
                {visibleChapters.map((chapter) => (
                  <ChapterLessonsWrapper
                    key={chapter.id}
                    chapter={chapter}
                    userProgress={userProgress}
                    onLessonClick={handleLessonClick}
                    allowedCohortIds={allowedCohortIds}
                  />
                ))}
              </div>

              {visibleChapters.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="w-16 h-16 mx-auto mb-4" />
                  <p>תוכן הקורס יתווסף בקרוב</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Course Stats */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="font-semibold mb-4">פרטי הקורס</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">פרקים</span>
                    <span className="font-medium">{visibleChapters.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">שיעורים</span>
                    <span className="font-medium">{totalLessons}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">משך כולל</span>
                    <span className="font-medium">15 שעות</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">רמת קושי</span>
                    <Badge variant="outline">בינוני</Badge>
                  </div>
                </div>
              </div>

              {/* What You'll Learn */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="font-semibold mb-4">מה תלמד בקורס</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>עקרונות עיצוב מתקדמים</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>שימוש מקצועי בכלי עיצוב</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>בניית פורטפוליו מקצועי</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>טיפים לקריירה בעיצוב</span>
                  </li>
                </ul>
              </div>

              {/* Requirements */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="font-semibold mb-4">דרישות מוקדמות</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• בסיסי מחשב וגלישה באינטרנט</li>
                  <li>• רצון ללמוד ולהתפתח</li>
                  <li>• אין צורך בידע מוקדם בעיצוב</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AccessGuard>
    </AuthGuard>
  );
};

export default CourseDetail;
