import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminLoginComponent from '@/components/admin/AdminLogin';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAdminAuth();

  useEffect(() => {
    // Redirect to admin dashboard if already authenticated
    if (!isLoading && isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

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

  // Don't render login if already authenticated (prevents flash)
  if (isAuthenticated) {
    return null;
  }

  return <AdminLoginComponent />;
};

export default AdminLoginPage;