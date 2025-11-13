import { calculateSaleInfo, formatPrice } from '@/lib/saleUtils';
import { cn } from '@/lib/utils';

interface PriceDisplayProps {
  module: {
    sale_active?: boolean;
    sale_price?: number | null;
    regular_price?: number | null;
    sale_start_date?: string | null;
    sale_end_date?: string | null;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PriceDisplay = ({ module, size = 'md', className }: PriceDisplayProps) => {
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
