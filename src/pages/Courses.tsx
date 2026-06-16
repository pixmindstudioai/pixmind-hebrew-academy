import CoursesGrid from "@/components/courses/CoursesGrid";

// The course catalogue is intentionally public — visitors (including the iOS app,
// per App Store Guideline 5.1.1(v)) may browse all courses without logging in.
// Login is only required to open a lesson or complete a purchase.
const Courses = () => {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="section-container py-6 sm:py-8 lg:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-l from-primary via-primary-glow to-primary bg-clip-text text-transparent">
            קורסי PixMind Studio Academy
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            גלה את עולם העיצוב הגרפי והקריאטיביות. קורסים מקצועיים המותאמים לכל רמה
          </p>
        </div>

        {/* Courses Grid with Bundles */}
        <CoursesGrid />

        {/* Call to Action */}
        <div className="text-center mt-12 sm:mt-16 lg:mt-20 py-10 sm:py-12 lg:py-16 px-4 sm:px-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/40">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">מוכן להתחיל את המסע?</h2>
          <p className="text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
            הצטרף לאלפי תלמידים שכבר משדרגים את כישורי העיצוב שלהם
          </p>
        </div>
      </div>
    </div>
  );
};

export default Courses;
