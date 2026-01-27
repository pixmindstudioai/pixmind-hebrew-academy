import AuthGuard from "@/components/AuthGuard";
import CoursesGrid from "@/components/courses/CoursesGrid";

const Courses = () => {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="section-container py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-l from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              קורסי PixMind Studio Academy
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              גלה את עולם העיצוב הגרפי והקריאטיביות. קורסים מקצועיים המותאמים לכל רמה
            </p>
          </div>

          {/* Courses Grid with Bundles */}
          <CoursesGrid />

          {/* Call to Action */}
          <div className="text-center mt-20 py-16 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/40">
            <h2 className="text-2xl font-bold mb-4">מוכן להתחיל את המסע?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              הצטרף לאלפי תלמידים שכבר משדרגים את כישורי העיצוב שלהם
            </p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default Courses;
