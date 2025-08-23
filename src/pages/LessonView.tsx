import { useState } from "react";
import { useParams } from "react-router-dom";
import { Download, FileText, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import VideoPlayer from "@/components/VideoPlayer";
import CommentSection from "@/components/CommentSection";
import ProgressBadge from "@/components/ProgressBadge";

const LessonView = () => {
  const { lessonId } = useParams();
  const [isCompleted, setIsCompleted] = useState(false);

  // Sample lesson data
  const lesson = {
    id: lessonId,
    title: "יסודות האלפבית העברי",
    description: "בשיעור זה נלמד את כל האותיות בשפה העברית, איך לכתוב אותן ואיך להגות אותן נכון.",
    videoSrc: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    duration: "15:30",
    attachments: [
      { id: "1", name: "מדריך האלפבית העברי.pdf", size: "2.3 MB", type: "pdf" },
      { id: "2", name: "תרגילי כתיבה.docx", size: "1.8 MB", type: "doc" },
    ],
    moduleTitle: "עברית למתחילים",
    chapterTitle: "פרק 1: היכרות עם השפה",
    progress: 65,
  };

  // Sample comments
  const comments = [
    {
      id: "1",
      author: "דני כהן",
      content: "שיעור מעולה! הסבר מאוד ברור על האותיות. השאלה שלי היא איך מבחינים בין בי״ת לוי״ת?",
      timestamp: "לפני 3 שעות",
      likes: 12,
      isLiked: false,
      replies: [
        {
          id: "2",
          author: "מורה שרה",
          content: "שאלה מצוינת! בי״ת יש לה נקודה באמצע (בּ) ואילו וי״ת אין לها נקודה (ב). זה ההבדל העיקרי.",
          timestamp: "לפני שעתיים",
          likes: 8,
          isLiked: true,
        }
      ]
    },
    {
      id: "3",
      author: "מיכל לוי",
      content: "תודה על השיעור המקצועי. יש לי בקשה לתרגול נוסף על הכתיבה בכתב יד.",
      timestamp: "לפני יום",
      likes: 5,
      isLiked: false,
    }
  ];

  const handleComplete = () => {
    setIsCompleted(!isCompleted);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 space-x-reverse text-sm text-muted-foreground mb-8">
          <span>{lesson.moduleTitle}</span>
          <ArrowLeft className="w-4 h-4" />
          <span>{lesson.chapterTitle}</span>
          <ArrowLeft className="w-4 h-4" />
          <span className="text-foreground">{lesson.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Video Player */}
            <VideoPlayer
              src={lesson.videoSrc}
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
                  </div>
                  <ProgressBadge percentage={lesson.progress} />
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    משך השיעור: {lesson.duration}
                  </div>
                  
                  <Button
                    onClick={handleComplete}
                    variant={isCompleted ? "secondary" : "default"}
                    className="button-glow"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {isCompleted ? "הושלם" : "סמן כהושלם"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Comments */}
            <CommentSection lessonId={lesson.id!} comments={comments} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">התקדמות בקורס</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Progress value={lesson.progress} className="h-3" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {lesson.progress}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      מהקורס הושלם
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
                {lesson.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <FileText className="w-4 h-4 text-primary" />
                      <div>
                        <div className="text-sm font-medium">
                          {attachment.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {attachment.size}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex flex-col space-y-2">
              <Button variant="outline" className="justify-between">
                <span>השיעור הקודם</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="justify-between">
                <span>השיעור הבא</span>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonView;