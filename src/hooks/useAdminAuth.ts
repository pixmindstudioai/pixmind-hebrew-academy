
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Admin access code - in production, this should be stored more securely
const ADMIN_ACCESS_CODE = 'pixmind2025';

export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing admin session on mount
    const adminAuth = localStorage.getItem('pixmind_admin_session');
    const sessionExpiry = localStorage.getItem('pixmind_admin_expiry');
    
    if (adminAuth === 'true' && sessionExpiry) {
      const now = Date.now();
      const expiry = parseInt(sessionExpiry, 10);
      
      if (now < expiry) {
        setIsAuthenticated(true);
      } else {
        // Session expired, clear it
        localStorage.removeItem('pixmind_admin_session');
        localStorage.removeItem('pixmind_admin_expiry');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = (accessCode: string): boolean => {
    if (accessCode === ADMIN_ACCESS_CODE) {
      setIsAuthenticated(true);
      
      // Set session with 24-hour expiry
      const expiry = Date.now() + (24 * 60 * 60 * 1000);
      localStorage.setItem('pixmind_admin_session', 'true');
      localStorage.setItem('pixmind_admin_expiry', expiry.toString());
      
      // Redirect to admin dashboard
      navigate('/admin');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('pixmind_admin_session');
    localStorage.removeItem('pixmind_admin_expiry');
    navigate('/');
  };

  return {
    isAuthenticated,
    isLoading,
    login,
    logout
  };
};
