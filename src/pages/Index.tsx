import { ArrowLeft, BookOpen, Play, Star, Users, Trophy, LogIn, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ModuleCard from "@/components/shared/ModuleCard";
import { useAuth } from "@/hooks/useAuth";
import { useVerifiedModules } from "@/hooks/useContentData";
import { useModuleAccess } from "@/hooks/useUserModuleAccess";
import heroBackground from "@/assets/hero-background.jpg";
import { toast } from "sonner";

const Index = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { data: modules = [], isLoading: modulesLoading } = useVerifiedModules();
  const { canAccessModule, userAccess } = useModuleAccess();

  // Filter modules to hide those with is_hidden unless user has access
  const visibleModules = modules.filter(module => {
    // If not hidden, show it
    if (!module.is_hidden) return true;
    
    // If hidden, only show if user has access
    return userAccess.some(access => access.module_id === module.id);
  });

  const handleModuleClick = (module: any) => {
    if (!canAccessModule(module)) {
      if (module.payment_url) {
        window.open(module.payment_url, '_blank');
      } else {
        toast.error('מודול זה בתשלום. אין לך גישה.');
      }
      return;
    }
    
    // Navigate to module or courses page as appropriate
    window.location.href = `/courses/${module.id}`;
  };

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
            {isAuthenticated ? (
              <>
                שלום {user?.user_metadata?.full_name ? user.user_metadata.full_name.split(' ')[0] : 'חבר'}! 
                <br />
                המשך את המסע שלך בלימוד עברית עם המערכת המתקדמת שלנו
              </>
            ) : (
              <>
                פלטפורמת הלימוד המתקדמת ביותר ללימוד עברית
                <br />
                עם מערכת מודולרית, נגן וידאו מותאם אישית, ומעקב התקדמות
              </>
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-scale-in">
            {isAuthenticated ? (
              <>
                <Button asChild size="lg" variant="hero" className="text-lg px-8 py-4">
                  <Link to="/courses">
                    המשך ללמוד
                    <ArrowLeft className="w-5 h-5" />
                  </Link>
                </Button>
                
                <Button asChild size="lg" variant="outline" className="text-lg px-8 py-4">
                  <Link to="/courses">
                    גלה קורסים נוספים
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg" variant="hero" className="text-lg px-8 py-4">
                  <Link to="/signup">
                    <UserPlus className="w-5 h-5" />
                    הרשם בחינם עכשיו
                  </Link>
                </Button>
                
                <Button asChild size="lg" variant="outline" className="text-lg px-8 py-4">
                  <Link to="/login">
                    <LogIn className="w-5 h-5" />
                    כבר יש לך חשבון? התחבר
                  </Link>
                </Button>
              </>
            )}
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
            {modulesLoading ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                טוען קורסים...
              </div>
            ) : visibleModules.length > 0 ? (
              visibleModules.slice(0, 6).map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  lessonsCount={0}
                  onClick={handleModuleClick}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">אין קורסים זמינים כרגע</p>
                <p className="text-sm">חזרו אלינו בקרוב לקורסים חדשים ומרתקים</p>
              </div>
            )}
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
