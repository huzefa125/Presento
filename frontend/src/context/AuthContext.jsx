import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../config/api';

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
  const [jwtToken, setJwtToken] = useState(localStorage.getItem('jwtToken'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Exchange Firebase token for JWT
   */
  const exchangeFirebaseTokenForJWT = async (firebaseUser) => {
    try {
      const firebaseToken = await firebaseUser.getIdToken();

      const response = await api.post('/auth/firebase', { firebaseToken });

      const { token, user } = response.data;

      // Store JWT token
      localStorage.setItem('jwtToken', token);
      setJwtToken(token);

      // A regular user session takes priority over any leftover admin
      // session token, which api.js would otherwise attach instead and
      // cause every request to fail signature verification
      sessionStorage.removeItem('superAdminToken');
      sessionStorage.removeItem('institutionAdminToken');

      return user;
    } catch (error) {
      console.error('Error exchanging token:', error);

      // Extract server error message
      const serverError = error.response?.data?.error || error.message;
      const enhancedError = new Error(serverError);
      enhancedError.code = error.response?.data?.code || error.code;
      enhancedError.response = error.response;

      throw enhancedError;
    }
  };

  /**
   * Register new user
   */
  const register = async (email, password, displayName) => {
    try {
      setError(null);

      // Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name
      await updateProfile(userCredential.user, { displayName });

      // Send verification email so the account can pass the backend's
      // email-verification requirement
      await sendEmailVerification(userCredential.user);

      // Exchange Firebase token for JWT
      const user = await exchangeFirebaseTokenForJWT(userCredential.user);

      setCurrentUser(user);
      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  /**
   * Login user
   */
  const login = async (email, password) => {
    try {
      setError(null);

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Exchange Firebase token for JWT
      const user = await exchangeFirebaseTokenForJWT(userCredential.user);

      setCurrentUser(user);
      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  /**
   * Login with Google
   */
  const loginWithGoogle = async () => {
    try {
      setError(null);

      const provider = new GoogleAuthProvider();
      // Add custom parameters to improve popup handling
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const userCredential = await signInWithPopup(auth, provider);

      // Exchange Firebase token for JWT
      const user = await exchangeFirebaseTokenForJWT(userCredential.user);

      setCurrentUser(user);
      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      // Clear state immediately for instant UI update
      setCurrentUser(null);
      setJwtToken(null);
      localStorage.removeItem('jwtToken');
      
      // Sign out from Firebase asynchronously (don't wait for it)
      // This prevents blocking the UI update
      signOut(auth).catch((error) => {
        console.error('Firebase sign out error (non-blocking):', error);
        // Even if Firebase signOut fails, state is already cleared
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Ensure state is cleared even on error
      localStorage.removeItem('jwtToken');
      setCurrentUser(null);
      setJwtToken(null);
      throw error;
    }
  };

  /**
   * Get current user from backend
   */
  const getCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data.user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  };

  /**
   * Listen to Firebase auth state changes
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Check if JWT token exists in localStorage (source of truth)
      const storedToken = localStorage.getItem('jwtToken');

      // If no token in localStorage, user is logged out - don't make API calls
      if (!storedToken) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      if (firebaseUser && storedToken) {
        // User is signed in Firebase and has JWT - fetch user data
        try {
          const user = await getCurrentUser();
          setCurrentUser(user);
        } catch (error) {
          console.error('Auth state change error:', error);
          setCurrentUser(null);
        }
      } else if (firebaseUser && !storedToken) {
        // User is signed in Firebase but no JWT - exchange tokens
        try {
          const user = await exchangeFirebaseTokenForJWT(firebaseUser);
          setCurrentUser(user);
        } catch (error) {
          console.error('Auth state change error:', error);
          setCurrentUser(null);
        }
      } else {
        // No Firebase user or no token - user is logged out
        setCurrentUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
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
      console.error('Refresh user error:', error);
      return null;
    }
  };

  /**
   * Re-authenticate user with current password
   * Returns a fresh Firebase token for password change operations
   */
  const reauthenticate = async (currentPassword) => {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || !firebaseUser.email) {
        throw new Error('No user is currently signed in');
      }

      // Check if user has password provider
      const hasPasswordProvider = firebaseUser.providerData.some(
        provider => provider.providerId === 'password'
      );

      if (!hasPasswordProvider) {
        throw new Error('Password change is not available for Google sign-in accounts');
      }

      // Create credential with email and current password
      const credential = EmailAuthProvider.credential(
        firebaseUser.email,
        currentPassword
      );

      // Re-authenticate user
      await reauthenticateWithCredential(firebaseUser, credential);

      // Get fresh token after re-authentication
      const freshToken = await firebaseUser.getIdToken();
      return freshToken;
    } catch (error) {
      console.error('Re-authentication error:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('Current password is incorrect');
      }
      throw error;
    }
  };

  /**
   * Resend the Firebase email verification link to the currently
   * signed-in (but not yet verified) user
   */
  const resendVerificationEmail = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      throw new Error('No account session found. Please register or log in again.');
    }

    await firebaseUser.reload();
    if (firebaseUser.emailVerified) {
      throw new Error('This email is already verified. Please log in.');
    }

    await sendEmailVerification(firebaseUser);
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
    loginWithGoogle,
    logout,
    refreshUser,
    reauthenticate,
    resendVerificationEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
