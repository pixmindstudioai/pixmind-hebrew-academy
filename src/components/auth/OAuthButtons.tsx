import { useState } from 'react';
import { Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { isEmbeddedWebView } from '@/hooks/useIapPurchase';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8z" />
    <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.4a12 12 0 0 0 0 10.8l4-3.1z" />
    <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8L20 3.2A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
  </svg>
);

/**
 * "Continue with Google / Apple" buttons. Renders only in real browsers —
 * embedded WebViews (the native apps, in-app browsers) are hidden because
 * OAuth providers reject them. Requires the Google/Apple providers to be
 * enabled in the Supabase dashboard.
 */
export function OAuthButtons() {
  const [busy, setBusy] = useState<'google' | 'apple' | null>(null);

  if (isEmbeddedWebView()) return null;

  const signIn = async (provider: 'google' | 'apple') => {
    setBusy(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      toast.error('ההתחברות נכשלה. נסה שוב או השתמש באימייל.');
      setBusy(null);
    }
    // On success the browser navigates to the provider's consent screen.
  };

  return (
    <div className="space-y-3">
      <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-border/60" />
        <span className="px-3 text-xs text-muted-foreground">או</span>
        <div className="flex-grow border-t border-border/60" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full gap-2"
        disabled={busy !== null}
        onClick={() => signIn('google')}
      >
        <GoogleIcon />
        {busy === 'google' ? 'מתחבר...' : 'המשך עם Google'}
      </Button>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full gap-2"
        disabled={busy !== null}
        onClick={() => signIn('apple')}
      >
        <Apple className="h-[18px] w-[18px]" />
        {busy === 'apple' ? 'מתחבר...' : 'המשך עם Apple'}
      </Button>
    </div>
  );
}

export default OAuthButtons;
