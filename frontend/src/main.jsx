import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './i18n/i18n.js'

// Suppress harmless Cross-Origin-Opener-Policy warnings from Firebase popup
// These warnings occur when Firebase checks if the popup window is closed
// They don't affect functionality and can be safely ignored
const originalConsoleError = console.error;
console.error = (...args) => {
  const errorMsg = args.join(' ');
  // Suppress Cross-Origin-Opener-Policy warnings (harmless Firebase popup warnings)
  if (errorMsg.includes('Cross-Origin-Opener-Policy') || 
      errorMsg.includes('window.closed') ||
      errorMsg.includes('policy would block')) {
    // Silently ignore these warnings
    return;
  }
  // Log all other errors normally
  originalConsoleError.apply(console, args);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)