import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, UserPlus, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const LoginRequired: React.FC = () => {
  return (
    <div 
      className="min-h-screen bg-background flex items-center justify-center p-4" 
      dir="rtl"
    >
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            עליכם להתחבר כדי לצפות בתוכן הקורס
          </CardTitle>
          <CardDescription className="text-base">
            עמוד זה זמין רק למשתמשים מחוברים.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button asChild className="w-full" size="lg">
            <Link to="/login" className="flex items-center justify-center gap-2">
              <LogIn className="w-5 h-5" />
              התחברות
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full" size="lg">
            <Link to="/signup" className="flex items-center justify-center gap-2">
              <UserPlus className="w-5 h-5" />
              הרשמה
            </Link>
          </Button>
          
          <div className="text-center pt-4">
            <Link 
              to="/" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              חזרה לעמוד הבית
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginRequired;
