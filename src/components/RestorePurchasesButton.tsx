import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useIapPurchase, isNativeIOSApp } from '@/hooks/useIapPurchase';

/**
 * "Restore Purchases" — Apple requires non-consumable IAP apps to offer a restore action.
 * Renders nothing outside the native iOS app.
 */
export function RestorePurchasesButton({ className }: { className?: string }) {
  const { restore, busy } = useIapPurchase();

  if (!isNativeIOSApp()) return null;

  const onClick = async () => {
    const res = await restore();
    if (!res.ok) {
      toast.error('שחזור הרכישות נכשל. נסה שוב.');
      return;
    }
    if (res.failed > 0) {
      toast.error(`${res.restored} רכישות שוחזרו, ${res.failed} נכשלו. נסה שוב בעוד רגע.`);
    } else {
      toast.success(res.restored > 0 ? `שוחזרו ${res.restored} רכישות.` : 'לא נמצאו רכישות לשחזור.');
    }
  };

  return (
    <Button variant="outline" className={className} disabled={busy} onClick={onClick}>
      <RotateCcw className="h-4 w-4" />
      {busy ? 'משחזר...' : 'שחזור רכישות'}
    </Button>
  );
}

export default RestorePurchasesButton;
