import { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CMSFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  isEditing: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
  children: ReactNode;
}

export const CMSFormDialog = ({
  isOpen,
  onOpenChange,
  title,
  isEditing,
  isSubmitting,
  canSubmit,
  onSubmit,
  children
}: CMSFormDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {children}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button 
            onClick={onSubmit} 
            disabled={!canSubmit || isSubmitting}
          >
            {isEditing ? 'עדכון' : 'יצירה'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
