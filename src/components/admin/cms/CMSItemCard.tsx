import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CMSStatusBadge } from './CMSStatusBadge';
import { Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CMSItemCardProps {
  isActive: boolean;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
  children: ReactNode;
  className?: string;
}

export const CMSItemCard = ({
  isActive,
  onToggleActive,
  onEdit,
  onDelete,
  children,
  className
}: CMSItemCardProps) => {
  return (
    <Card className={cn(!isActive && 'opacity-60', className)}>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {children}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleActive}
              title={isActive ? 'השבת' : 'הפעל'}
            >
              {isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
