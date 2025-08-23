
import { useState } from 'react';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useToast } from '@/hooks/use-toast';

const AdminLogin = () => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdminAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    const success = login(passcode);
    
    if (!success) {
      toast({
        title: "שגיאה בהתחברות",
        description: "קוד הגישה שהוזן אינו נכון",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl border border-border/50 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">לוח בקרה מנהלים</h1>
            <p className="text-muted-foreground">
              הזן קוד גישה כדי להמשיך למערכת הניהול
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="passcode" className="text-sm font-medium">
                קוד גישה
              </label>
              <div className="relative">
                <Input
                  id="passcode"
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="הזן קוד גישה..."
                  required
                  className="pl-12"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowPasscode(!showPasscode)}
                  disabled={isLoading}
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || !passcode.trim()}
            >
              {isLoading ? "מתחבר..." : "התחברות"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              גישה למנהלים מורשים בלבד
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
