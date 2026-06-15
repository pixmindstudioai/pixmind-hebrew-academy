import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Lock, CreditCard, ShieldCheck, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSumitCheckout, sumitConfigured } from '@/hooks/useSumitCheckout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

type ItemType = 'module' | 'bundle';

const priceOf = (it: { regular_price: number | null; sale_price: number | null; sale_active: boolean | null }) =>
  it.sale_active && it.sale_price != null ? Number(it.sale_price) : Number(it.regular_price ?? 0);

const FORM_ID = 'sumit-payment-form';

const Checkout = () => {
  const { type, id } = useParams<{ type: ItemType; id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { ready, loadError, createToken } = useSumitCheckout();

  const [cardholder, setCardholder] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const itemType: ItemType = type === 'bundle' ? 'bundle' : 'module';
  const table = itemType === 'bundle' ? 'bundles' : 'modules';

  const { data: item, isLoading } = useQuery({
    queryKey: ['checkout-item', itemType, id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select('id, title, is_paid, regular_price, sale_price, sale_active')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const amount = item ? priceOf(item) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || submitting || !item) return;
    setSubmitting(true);
    try {
      const token = await createToken(`#${FORM_ID}`);
      if (!token) {
        // SUMIT renders the field-level error into .og-errors itself.
        setSubmitting(false);
        return;
      }
      const { data, error } = await supabase.functions.invoke('sumit-charge', {
        body: { token, itemType, itemId: id, fullName: cardholder.trim(), phone: phone.trim() },
      });
      if (error || !data?.success) {
        toast.error(data?.error || 'החיוב נכשל. בדוק את פרטי הכרטיס ונסה שוב.');
        setSubmitting(false);
        return;
      }
      // Make the unlock deterministic instead of relying solely on the realtime subscription.
      queryClient.invalidateQueries({ queryKey: ['user-module-access'] });
      queryClient.invalidateQueries({ queryKey: ['user-bundle-access'] });
      toast.success(
        data.grantPending
          ? 'התשלום התקבל! הגישה תיפתח תוך כמה רגעים. אם לא — פנה לתמיכה.'
          : 'התשלום בוצע בהצלחה! הגישה נפתחה 🎉',
      );
      navigate(itemType === 'module' ? `/courses/${id}` : '/courses');
    } catch {
      toast.error('שגיאה בעיבוד התשלום. נסה שוב.');
      setSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // A purchase attaches to the signed-in user — don't show the card form to logged-out visitors.
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md p-4 text-center" dir="rtl">
        <p className="text-muted-foreground">יש להתחבר כדי להשלים רכישה.</p>
        <Button className="mt-4" onClick={() => navigate('/login')}>התחברות</Button>
      </div>
    );
  }

  if (!item || !item.is_paid || amount <= 0) {
    return (
      <div className="mx-auto max-w-md p-4 text-center" dir="rtl">
        <p className="text-muted-foreground">פריט זה אינו זמין לרכישה.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/courses')}>
          חזרה לקורסים
        </Button>
      </div>
    );
  }

  // If SUMIT isn't configured yet, don't show a broken form.
  if (!sumitConfigured) {
    return (
      <div className="mx-auto max-w-md p-4 text-center" dir="rtl">
        <p className="text-muted-foreground">התשלום המקוון אינו זמין כרגע. אנא פנה לתמיכה.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>חזרה</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4 sm:p-6" dir="rtl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" />
        חזרה
      </button>

      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">תשלום מאובטח</h1>
        <p className="text-muted-foreground">השלמת רכישה עבור: {item.title}</p>
      </div>

      {/* Order summary */}
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <span className="font-medium">{item.title}</span>
          <span className="text-lg font-bold text-primary">₪{amount.toLocaleString('he-IL')}</span>
        </CardContent>
      </Card>

      {/* Payment form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-primary" />
            פרטי כרטיס אשראי
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <p className="text-sm text-destructive">לא ניתן לטעון את טופס התשלום. רענן את העמוד ונסה שוב.</p>
          ) : (
            // SUMIT's CreateToken reads these data-og inputs; card data is tokenized client-side
            // and never sent to our servers.
            <form id={FORM_ID} data-og="form" onSubmit={handleSubmit} className="space-y-4">
              {/* SUMIT writes the SingleUseToken here; the hook clears it between retries. */}
              <input type="hidden" name="og-token" />
              <div className="space-y-1.5">
                <Label htmlFor="og-cardholder">שם בעל הכרטיס</Label>
                <Input id="og-cardholder" value={cardholder} onChange={(e) => setCardholder(e.target.value)} placeholder="ישראל ישראלי" autoComplete="cc-name" required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="og-cardnumber">מספר כרטיס</Label>
                <Input id="og-cardnumber" data-og="cardnumber" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" dir="ltr" required />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="og-expmonth">חודש</Label>
                  <Input id="og-expmonth" data-og="expirationmonth" inputMode="numeric" autoComplete="cc-exp-month" placeholder="MM" dir="ltr" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="og-expyear">שנה</Label>
                  <Input id="og-expyear" data-og="expirationyear" inputMode="numeric" autoComplete="cc-exp-year" placeholder="YY" dir="ltr" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="og-cvv">CVV</Label>
                  <Input id="og-cvv" data-og="cvv" inputMode="numeric" autoComplete="cc-csc" placeholder="123" dir="ltr" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="og-citizenid">ת.ז. בעל הכרטיס</Label>
                  <Input id="og-citizenid" data-og="citizenid" inputMode="numeric" placeholder="000000000" dir="ltr" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="og-phone">טלפון (לא חובה)</Label>
                  <Input id="og-phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="050-0000000" dir="ltr" />
                </div>
              </div>

              {/* SUMIT writes validation errors here */}
              <div className="og-errors text-sm font-medium text-destructive" />

              <Button type="submit" className="w-full gap-2" disabled={!ready || submitting}>
                {submitting || !ready ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {ready ? 'מעבד תשלום...' : 'טוען...'}
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    שלם ₪{amount.toLocaleString('he-IL')}
                  </>
                )}
              </Button>

              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                התשלום מאובטח ומעובד באמצעות SUMIT. פרטי הכרטיס אינם נשמרים אצלנו.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Checkout;
