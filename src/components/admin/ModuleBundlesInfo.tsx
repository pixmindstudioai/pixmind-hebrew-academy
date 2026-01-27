import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ModuleBundlesInfoProps {
  moduleId: string;
}

const ModuleBundlesInfo = ({ moduleId }: ModuleBundlesInfoProps) => {
  const { data: bundles = [], isLoading } = useQuery({
    queryKey: ['module-bundles', moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bundle_modules')
        .select(`
          bundles (
            id,
            title,
            status,
            is_paid
          )
        `)
        .eq('module_id', moduleId);

      if (error) throw error;
      return (data || [])
        .map((bm: any) => bm.bundles)
        .filter(Boolean);
    },
    enabled: !!moduleId,
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border p-4 bg-muted/20">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Package className="w-4 h-4" />
          <span className="text-sm">טוען חבילות...</span>
        </div>
      </div>
    );
  }

  if (bundles.length === 0) {
    return (
      <div className="rounded-lg border p-4 bg-muted/20">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Package className="w-4 h-4" />
          <span className="text-sm">הקורס לא משויך לאף חבילה</span>
        </div>
        <Link 
          to="/admin/bundles" 
          className="text-xs text-primary hover:underline mt-1 inline-block"
        >
          נהל חבילות →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4 bg-muted/20 space-y-2">
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">הקורס כלול בחבילות:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {bundles.map((bundle: any) => (
          <Badge
            key={bundle.id}
            variant={bundle.status === 'active' ? 'default' : 'secondary'}
            className="gap-1"
          >
            {bundle.title}
            {bundle.is_paid && (
              <span className="text-xs opacity-70">₪</span>
            )}
          </Badge>
        ))}
      </div>
      <Link 
        to="/admin/bundles" 
        className="text-xs text-primary hover:underline inline-block"
      >
        נהל חבילות →
      </Link>
    </div>
  );
};

export default ModuleBundlesInfo;
