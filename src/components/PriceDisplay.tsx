import { calculateSaleInfo, formatPrice } from '@/lib/saleUtils';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Gift } from 'lucide-react';
import { isNativeIOSApp } from '@/lib/platform';

interface PriceDisplayProps {
  module: {
    sale_active?: boolean;
    sale_price?: number | null;
    regular_price?: number | null;
    sale_start_date?: string | null;
    sale_end_date?: string | null;
    was_free_before?: boolean;
    became_paid_at?: string | null;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isLegacyFreeUser?: boolean;
}

export const PriceDisplay = ({ module, size = 'md', className, isLegacyFreeUser = false }: PriceDisplayProps) => {
  // No prices inside the iOS app — purchasing is web-only (App Store guideline 3.1.1).
  if (isNativeIOSApp()) return null;
  const saleInfo = calculateSaleInfo(module);

  const sizeClasses = {
    sm: {
      sale: 'text-2xl',
      regular: 'text-lg',
      strikethrough: 'text-sm',
    },
    md: {
      sale: 'text-3xl',
      regular: 'text-xl',
      strikethrough: 'text-base',
    },
    lg: {
      sale: 'text-4xl',
      regular: 'text-2xl',
      strikethrough: 'text-lg',
    },
  };

  // Show legacy free access badge for legacy users
  if (isLegacyFreeUser) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <Badge variant="secondary" className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 w-fit">
          <Gift className="w-4 h-4 ml-1" />
          גישה חינמית עבור משתמש ותיק
        </Badge>
      </div>
    );
  }

  if (!module.regular_price) {
    return null;
  }

  if (saleInfo.isActive && module.sale_price) {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'font-bold text-primary',
              sizeClasses[size].sale
            )}
          >
            {formatPrice(module.sale_price)}
          </span>
          <span
            className={cn(
              'line-through text-muted-foreground',
              sizeClasses[size].strikethrough
            )}
          >
            {formatPrice(module.regular_price)}
          </span>
        </div>
        <p className="text-sm text-green-600 font-medium">
          חסוך {formatPrice(module.regular_price - module.sale_price)}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <span className={cn('font-bold', sizeClasses[size].regular)}>
        {formatPrice(module.regular_price)}
      </span>
    </div>
  );
};
