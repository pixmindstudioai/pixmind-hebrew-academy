
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkUser();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('אנא מלא את כל השדות');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('אימייל או סיסמה שגויים');
        } else {
          setError('שגיאה בהתחברות. אנא נסה שוב');
        }
      } else {
        toast.success("התחברת בהצלחה! ברוך הבא חזרה לאקדמיה");
        navigate('/');
      }
    } catch (err) {
      setError('שגיאה לא צפויה. אנא נסה שוב');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('אנא הכנס את כתובת האימייל שלך');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError('שגיאה בשליחת קישור איפוס הסיסמה');
      } else {
        toast.success("קישור איפוס הסיסמה נשלח! בדוק את האימייל שלך");
      }
    } catch (err) {
      setError('שגיאה לא צפויה. אנא נסה שוב');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-6 hover:opacity-80 transition-opacity">
            <img 
              src="/logo.png" 
              alt="PixMind Studio Academy Logo" 
              className="h-16 w-auto"
            />
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">התחברות</h1>
          <p className="text-muted-foreground">התחבר לחשבון שלך כדי להמשיך ללמוד</p>
        </div>

        {/* Login Form */}
        <div className="glass-card p-8 rounded-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                כתובת אימייל
              </Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="הכנס את כתובת האימייל"
                  className="pr-10 text-right"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                סיסמה
              </Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="הכנס את הסיסמה"
                  className="pr-10 pl-10 text-right"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-left">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-primary hover:text-primary-glow transition-colors"
              >
                שכחת סיסמה?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full button-glow"
              variant="hero"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'מתחבר...' : 'התחבר'}
            </Button>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-muted-foreground">
                אין לך חשבון?{' '}
                <Link
                  to="/signup"
                  className="text-primary hover:text-primary-glow font-medium transition-colors"
                >
                  צור אחד כאן
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
