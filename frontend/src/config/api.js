import axios from 'axios';
import { getApiUrl } from '../utils/config';

const API_BASE_URL = `${getApiUrl()}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    // Check for super admin token first (for super admin routes)
    const superAdminToken = sessionStorage.getItem('superAdminToken');
    
    if (superAdminToken) {
      config.headers.Authorization = `Bearer ${superAdminToken}`;
    } else {
      // Check for institution admin token (for institution admin routes)
      const institutionAdminToken = sessionStorage.getItem('institutionAdminToken');
      if (institutionAdminToken) {
        config.headers.Authorization = `Bearer ${institutionAdminToken}`;
      } else {
        // Fallback to regular JWT token
        const token = localStorage.getItem('jwtToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration and maintenance mode
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if the error is due to maintenance mode
    if (error.response?.status === 503 && error.response?.data?.maintenance) {
      // Redirect to maintenance page
      if (window.location.pathname !== '/maintenance') {
        window.location.href = '/maintenance';
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      // Don't redirect if this is a login attempt (let the component handle the error)
      const isLoginRequest = error.config?.url?.includes('/login') || 
                            error.config?.url?.includes('/register') ||
                            error.config?.url?.includes('/reset-password');
      
      if (isLoginRequest) {
        // Let the login component handle the error
        return Promise.reject(error);
      }
      
      // Check if it's a super admin route
      const isSuperAdminRoute = error.config?.url?.includes('/super-admin') || 
                                error.config?.url?.includes('/job-postings') ||
                                error.config?.url?.includes('/careers/applications');
      
      // Check if it's an institution admin route
      const isInstitutionAdminRoute = error.config?.url?.includes('/institution-admin');
      
      if (isSuperAdminRoute) {
        // Remove super admin token and redirect to super admin login
        sessionStorage.removeItem('superAdminToken');
        if (window.location.pathname.startsWith('/super-admin') && window.location.pathname !== '/super-admin/login') {
          window.location.href = '/super-admin/login';
        }
      } else if (isInstitutionAdminRoute) {
        // Remove institution admin token and redirect to institution admin page
        sessionStorage.removeItem('institutionAdminToken');
        if (window.location.pathname === '/institution-admin') {
          window.location.reload();
        }
      } else {
        // Regular auth token expiration
        localStorage.removeItem('jwtToken');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
