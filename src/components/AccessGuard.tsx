import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useModuleAccess } from '@/hooks/useUserModuleAccess';
import { useAuth } from '@/hooks/useAuth';
import { sumitConfigured } from '@/hooks/useSumitCheckout';
import { useIapPurchase, isNativeIOSApp } from '@/hooks/useIapPurchase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, CreditCard } from 'lucide-react';

interface AccessGuardProps {
  moduleId: string;
  moduleTitle?: string;
  paymentUrl?: string | null;
  isPaid?: boolean | null;
  wasFreeBefore?: boolean;
  becamePaidAt?: string | null;
  appleProductId?: string | null;
  children: React.ReactNode;
}

const AccessGuard: React.FC<AccessGuardProps> = ({
  moduleId,
  moduleTitle,
  paymentUrl,
  isPaid = false,
  wasFreeBefore = false,
  becamePaidAt = null,
  appleProductId = null,
  children
}) => {
  const { isAuthenticated } = useAuth();
  const { hasAccess, isLoading, isLegacyFreeUser } = useModuleAccess();
  const { purchase: iapPurchase, busy: iapBusy } = useIapPurchase();

  const handleIapBuy = async () => {
    if (!appleProductId) return;
    const res = await iapPurchase(appleProductId);
    if (res.ok) toast.success('הרכישה הושלמה! הגישה נפתחה 🎉');
    else if (res.error === 'pending') toast.info('הרכישה ממתינה לאישור. הגישה תיפתח אוטומטית לאחר האישור.');
    else if (res.error && res.error !== 'cancelled') toast.error('הרכישה לא הושלמה. נסה שוב.');
  };

  // Check if current user is a legacy free user for this module
  const isLegacyFree = isLegacyFreeUser({ was_free_before: wasFreeBefore, became_paid_at: becamePaidAt });

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

  // If user has explicit access OR is a legacy free user, show content
  if (hasAccess(moduleId) || isLegacyFree) {
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
          {isNativeIOSApp() ? (
            appleProductId ? (
              <Button className="w-full" disabled={iapBusy} onClick={handleIapBuy}>
                {iapBusy ? 'מעבד...' : 'רכישת גישה למודול'}
              </Button>
            ) : (
              // Never steer to an external purchase method from inside the app (App Store 3.1.1).
              <p className="text-sm text-muted-foreground">
                רכישת מודול זה אינה זמינה כרגע.
              </p>
            )
          ) : sumitConfigured ? (
            <Button asChild className="w-full">
              <Link to={`/checkout/module/${moduleId}`}>רכישת גישה למודול</Link>
            </Button>
          ) : paymentUrl ? (
            <Button asChild className="w-full">
              <a href={paymentUrl} target="_blank" rel="noopener noreferrer">
                רכישת גישה למודול
              </a>
            </Button>
          ) : null}
          <Button variant="outline" asChild className="w-full">
            <a href="/">חזרה לעמוד הבית</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessGuard;
