
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminShell from '@/components/admin/AdminShell';

const AdminDashboard = () => {
  const { isAuthenticated, isEnabled } = useAdminAuth();

  if (!isEnabled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">לוח הבקרה אינו זמין</h1>
          <p className="text-muted-foreground">
            לוח הבקרה של המנהלים אינו מופעל כרגע
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return <AdminShell />;
};

export default AdminDashboard;
