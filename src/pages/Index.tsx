import { ArrowLeft, BookOpen, Play, Star, Users, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ModuleCard from "@/components/ModuleCard";
import heroBackground from "@/assets/hero-background.jpg";

const Index = () => {
  // Sample course data
  const featuredCourses = [
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
  ];

  const stats = [
    { icon: Users, label: "תלמידים רשומים", value: "15,000+" },
    { icon: BookOpen, label: "קורסים זמינים", value: "50+" },
    { icon: Play, label: "שיעורי וידאו", value: "800+" },
    { icon: Trophy, label: "תלמידים שסיימו", value: "5,000+" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative min-h-[80vh] flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            <span className="gradient-text">אקדמיית</span>
            <br />
            <span className="text-foreground">PixMind Studio</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in">
            פלטפורמת הלימוד המתקדמת ביותר ללימוד עברית
            <br />
            עם מערכת מודולרית, נגן וידאו מותאם אישית, ומעקב התקדמות
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-scale-in">
            <Button asChild size="lg" variant="hero" className="text-lg px-8 py-4">
              <Link to="/courses">
                התחל ללמוד עכשיו
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            
            <Button asChild size="lg" variant="outline" className="text-lg px-8 py-4">
              <Link to="/courses">
                גלה את הקורסים
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-secondary border-y border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="glass-card text-center hover:scale-105 transition-transform duration-300">
                  <CardContent className="p-6">
                    <Icon className="w-8 h-8 text-primary mx-auto mb-4" />
                    <div className="text-2xl md:text-3xl font-bold mb-2 text-foreground">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
              הקורסים הפופולריים
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              בחר מבין הקורסים המובילים שלנו והתחל את המסע שלך בלימוד העברית
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {featuredCourses.map((course) => (
              <ModuleCard
                key={course.id}
                {...course}
              />
            ))}
          </div>

          <div className="text-center">
            <Button asChild size="lg" variant="outline" className="button-glow">
              <Link to="/courses">
                צפה בכל הקורסים
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
              למה לבחור בנו?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              הטכנולוגיה המתקדמת ביותר לשירותך
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="glass-card hover:scale-105 transition-transform duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>מבנה מודולרי</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  מערכת לימוד מתקדמת המחולקת למודולים, פרקים ושיעורים לחוויית למידה מיטבית
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover:scale-105 transition-transform duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <Play className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>נגן וידאו מתקדם</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  נגן וידאו מותאם אישית עם פקדים נוחים, כתוביות ומהירות השמעה משתנה
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover:scale-105 transition-transform duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>מעקב התקדמות</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  מעקב מדויק אחר ההתקדמות שלך בכל רמה - שיעור, פרק ומודול
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
