// Bundle types for course packages

export interface Bundle {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  status: 'draft' | 'active' | 'archived';
  is_paid: boolean;
  regular_price: number | null;
  sale_price: number | null;
  sale_active: boolean | null;
  sale_start_date: string | null;
  sale_end_date: string | null;
  payment_url: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface BundleModule {
  id: string;
  bundle_id: string;
  module_id: string;
  order_index: number;
  created_at: string;
}

export interface UserBundleAccess {
  id: string;
  user_email: string;
  bundle_id: string;
  granted_at: string;
  expires_at: string | null;
  granted_by: string | null;
  transaction_id: string | null;
  notes: string | null;
}

export interface BundleWithModules extends Bundle {
  modules: Array<{
    id: string;
    title: string;
    thumbnail_url: string | null;
    description: string;
  }>;
}

// Access state types
export type AccessState = 'free' | 'open' | 'locked';

export interface CourseAccessInfo {
  state: AccessState;
  label: string;
  canAccess: boolean;
}
