import { useState } from 'react';
import { Plus, Search, Package, MoreVertical, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import BundleForm from '@/components/admin/BundleForm';
import {
  useAdminBundles,
  useCreateBundle,
  useUpdateBundle,
  useDeleteBundle,
} from '@/hooks/useAdminBundlesData';
import type { BundleWithModules } from '@/types/bundle';

const BundlesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<BundleWithModules | null>(null);
  const [bundleToDelete, setBundleToDelete] = useState<BundleWithModules | null>(null);

  const { data: bundles = [], isLoading } = useAdminBundles();
  const createBundle = useCreateBundle();
  const updateBundle = useUpdateBundle();
  const deleteBundle = useDeleteBundle();

  const filteredBundles = bundles.filter(bundle =>
    bundle.title.includes(searchTerm) ||
    (bundle.description && bundle.description.includes(searchTerm))
  );

  const handleCreate = () => {
    setEditingBundle(null);
    setDialogOpen(true);
  };

  const handleEdit = (bundle: BundleWithModules) => {
    setEditingBundle(bundle);
    setDialogOpen(true);
  };

  const handleDelete = (bundle: BundleWithModules) => {
    setBundleToDelete(bundle);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (bundleToDelete) {
      deleteBundle.mutate(bundleToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setBundleToDelete(null);
        }
      });
    }
  };

  const handleSubmit = (data: any) => {
    if (editingBundle) {
      updateBundle.mutate({ id: editingBundle.id, ...data }, {
        onSuccess: () => {
          setDialogOpen(false);
          setEditingBundle(null);
        }
      });
    } else {
      createBundle.mutate(data, {
        onSuccess: () => {
          setDialogOpen(false);
        }
      });
    }
  };

  const toggleStatus = (bundle: BundleWithModules) => {
    const newStatus = bundle.status === 'active' ? 'draft' : 'active';
    updateBundle.mutate({ id: bundle.id, status: newStatus });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/20 text-success border-success/30">פעיל</Badge>;
      case 'draft':
        return <Badge variant="secondary">טיוטה</Badge>;
      case 'archived':
        return <Badge variant="outline" className="text-muted-foreground">בארכיון</Badge>;
      default:
        return null;
    }
  };

  const getPricingBadge = (bundle: BundleWithModules) => {
    if (!bundle.is_paid) {
      return <Badge className="bg-success/20 text-success border-success/30">חינמי</Badge>;
    }
    if (bundle.sale_active && bundle.sale_price) {
      return (
        <Badge className="bg-warning/20 text-warning border-warning/30">
          מבצע ₪{bundle.sale_price}
        </Badge>
      );
    }
    if (bundle.regular_price) {
      return <Badge variant="outline">₪{bundle.regular_price}</Badge>;
    }
    return <Badge variant="outline">בתשלום</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="w-8 h-8 text-primary" />
            חבילות קורסים
          </h1>
          <p className="text-muted-foreground">
            יצירה וניהול חבילות קורסים להצעות משולבות
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          חבילה חדשה
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-72">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="חיפוש חבילות..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Bundles Grid */}
      {filteredBundles.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">אין חבילות</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? 'לא נמצאו חבילות התואמות לחיפוש' : 'צור חבילה ראשונה כדי להתחיל'}
            </p>
            {!searchTerm && (
              <Button onClick={handleCreate} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                יצירת חבילה
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBundles.map((bundle) => (
            <Card key={bundle.id} className="group hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg line-clamp-1">{bundle.title}</CardTitle>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {getStatusBadge(bundle.status)}
                      {getPricingBadge(bundle)}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(bundle)}>
                        <Pencil className="w-4 h-4 ml-2" />
                        עריכה
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleStatus(bundle)}>
                        {bundle.status === 'active' ? (
                          <>
                            <EyeOff className="w-4 h-4 ml-2" />
                            העבר לטיוטה
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 ml-2" />
                            הפעל
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(bundle)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 ml-2" />
                        מחיקה
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {bundle.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {bundle.description}
                  </p>
                )}
                
                {/* Included Modules */}
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    {bundle.modules.length} קורסים בחבילה:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {bundle.modules.slice(0, 3).map((module) => (
                      <Badge key={module.id} variant="secondary" className="text-xs">
                        {module.title}
                      </Badge>
                    ))}
                    {bundle.modules.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{bundle.modules.length - 3} נוספים
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Thumbnail */}
                {bundle.thumbnail_url && (
                  <div className="rounded-lg overflow-hidden h-24 mt-2">
                    <img
                      src={bundle.thumbnail_url}
                      alt={bundle.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <BundleForm
            bundle={editingBundle || undefined}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
            isLoading={createBundle.isPending || updateBundle.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת חבילה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את החבילה "{bundleToDelete?.title}"?
              פעולה זו לא ניתנת לביטול. הקורסים בחבילה לא יימחקו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              מחיקה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BundlesPage;
