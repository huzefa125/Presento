import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

/**
 * Hook to check maintenance mode status
 * Redirects to maintenance page if maintenance mode is enabled
 */
export const useMaintenanceCheck = (skipCheck = false) => {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (skipCheck) {
      setLoading(false);
      return;
    }

    // Skip check for super admin routes and maintenance page itself
    if (window.location.pathname.startsWith('/super-admin') || 
        window.location.pathname === '/maintenance') {
      setLoading(false);
      return;
    }

    const checkMaintenance = async () => {
      try {
        const response = await api.get('/maintenance/status');
        if (response.data.success && response.data.maintenance) {
          setIsMaintenance(true);
          if (window.location.pathname !== '/maintenance') {
            navigate('/maintenance', { replace: true });
          }
        } else {
          setIsMaintenance(false);
        }
      } catch (error) {
        // If we can't check, assume no maintenance (fail open)
        console.error('Error checking maintenance status:', error);
        setIsMaintenance(false);
      } finally {
        setLoading(false);
      }
    };

    checkMaintenance();
  }, [navigate, skipCheck]);

  return { isMaintenance, loading };
};

