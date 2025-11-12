import { useState } from 'react';
import { Calendar, Search, DollarSign, TrendingUp, Package, AlertCircle, XCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePurchases, usePurchaseStats, useRevokeModuleAccess, type PurchaseWithModule } from '@/hooks/usePurchases';
import { useModules } from '@/hooks/useContentData';
import { useAdminRole } from '@/hooks/useAdminRole';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import AdminElevationModal from '@/components/admin/AdminElevationModal';

const PurchasesPage = () => {
  const adminRoleQuery = useAdminRole();
  const isAdmin = adminRoleQuery.data?.isAdmin || false;
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseWithModule | null>(null);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [purchaseToRevoke, setPurchaseToRevoke] = useState<PurchaseWithModule | null>(null);
  const [elevationModalOpen, setElevationModalOpen] = useState(false);

  const { data: modules = [] } = useModules();
  const { data: stats, isLoading: statsLoading } = usePurchaseStats();
  const { data: purchases = [], isLoading: purchasesLoading } = usePurchases({
    dateFrom,
    dateTo,
    moduleId: selectedModule === 'all' ? undefined : selectedModule,
    search,
  });

  const revokeAccess = useRevokeModuleAccess();

  const handleRevoke = () => {
    if (purchaseToRevoke && purchaseToRevoke.module_id) {
      revokeAccess.mutate(
        {
          userEmail: purchaseToRevoke.user_email,
          moduleId: purchaseToRevoke.module_id,
        },
        {
          onSuccess: () => {
            setRevokeDialogOpen(false);
            setPurchaseToRevoke(null);
          },
        }
      );
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: currency || 'ILS',
    }).format(amount);
  };

  if (!isAdmin) {
    return (
      <AdminElevationModal
        open={elevationModalOpen}
        onOpenChange={setElevationModalOpen}
        onSuccess={() => {
          // Reload will happen automatically in the modal
        }}
      />
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">רכישות ותשלומים</h1>
        <p className="text-muted-foreground mt-2">
          מעקב אחר כל התשלומים והרשמות אוטומטיות ממשולם (Grow)
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">סך הכל רכישות</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  סה״כ הכנסות: {formatCurrency(stats?.totalRevenue || 0, 'ILS')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">30 יום אחרונים</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.last30Days || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  הכנסות: {formatCurrency(stats?.last30DaysRevenue || 0, 'ILS')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">7 ימים אחרונים</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.last7Days || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  הכנסות: {formatCurrency(stats?.last7DaysRevenue || 0, 'ILS')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ממוצע רכישה</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    stats?.total ? (stats.totalRevenue || 0) / stats.total : 0,
                    'ILS'
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">לרכישה</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>סינון רכישות</CardTitle>
          <CardDescription>חפש וסנן רכישות לפי תאריך, קורס או משתמש</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">מתאריך</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">עד תאריך</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">קורס</label>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הקורסים</SelectItem>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">חיפוש</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="אימייל, שם או קוד עסקה..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchases Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>רשימת רכישות</CardTitle>
          <CardDescription>
            {purchases.length} רכישות נמצאו
          </CardDescription>
        </CardHeader>
        <CardContent>
          {purchasesLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">לא נמצאו רכישות</h3>
              <p className="text-muted-foreground">
                לא נמצאו רכישות בהתאם לסינונים שנבחרו
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>אימייל</TableHead>
                    <TableHead>שם מלא</TableHead>
                    <TableHead>קורס</TableHead>
                    <TableHead>סכום</TableHead>
                    <TableHead>קוד עסקה</TableHead>
                    <TableHead>תאריך</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead className="text-left">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">
                        {purchase.user_email}
                      </TableCell>
                      <TableCell>{purchase.full_name || '-'}</TableCell>
                      <TableCell>
                        {purchase.module_id ? (
                          <span>{purchase.module_title}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            לא משוייך לקורס
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(purchase.amount, purchase.currency)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {purchase.transaction_id}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(purchase.payment_date).toLocaleDateString('he-IL')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(purchase.payment_date), {
                            addSuffix: true,
                            locale: he,
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={purchase.status === 'completed' ? 'default' : 'secondary'}>
                          {purchase.status === 'completed' ? 'הושלם' : purchase.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPurchase(purchase)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {purchase.module_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setPurchaseToRevoke(purchase);
                                setRevokeDialogOpen(true);
                              }}
                            >
                              <XCircle className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Details Dialog */}
      <Dialog open={!!selectedPurchase} onOpenChange={() => setSelectedPurchase(null)}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>פרטי רכישה</DialogTitle>
            <DialogDescription>
              מידע מלא על עסקת הרכישה
            </DialogDescription>
          </DialogHeader>
          {selectedPurchase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">אימייל משתמש</label>
                  <p className="text-sm mt-1">{selectedPurchase.user_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">שם מלא</label>
                  <p className="text-sm mt-1">{selectedPurchase.full_name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">קורס</label>
                  <p className="text-sm mt-1">{selectedPurchase.module_title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">סכום</label>
                  <p className="text-sm mt-1">
                    {formatCurrency(selectedPurchase.amount, selectedPurchase.currency)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">קוד עסקה</label>
                  <p className="text-sm mt-1 font-mono">{selectedPurchase.transaction_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ספק</label>
                  <p className="text-sm mt-1">{selectedPurchase.provider}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">תאריך תשלום</label>
                  <p className="text-sm mt-1">
                    {new Date(selectedPurchase.payment_date).toLocaleString('he-IL')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">סטטוס</label>
                  <p className="text-sm mt-1">
                    <Badge>{selectedPurchase.status}</Badge>
                  </p>
                </div>
                {selectedPurchase.payment_desc && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">תיאור תשלום</label>
                    <p className="text-sm mt-1">{selectedPurchase.payment_desc}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke Access Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>ביטול גישה לקורס</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך לבטל את הגישה של {purchaseToRevoke?.user_email} לקורס{' '}
              {purchaseToRevoke?.module_title}?
              <br />
              <br />
              פעולה זו תמחק את רשומת הגישה אך לא את פרטי הרכישה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} className="bg-destructive">
              בטל גישה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PurchasesPage;
