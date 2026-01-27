import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ModuleCard from "@/components/shared/ModuleCard";
import { useModules, useUserProgress } from "@/hooks/useContentData";
import { useModuleAccess } from "@/hooks/useUserModuleAccess";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useUserModuleAccessRealtime } from "@/hooks/useUserModuleAccessRealtime";
import type { Module } from "@/hooks/useContentData";
import AuthGuard from "@/components/AuthGuard";

const Courses = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAdminAuth();
  const { canAccessModule } = useModuleAccess();
  
  useUserModuleAccessRealtime();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("order");

  const { data: modules = [], isLoading } = useModules('active');
  const { data: userProgress = [] } = useUserProgress(isAuthenticated ? "current-user-id" : undefined);
  const { userAccess } = useModuleAccess();

  const visibleModules = modules.filter(module => {
    if (!module.is_hidden) return true;
    return userAccess.some(access => access.module_id === module.id);
  });

  const filteredModules = visibleModules
    .filter(module => 
      module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title, 'he');
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return a.order_index - b.order_index;
      }
    });

  const handleModuleClick = (module: Module) => {
    if (!canAccessModule(module)) {
      if (module.payment_url) {
        window.open(module.payment_url, '_blank');
      } else {
        toast.error('מודול זה בתשלום. אין לך גישה.');
      }
      return;
    }
    navigate(`/courses/${module.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="section-container py-12">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-video w-full rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="section-container py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
              קורסי PixMind Studio Academy
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              גלה את עולם העיצוב הגרפי והקריאטיביות. קורסים מקצועיים המותאמים לכל רמה
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="חפש קורסים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-12"
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-52">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="order">סדר ברירת מחדל</SelectItem>
                <SelectItem value="title">לפי שם</SelectItem>
                <SelectItem value="newest">החדשים ביותר</SelectItem>
                <SelectItem value="oldest">הישנים ביותר</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Summary */}
          <div className="mb-6 text-sm text-muted-foreground">
            נמצאו {filteredModules.length} קורסים
          </div>

          {/* Modules Grid */}
          {filteredModules.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-semibold mb-2">לא נמצאו קורסים</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'נסה לחפש במילים אחרות' : 'עדיין אין קורסים זמינים'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredModules.map((module) => {
                const moduleProgress = userProgress.filter(p => 
                  p.lesson_id && p.completed
                );
                
                return (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    lessonsCount={12}
                    completedLessons={moduleProgress.length}
                    duration="2.5 שעות"
                    isStarted={moduleProgress.length > 0}
                    onClick={handleModuleClick}
                  />
                );
              })}
            </div>
          )}

          {/* Call to Action */}
          {modules.length > 0 && (
            <div className="text-center mt-20 py-16 bg-card rounded-2xl border border-border/50">
              <h2 className="text-2xl font-bold mb-4">מוכן להתחיל את המסע?</h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                הצטרף לאלפי תלמידים שכבר משדרגים את כישורי העיצוב שלהם
              </p>
              <Button size="lg" variant="hero">
                התחל עכשיו
              </Button>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
};

export default Courses;
