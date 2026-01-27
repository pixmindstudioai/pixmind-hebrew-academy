import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CMSStatusBadgeProps {
  isActive: boolean;
  className?: string;
}

export const CMSStatusBadge = ({ isActive, className }: CMSStatusBadgeProps) => {
  return (
    <Badge
      variant={isActive ? 'default' : 'secondary'}
      className={cn(className)}
    >
      {isActive ? 'פעיל' : 'לא פעיל'}
    </Badge>
  );
};
