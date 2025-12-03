import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import LoginRequired from './LoginRequired';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Loading state - show spinner while checking auth
  if (isLoading) {
    return (
      <div 
        className="min-h-screen bg-background flex items-center justify-center" 
        dir="rtl"
      >
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">טוען נתוני משתמש...</p>
        </div>
      </div>
    );
  }

  // User NOT authenticated - show login required page
  if (!isAuthenticated) {
    return <LoginRequired />;
  }

  // User authenticated - render children
  return <>{children}</>;
};

export default AuthGuard;
