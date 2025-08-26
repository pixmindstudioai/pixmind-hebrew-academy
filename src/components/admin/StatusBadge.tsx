import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface StatusBadgeProps {
  isActive: boolean;
  expiresAt?: string;
}

export function StatusBadge({ isActive, expiresAt }: StatusBadgeProps) {
  const now = new Date();
  const expiry = expiresAt ? new Date(expiresAt) : null;
  
  // Determine status
  let status: 'active' | 'expired' | 'expiring' = 'active';
  let variant: 'default' | 'destructive' | 'secondary' = 'default';
  let icon = <CheckCircle className="h-3 w-3" />;
  let text = 'פעיל';

  if (!isActive || (expiry && expiry <= now)) {
    status = 'expired';
    variant = 'destructive';
    icon = <XCircle className="h-3 w-3" />;
    text = 'פג תוקף';
  } else if (expiry) {
    // Check if expiring within 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);
    
    if (expiry <= sevenDaysFromNow) {
      status = 'expiring';
      variant = 'secondary';
      icon = <Clock className="h-3 w-3" />;
      text = 'פג בקרוב';
    }
  }

  return (
    <Badge variant={variant} className="flex items-center gap-1 text-xs">
      {icon}
      {text}
    </Badge>
  );
}