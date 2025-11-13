export interface SaleInfo {
  isActive: boolean;
  discountPercentage: number;
  timeRemaining?: {
    days: number;
    hours: number;
    minutes: number;
  };
}

export const calculateSaleInfo = (module: {
  sale_active?: boolean;
  sale_price?: number | null;
  regular_price?: number | null;
  sale_start_date?: string | null;
  sale_end_date?: string | null;
}): SaleInfo => {
  const now = new Date();

  // Check if sale is manually disabled
  if (!module.sale_active || !module.sale_price || !module.regular_price) {
    return { isActive: false, discountPercentage: 0 };
  }

  // Check start date
  if (module.sale_start_date && new Date(module.sale_start_date) > now) {
    return { isActive: false, discountPercentage: 0 };
  }

  // Check end date
  if (module.sale_end_date && new Date(module.sale_end_date) < now) {
    return { isActive: false, discountPercentage: 0 };
  }

  // Calculate discount percentage
  const discount = ((module.regular_price - module.sale_price) / module.regular_price) * 100;

  // Calculate time remaining if end date exists
  let timeRemaining;
  if (module.sale_end_date) {
    const endDate = new Date(module.sale_end_date);
    const diff = endDate.getTime() - now.getTime();
    
    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      timeRemaining = { days, hours, minutes };
    }
  }

  return {
    isActive: true,
    discountPercentage: Math.round(discount),
    timeRemaining,
  };
};

export const formatPrice = (price: number | null | undefined): string => {
  if (!price) return '';
  return `₪${price.toFixed(2)}`;
};
