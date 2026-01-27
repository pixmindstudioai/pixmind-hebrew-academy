import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface CMSVisibilitySelectorProps {
  accessType: 'all' | 'restricted';
  onAccessTypeChange: (value: 'all' | 'restricted') => void;
  selectedModules: string[];
  onModulesChange: (modules: string[]) => void;
  selectedBundles: string[];
  onBundlesChange: (bundles: string[]) => void;
}

export const CMSVisibilitySelector = ({
  accessType,
  onAccessTypeChange,
  selectedModules,
  onModulesChange,
  selectedBundles,
  onBundlesChange
}: CMSVisibilitySelectorProps) => {
  // Fetch modules for visibility selection
  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ['admin-modules-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('id, title')
        .order('title');
      if (error) throw error;
      return data;
    }
  });

  // Fetch bundles for visibility selection
  const { data: bundles = [], isLoading: bundlesLoading } = useQuery({
    queryKey: ['admin-bundles-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bundles')
        .select('id, title')
        .order('title');
      if (error) throw error;
      return data;
    }
  });

  const toggleModule = (moduleId: string) => {
    if (selectedModules.includes(moduleId)) {
      onModulesChange(selectedModules.filter(id => id !== moduleId));
    } else {
      onModulesChange([...selectedModules, moduleId]);
    }
  };

  const toggleBundle = (bundleId: string) => {
    if (selectedBundles.includes(bundleId)) {
      onBundlesChange(selectedBundles.filter(id => id !== bundleId));
    } else {
      onBundlesChange([...selectedBundles, bundleId]);
    }
  };

  if (modulesLoading || bundlesLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>הרשאות צפייה</Label>
        <Select value={accessType} onValueChange={onAccessTypeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל המשתמשים המחוברים</SelectItem>
            <SelectItem value="restricted">משתמשים רשומים לקורסים/חבילות ספציפיות</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {accessType === 'restricted' && (
        <>
          <div>
            <Label className="mb-2 block">קורסים</Label>
            <div className="flex flex-wrap gap-2">
              {modules.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין קורסים זמינים</p>
              ) : (
                modules.map(module => (
                  <Badge
                    key={module.id}
                    variant={selectedModules.includes(module.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleModule(module.id)}
                  >
                    {module.title}
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">חבילות</Label>
            <div className="flex flex-wrap gap-2">
              {bundles.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין חבילות זמינות</p>
              ) : (
                bundles.map(bundle => (
                  <Badge
                    key={bundle.id}
                    variant={selectedBundles.includes(bundle.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleBundle(bundle.id)}
                  >
                    {bundle.title}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
