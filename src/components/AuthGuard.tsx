import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import LoginRequired from './LoginRequired';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  /**
   * When false, the guard is a pass-through and renders children for everyone.
   * Used so that free / non-account content stays browsable without a login wall
   * (App Store Guideline 5.1.1(v)), while paid (account-based) content still gates.
   */
  requireAuth?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireAuth = true }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Guard disabled - public content, render for everyone (no registration wall).
  if (!requireAuth) {
    return <>{children}</>;
  }

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
