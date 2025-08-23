import { useNavigate } from 'react-router-dom';
import { LogIn, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';

interface AuthenticationGuardProps {
  children: React.ReactNode;
  message?: string;
  requireAuth?: boolean;
}

const AuthenticationGuard = ({ 
  children, 
  message = "לא ניתן ליצור מודול – יש להתחבר תחילה",
  requireAuth = true 
}: AuthenticationGuardProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">בודק הרשאות...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return (
      <div className="space-y-6 p-6 text-center" dir="rtl">
        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
          <Lock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          <AlertDescription className="text-orange-800 dark:text-orange-200 font-medium">
            {message}
          </AlertDescription>
        </Alert>
        
        <div className="space-y-4">
          <div className="glass-card p-8 rounded-xl">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            
            <h3 className="text-xl font-semibold mb-2">נדרשת הרשאה</h3>
            <p className="text-muted-foreground mb-6">
              כדי לגשת לכלי הניהול ולצור מודולים חדשים, עליך להתחבר תחילה למערכת.
            </p>
            
            <Button
              onClick={() => navigate('/login')}
              size="lg"
              className="group hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <LogIn className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              התחבר למערכת
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            אין לך חשבון?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-primary hover:underline font-medium transition-colors duration-200"
            >
              צור חשבון חדש
            </button>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthenticationGuard;