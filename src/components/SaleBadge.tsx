import { Badge } from '@/components/ui/badge';
import { Timer, Zap } from 'lucide-react';
import { calculateSaleInfo } from '@/lib/saleUtils';
import { cn } from '@/lib/utils';

interface SaleBadgeProps {
  module: {
    sale_active?: boolean;
    sale_price?: number | null;
    regular_price?: number | null;
    sale_start_date?: string | null;
    sale_end_date?: string | null;
  };
  size?: 'sm' | 'md' | 'lg';
  showCountdown?: boolean;
  className?: string;
}

export const SaleBadge = ({ module, size = 'md', showCountdown = true, className }: SaleBadgeProps) => {
  const saleInfo = calculateSaleInfo(module);

  if (!saleInfo.isActive) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Badge
        variant="destructive"
        className={cn(
          'animate-pulse bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600',
          sizeClasses[size]
        )}
      >
        <Zap className="h-3 w-3 ml-1 fill-current" />
        מבצע! {saleInfo.discountPercentage}% הנחה
      </Badge>

      {showCountdown && saleInfo.timeRemaining && (
        <Badge variant="outline" className={cn('gap-1', sizeClasses[size])}>
          <Timer className="h-3 w-3" />
          {saleInfo.timeRemaining.days > 0 && (
            <span>
              {saleInfo.timeRemaining.days} {saleInfo.timeRemaining.days === 1 ? 'יום' : 'ימים'}
            </span>
          )}
          {saleInfo.timeRemaining.days === 0 && (
            <span>
              {saleInfo.timeRemaining.hours.toString().padStart(2, '0')}:
              {saleInfo.timeRemaining.minutes.toString().padStart(2, '0')}
            </span>
          )}
        </Badge>
      )}
    </div>
  );
};
