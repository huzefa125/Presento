/**
 * Get the backend API URL based on environment
 * In production, uses the production API URL
 * In development, uses localhost or the VITE_API_URL env variable
 */
export const getApiUrl = () => {
  // Check if we're in production (not localhost)
  const isProduction = typeof window !== 'undefined' && 
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1';

  // If environment variable is set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // In production, use the production API URL
  if (isProduction) {
    return 'https://inavora-krvm.onrender.com';
  }

  // In development, use localhost
  return 'http://localhost:4000';
};

/**
 * Get the Socket.IO URL based on environment
 * In production, uses the production API URL
 * In development, uses localhost or the VITE_SOCKET_URL env variable
 */
export const getSocketUrl = () => {
  // Check if we're in production (not localhost)
  const isProduction = typeof window !== 'undefined' && 
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1';

  // If environment variable is set, use it
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  // In production, use the production API URL
  if (isProduction) {
    return 'https://inavora-krvm.onrender.com';
  }

  // In development, use localhost (default port 4000 for socket.io)
  return 'http://localhost:4000';
};

