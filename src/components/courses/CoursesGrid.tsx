import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, BookOpen, Package, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import CourseCard from "./CourseCard";
import BundleCard from "./BundleCard";

import { useModules, useUserProgress } from "@/hooks/useContentData";
import { useModuleAccess } from "@/hooks/useUserModuleAccess";
import { useBundles, useBundleAccess } from "@/hooks/useBundlesData";
import { useAuth } from "@/hooks/useAuth";
import { sumitConfigured } from "@/hooks/useSumitCheckout";
import { isNativeIOSApp } from "@/lib/platform";

import type { Module } from "@/hooks/useContentData";
import type { BundleWithModules, AccessState } from "@/types/bundle";

type ViewFilter = 'all' | 'courses' | 'bundles';

const CoursesGrid = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { canAccessModule, userAccess, isLegacyFreeUser } = useModuleAccess();
  const { canAccessBundle } = useBundleAccess();

  // Real-time module-access updates are already provided by useModuleAccess()
  // above (via the shared, ref-counted subscription in useUserModuleAccess),
  // so a separate useUserModuleAccessRealtime() subscription is redundant.

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("order");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");

  // Fetch data
  const { data: modules = [], isLoading: modulesLoading } = useModules('active');
  const { data: bundles = [], isLoading: bundlesLoading } = useBundles();
  const { data: userProgress = [] } = useUserProgress(user?.id);

  const isLoading = modulesLoading || bundlesLoading;

  // Filter visible modules (hide hidden ones unless user has access)
  const visibleModules = useMemo(() => {
    return modules.filter((module) => {
      if (!module.is_hidden) return true;
      return userAccess.some((access) => access.module_id === module.id);
    });
  }, [modules, userAccess]);

  // Get access state for a module
  const getModuleAccessState = (module: Module): AccessState => {
    if (!module.is_paid) return 'free';
    if (canAccessModule(module)) return 'open';
    return 'locked';
  };

  // Get access state for a bundle
  const getBundleAccessState = (bundle: BundleWithModules): AccessState => {
    if (!bundle.is_paid) return 'free';
    if (canAccessBundle(bundle)) return 'open';
    // Check if user has access to all modules in the bundle
    const hasAllModulesAccess = bundle.modules.every((module) => {
      const fullModule = modules.find((m) => m.id === module.id);
      return fullModule && canAccessModule(fullModule);
    });
    if (hasAllModulesAccess) return 'open';
    return 'locked';
  };

  // Filter and sort courses
  const filteredModules = useMemo(() => {
    return visibleModules
      .filter((module) =>
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
  }, [visibleModules, searchTerm, sortBy]);

  // Filter and sort bundles
  const filteredBundles = useMemo(() => {
    return (bundles as BundleWithModules[])
      .filter((bundle) =>
        bundle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bundle.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
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
  }, [bundles, searchTerm, sortBy]);

  // Handlers
  const handleModuleNavigate = (module: Module) => {
    navigate(`/courses/${module.id}`);
  };

  const handleModulePurchase = (module: Module) => {
    // The iOS app is view-only — purchasing happens only on the website (App Store policy).
    if (isNativeIOSApp()) return;
    if (sumitConfigured) {
      navigate(`/checkout/module/${module.id}`);
    } else if (module.payment_url) {
      window.open(module.payment_url, '_blank');
    } else {
      toast.error('לא ניתן לרכוש קורס זה כרגע');
    }
  };

  const handleBundleNavigate = (bundle: BundleWithModules) => {
    // Navigate to first module in bundle or a dedicated bundle page
    if (bundle.modules.length > 0) {
      navigate(`/courses/${bundle.modules[0].id}`);
    }
  };

  const handleBundlePurchase = (bundle: BundleWithModules) => {
    if (isNativeIOSApp()) return;
    if (sumitConfigured) {
      navigate(`/checkout/bundle/${bundle.id}`);
    } else if (bundle.payment_url) {
      window.open(bundle.payment_url, '_blank');
    } else {
      toast.error('לא ניתן לרכוש חבילה זו כרגע');
    }
  };

  // Calculate counts
  const totalItems = viewFilter === 'courses' 
    ? filteredModules.length 
    : viewFilter === 'bundles' 
      ? filteredBundles.length 
      : filteredModules.length + filteredBundles.length;

  if (isLoading) {
    return <CoursesGridSkeleton />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Search and Filter Section */}
      <div className="flex flex-col gap-4">
        {/* View tabs */}
        <Tabs value={viewFilter} onValueChange={(v) => setViewFilter(v as ViewFilter)}>
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="all" className="gap-2">
              <LayoutGrid className="w-4 h-4" />
              הכל
            </TabsTrigger>
            <TabsTrigger value="courses" className="gap-2">
              <BookOpen className="w-4 h-4" />
              קורסים
            </TabsTrigger>
            <TabsTrigger value="bundles" className="gap-2">
              <Package className="w-4 h-4" />
              חבילות
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search and Sort */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="חיפוש קורסים וחבילות..."
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
      </div>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        נמצאו {totalItems} {viewFilter === 'bundles' ? 'חבילות' : viewFilter === 'courses' ? 'קורסים' : 'פריטים'}
      </div>

      {/* Empty State */}
      {totalItems === 0 && (
        <div className="text-center py-12 sm:py-20">
          <div className="w-20 h-20 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-semibold mb-2">לא נמצאו תוצאות</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'נסה לחפש במילים אחרות' : 'עדיין אין קורסים זמינים'}
          </p>
        </div>
      )}

      {/* Bundles Section */}
      {(viewFilter === 'all' || viewFilter === 'bundles') && filteredBundles.length > 0 && (
        <div className="space-y-4">
          {viewFilter === 'all' && (
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              חבילות קורסים
            </h2>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {filteredBundles.map((bundle) => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                accessState={getBundleAccessState(bundle)}
                onNavigate={() => handleBundleNavigate(bundle)}
                onPurchase={() => handleBundlePurchase(bundle)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Courses Section */}
      {(viewFilter === 'all' || viewFilter === 'courses') && filteredModules.length > 0 && (
        <div className="space-y-4">
          {viewFilter === 'all' && (
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              קורסים בודדים
            </h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredModules.map((module) => (
              <CourseCard
                key={module.id}
                module={module}
                accessState={getModuleAccessState(module)}
                lessonsCount={12} // TODO: Get actual lesson count
                onNavigate={() => handleModuleNavigate(module)}
                onPurchase={() => handleModulePurchase(module)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Loading skeleton
const CoursesGridSkeleton = () => (
  <div className="space-y-6 sm:space-y-8">
    {/* Tabs skeleton */}
    <Skeleton className="h-10 w-72" />

    {/* Search skeleton */}
    <div className="flex flex-col md:flex-row gap-4">
      <Skeleton className="h-11 flex-1" />
      <Skeleton className="h-11 w-52" />
    </div>

    {/* Count skeleton */}
    <Skeleton className="h-5 w-32" />

    {/* Cards skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);

export default CoursesGrid;
