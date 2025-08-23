import { useState } from "react";
import { Search, Filter, BookOpen, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ModuleCard from "@/components/ModuleCard";

const Courses = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Sample course data
  const courses = [
    {
      id: "1",
      title: "עברית למתחילים",
      description: "קורס מקיף ללימוד יסודות השפה העברית, כולל קריאה, כתיבה והבנת הנקרא",
      duration: "4 שבועות",
      lessonsCount: 24,
      completedLessons: 0,
      isStarted: false,
    },
    {
      id: "2", 
      title: "דקדוק עברי מתקדם",
      description: "העמקה בכללי הדקדוק העברי, הטיות פעלים ומבנה המשפט",
      duration: "6 שבועות",
      lessonsCount: 32,
      completedLessons: 12,
      isStarted: true,
    },
    {
      id: "3",
      title: "ספרות עברית קלסית",
      description: "היכרות עם יצירות מופת בספרות העברית הקלסית והמודרנית",
      duration: "8 שבועות", 
      lessonsCount: 28,
      completedLessons: 28,
      isStarted: true,
    },
    {
      id: "4",
      title: "עברית עסקית",
      description: "שפה עברית למקום העבודה, כתיבת מיילים ומסמכים מקצועיים",
      duration: "3 שבועות",
      lessonsCount: 18,
      completedLessons: 0,
      isStarted: false,
    },
  ];

  const filteredCourses = courses.filter(course =>
    course.title.includes(searchTerm) || course.description.includes(searchTerm)
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-hero border-b border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
              הקורסים שלנו
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              למד עברית בקצב שלך עם הקורסים המובנים והמתקדמים שלנו
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filters */}
        <Card className="glass-card mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="חפש קורסים..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Button variant="outline" className="md:w-auto">
                <Filter className="w-4 h-4" />
                סנן
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <BookOpen className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">{courses.length}</h3>
              <p className="text-muted-foreground">קורסים זמינים</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">
                {courses.reduce((acc, course) => acc + course.lessonsCount, 0)}
              </h3>
              <p className="text-muted-foreground">שיעורים סה״כ</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <div className="w-8 h-8 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">✓</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">
                {courses.reduce((acc, course) => acc + course.completedLessons, 0)}
              </h3>
              <p className="text-muted-foreground">שיעורים הושלמו</p>
            </CardContent>
          </Card>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <ModuleCard
              key={course.id}
              {...course}
            />
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">לא נמצאו קורסים</h3>
            <p className="text-muted-foreground">
              נסה לחפש עם מילות מפתח אחרות
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;