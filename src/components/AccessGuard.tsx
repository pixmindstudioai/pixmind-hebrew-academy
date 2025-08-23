import React from 'react';
import { useUserModuleAccess } from '@/hooks/useUserAccess';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, CreditCard } from 'lucide-react';

interface AccessGuardProps {
  moduleId: string;
  moduleTitle?: string;
  paymentUrl?: string | null;
  isPaid?: boolean | null;
  children: React.ReactNode;
}

const AccessGuard: React.FC<AccessGuardProps> = ({ 
  moduleId, 
  moduleTitle, 
  paymentUrl, 
  isPaid = false, 
  children 
}) => {
  const { isAuthenticated } = useAuth();
  const { data: hasAccess, isLoading } = useUserModuleAccess(moduleId);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">בודק הרשאות גישה...</p>
        </div>
      </div>
    );
  }

  // If module is not paid or isPaid is null/undefined, allow access
  if (!isPaid) {
    return <>{children}</>;
  }

  // If user is not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>נדרשת התחברות</CardTitle>
            <CardDescription>
              {moduleTitle ? `המודול "${moduleTitle}" דורש` : 'מודול זה דורש'} התחברות למערכת
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild className="w-full">
              <a href="/login">התחבר למערכת</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user has access, show content
  if (hasAccess) {
    return <>{children}</>;
  }

  // If no access, show payment/access denied message
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <CardTitle>מודול זה בתשלום</CardTitle>
          <CardDescription>
            {moduleTitle ? `המודול "${moduleTitle}"` : 'מודול זה'} דורש רכישה או הרשאת גישה
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-3">
          <p className="text-muted-foreground">
            אין לך גישה עדיין למודול זה. אנא פנה למנהל המערכת או רכוש גישה.
          </p>
          {paymentUrl && (
            <Button asChild className="w-full">
              <a href={paymentUrl} target="_blank" rel="noopener noreferrer">
                רכישת גישה למודול
              </a>
            </Button>
          )}
          <Button variant="outline" asChild className="w-full">
            <a href="/">חזרה לעמוד הבית</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessGuard;