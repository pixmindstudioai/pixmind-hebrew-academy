
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminLoginComponent from '@/components/admin/AdminLogin';
import AdminShell from '@/components/admin/AdminShell';
import AdminHome from '@/pages/admin/AdminHome';

const AdminDashboard = () => {
  const { isAuthenticated, isLoading } = useAdminAuth();

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">בודק הרשאות...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <AdminLoginComponent />;
  }

  // Show admin dashboard if authenticated
  return (
    <AdminShell>
      <AdminHome />
    </AdminShell>
  );
};

export default AdminDashboard;
