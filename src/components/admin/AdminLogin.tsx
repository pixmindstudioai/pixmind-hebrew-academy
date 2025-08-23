
import { useState } from 'react';
import { Shield, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const AdminLogin = () => {
  const [accessCode, setAccessCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));

    const success = login(accessCode.trim());
    
    if (!success) {
      setError('קוד שגוי. נסה שוב.');
      setAccessCode(''); // Clear the input on error
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo/Brand Area */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">PixMind Studio Academy</h1>
          <p className="text-muted-foreground">מערכת ניהול למנהלים</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8 rounded-2xl shadow-2xl border border-border/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full mb-6 shadow-lg">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">כניסה למערכת הניהול</h2>
            <p className="text-muted-foreground text-sm">
              הזן את קוד הגישה שלך כדי לגשת ללוח הבקרה
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="accessCode" className="text-sm font-medium text-foreground">
                קוד גישה *
              </label>
              <div className="relative">
                <Input
                  id="accessCode"
                  type={showCode ? 'text' : 'password'}
                  value={accessCode}
                  onChange={(e) => {
                    setAccessCode(e.target.value);
                    if (error) setError(''); // Clear error when user starts typing
                  }}
                  placeholder="הכנס את קוד הגישה"
                  required
                  className="text-right pr-12 pl-4 h-12 text-lg transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                  disabled={isLoading}
                  autoComplete="off"
                />
                <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50 transition-colors"
                  onClick={() => setShowCode(!showCode)}
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
                <AlertDescription className="text-right font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              disabled={isLoading || !accessCode.trim()}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  מתחבר...
                </div>
              ) : (
                'כניסה למערכת'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border/20 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              🔒 גישה מאובטחת למנהלים מורשים בלבד<br />
              כל פעילות במערכת נרשמת ומתועדת
            </p>
          </div>
        </div>

        {/* Additional Security Note */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            נתקלת בבעיה? פנה למנהל המערכת
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
