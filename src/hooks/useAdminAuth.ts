
import { useState, useEffect } from 'react';

const ADMIN_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || 'admin123';
const ADMIN_ENABLED = import.meta.env.VITE_ADMIN_DASHBOARD_ENABLED === 'true';

export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEnabled, setIsEnabled] = useState(ADMIN_ENABLED);

  useEffect(() => {
    const adminAuth = localStorage.getItem('admin_authenticated');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const login = (passcode: string): boolean => {
    if (!isEnabled) return false;
    
    if (passcode === ADMIN_PASSCODE) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_authenticated', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_authenticated');
  };

  return {
    isAuthenticated,
    isEnabled,
    login,
    logout
  };
};
