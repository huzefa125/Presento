import { createContext, useContext, useState, useEffect } from 'react';
import api from '../config/api';
import { InitPageSkeleton } from '../components/common/PageSkeleton';
import { getUserToken, setUserToken, clearUserToken } from '../lib/tokens';
import { getErrorMessage, getErrorCode } from '../lib/apiError';
import { logger } from '../lib/logger';

const log = logger.scope('AuthContext');

const AuthContext = createContext();

// eslint-disable-next-line
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [jwtToken, setJwtToken] = useState(getUserToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Store a JWT returned by the backend and clear any leftover admin sessions
   * (setUserToken() takes care of that - see lib/tokens.js - since api.js
   * would otherwise attach the leftover admin token instead and cause every
   * request to fail signature verification)
   */
  const storeToken = (token) => {
    setUserToken(token);
    setJwtToken(token);
  };

  /**
   * Wrap an Axios error into a plain Error carrying the backend's error code
   */
  const toAuthError = (error) => {
    const enhancedError = new Error(getErrorMessage(error));
    enhancedError.code = getErrorCode(error);
    enhancedError.response = error.response;
    return enhancedError;
  };

  /**
   * Register new user
   */
  const register = async (email, password, displayName) => {
    try {
      setError(null);
      const response = await api.post('/auth/register', { email, password, displayName });
      const { token, user } = response.data;

      storeToken(token);
      setCurrentUser(user);
      return user;
    } catch (err) {
      const enhancedError = toAuthError(err);
      setError(enhancedError.message);
      throw enhancedError;
    }
  };

  /**
   * Login user
   */
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      storeToken(token);
      setCurrentUser(user);
      return user;
    } catch (err) {
      const enhancedError = toAuthError(err);
      setError(enhancedError.message);
      throw enhancedError;
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    setCurrentUser(null);
    setJwtToken(null);
    clearUserToken();
  };

  /**
   * Get current user from backend
   */
  const getCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data.user;
    } catch (error) {
      log.error('Get current user error:', error);
      return null;
    }
  };

  /**
   * On mount, if a JWT is already stored, fetch the current user
   */
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getUserToken();

      if (!storedToken) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        log.error('Auth init error:', error);
        setCurrentUser(null);
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Refresh current user data
   */
  const refreshUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      return user;
    } catch (error) {
      log.error('Refresh user error:', error);
      return null;
    }
  };

  /**
   * Verify a user's email using the token from the emailed verification link
   */
  const verifyEmailToken = async (token) => {
    try {
      await api.post('/auth/verify-email', { token });
    } catch (err) {
      throw toAuthError(err);
    }
  };

  /**
   * Resend the email verification link to the given address
   */
  const resendVerificationEmail = async (email) => {
    try {
      await api.post('/auth/resend-verification', { email });
    } catch (err) {
      throw toAuthError(err);
    }
  };

  const value = {
    currentUser,
    user: currentUser, // Alias for consistency
    token: jwtToken, // Expose token for API calls
    jwtToken,
    loading,
    error,
    register,
    login,
    logout,
    refreshUser,
    verifyEmailToken,
    resendVerificationEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <InitPageSkeleton />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
