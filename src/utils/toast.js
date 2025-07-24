// src/utils/toast.js
import toast from 'react-hot-toast';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info,
  Loader
} from 'lucide-react';

/**
 * Show success toast notification
 * @param {string} message - Success message
 * @param {Object} options - Additional options
 */
export const showSuccess = (message, options = {}) => {
  return toast.success(message, {
    duration: 3000,
    style: {
      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      color: '#FFFFFF',
      border: '1px solid #10B981',
      borderRadius: '12px',
      padding: '16px',
      fontWeight: '500',
      fontSize: '14px',
      boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.25)',
      backdropFilter: 'blur(16px)',
    },
    iconTheme: {
      primary: '#FFFFFF',
      secondary: '#10B981',
    },
    ...options
  });
};

/**
 * Show error toast notification
 * @param {string} message - Error message
 * @param {Object} options - Additional options
 */
export const showError = (message, options = {}) => {
  return toast.error(message, {
    duration: 5000,
    style: {
      background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      color: '#FFFFFF',
      border: '1px solid #EF4444',
      borderRadius: '12px',
      padding: '16px',
      fontWeight: '500',
      fontSize: '14px',
      boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.25)',
      backdropFilter: 'blur(16px)',
    },
    iconTheme: {
      primary: '#FFFFFF',
      secondary: '#EF4444',
    },
    ...options
  });
};

/**
 * Show warning toast notification
 * @param {string} message - Warning message
 * @param {Object} options - Additional options
 */
export const showWarning = (message, options = {}) => {
  return toast(message, {
    duration: 4000,
    icon: '⚠️',
    style: {
      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      color: '#FFFFFF',
      border: '1px solid #F59E0B',
      borderRadius: '12px',
      padding: '16px',
      fontWeight: '500',
      fontSize: '14px',
      boxShadow: '0 25px 50px -12px rgba(245, 158, 11, 0.25)',
      backdropFilter: 'blur(16px)',
    },
    ...options
  });
};

/**
 * Show info toast notification
 * @param {string} message - Info message
 * @param {Object} options - Additional options
 */
export const showInfo = (message, options = {}) => {
  return toast(message, {
    duration: 3000,
    icon: 'ℹ️',
    style: {
      background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      color: '#FFFFFF',
      border: '1px solid #3B82F6',
      borderRadius: '12px',
      padding: '16px',
      fontWeight: '500',
      fontSize: '14px',
      boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.25)',
      backdropFilter: 'blur(16px)',
    },
    ...options
  });
};

/**
 * Show loading toast notification
 * @param {string} message - Loading message
 * @param {Object} options - Additional options
 */
export const showLoading = (message, options = {}) => {
  return toast.loading(message, {
    style: {
      background: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
      color: '#FFFFFF',
      border: '1px solid #6B7280',
      borderRadius: '12px',
      padding: '16px',
      fontWeight: '500',
      fontSize: '14px',
      boxShadow: '0 25px 50px -12px rgba(107, 114, 128, 0.25)',
      backdropFilter: 'blur(16px)',
    },
    ...options
  });
};

/**
 * Show custom toast with Netflix theme
 * @param {string} message - Custom message
 * @param {Object} options - Custom options
 */
export const showNetflixToast = (message, options = {}) => {
  return toast(message, {
    duration: 4000,
    style: {
      background: 'linear-gradient(135deg, #e50914 0%, #b81d24 100%)',
      color: '#FFFFFF',
      border: '1px solid #e50914',
      borderRadius: '12px',
      padding: '16px',
      fontWeight: '500',
      fontSize: '14px',
      boxShadow: '0 25px 50px -12px rgba(229, 9, 20, 0.25)',
      backdropFilter: 'blur(16px)',
    },
    icon: '🎬',
    ...options
  });
};

/**
 * Show promise toast (for async operations)
 * @param {Promise} promise - Promise to track
 * @param {Object} messages - Messages for different states
 */
export const showPromiseToast = (promise, messages = {}) => {
  const defaultMessages = {
    loading: 'Processing...',
    success: 'Operation completed successfully!',
    error: 'Something went wrong!'
  };

  const toastMessages = { ...defaultMessages, ...messages };

  return toast.promise(
    promise,
    {
      loading: toastMessages.loading,
      success: toastMessages.success,
      error: toastMessages.error,
    },
    {
      style: {
        borderRadius: '12px',
        padding: '16px',
        fontWeight: '500',
        fontSize: '14px',
        backdropFilter: 'blur(16px)',
      },
      success: {
        duration: 3000,
        style: {
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          color: '#FFFFFF',
          border: '1px solid #10B981',
        },
      },
      error: {
        duration: 5000,
        style: {
          background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
          color: '#FFFFFF',
          border: '1px solid #EF4444',
        },
      },
      loading: {
        style: {
          background: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
          color: '#FFFFFF',
          border: '1px solid #6B7280',
        },
      },
    }
  );
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};

/**
 * Dismiss specific toast
 * @param {string} toastId - Toast ID to dismiss
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * General purpose toast function (backward compatibility)
 * @param {string} message - Message to show
 * @param {string} type - Type of toast (success, error, warning, info)
 * @param {Object} options - Additional options
 */
export const showToast = (message, type = 'success', options = {}) => {
  switch (type) {
    case 'success':
      return showSuccess(message, options);
    case 'error':
      return showError(message, options);
    case 'warning':
      return showWarning(message, options);
    case 'info':
      return showInfo(message, options);
    case 'loading':
      return showLoading(message, options);
    case 'netflix':
      return showNetflixToast(message, options);
    default:
      return showSuccess(message, options);
  }
};

// Export all functions as named exports
export {
  showSuccess as success,
  showError as error,
  showWarning as warning,
  showInfo as info,
  showLoading as loading,
  showNetflixToast as netflix,
  showPromiseToast as promise,
  dismissAllToasts as dismissAll,
  dismissToast as dismiss
};

// Default export
export default {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  loading: showLoading,
  netflix: showNetflixToast,
  promise: showPromiseToast,
  dismissAll: dismissAllToasts,
  dismiss: dismissToast,
  show: showToast
};