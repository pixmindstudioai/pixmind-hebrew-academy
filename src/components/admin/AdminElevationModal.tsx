import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAdminElevation } from '@/hooks/useAdminRole';
import { useToast } from '@/hooks/use-toast';
import { Shield } from 'lucide-react';

interface AdminElevationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AdminElevationModal = ({ open, onOpenChange, onSuccess }: AdminElevationModalProps) => {
  const [secretCode, setSecretCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const elevateAdmin = useAdminElevation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretCode.trim()) return;

    setIsLoading(true);
    try {
      const success = await elevateAdmin(secretCode.trim());
      
      if (success) {
        toast({
          title: "הצלחה",
          description: "הוגדרת כמנהל. טוען מחדש...",
          variant: "default",
        });
        
        setSecretCode('');
        onOpenChange(false);
        
        // Refresh the page to reload admin status
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
        onSuccess();
      } else {
        toast({
          title: "שגיאה",
          description: "קוד שגוי",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Admin elevation error:', error);
      toast({
        title: "שגיאה",
        description: "קוד שגוי או שגיאת מערכת",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            הגדרה כמנהל
          </DialogTitle>
          <DialogDescription>
            הזן את קוד המנהל להגדרה כמשתמש מנהל במערכת
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="secret-code">קוד מנהל</Label>
            <Input
              id="secret-code"
              type="password"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
              placeholder="הזן קוד מנהל..."
              disabled={isLoading}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              ביטול
            </Button>
            <Button 
              type="submit" 
              disabled={!secretCode.trim() || isLoading}
            >
              {isLoading ? 'מגדיר...' : 'הגדר כמנהל'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminElevationModal;