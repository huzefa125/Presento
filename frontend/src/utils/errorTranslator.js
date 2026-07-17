/**
 * Translates API error messages to the user's selected language
 * Maps common English error messages to translation keys
 */
export const translateError = (error, t, defaultKey = 'common.something_went_wrong') => {
  // If error is already a translation key (starts with a namespace), return it
  if (typeof error === 'string' && (error.includes('.') || error.startsWith('t('))) {
    return error;
  }

  // Get the error message
  const errorMessage = error?.response?.data?.error || error?.message || error || '';
  
  if (!errorMessage) {
    return t(defaultKey);
  }

  // Convert to lowercase for comparison
  const lowerError = errorMessage.toLowerCase().trim();

  // Map common error messages to translation keys
  const errorMap = {
    // Authentication errors
    'invalid email or password': 'login.invalid_credential_details',
    'user not found': 'login.user_not_found_details',
    'wrong password': 'login.wrong_password_details',
    'invalid email': 'login.invalid_email_details',
    'email already in use': 'register.email_already_in_use',
    'password too weak': 'register.password_too_weak',
    'invalid or expired token': 'reset_password.invalid_or_expired_token',
    'invalid or expired otp': 'reset_password.invalid_or_expired_otp',
    
    // Network errors
    'network error': 'login.network_error',
    'failed to fetch': 'common.network_error',
    'request failed': 'common.request_failed',
    
    // Rate limiting errors
    'too many requests': 'common.rate_limit_error',
    'upload limit exceeded': 'common.upload_limit_error',
    'rate limit': 'common.rate_limit_error',

    // Plan / subscription limits
    'free_plan_presentation_limit': 'toasts.presentation.free_plan_limit_reached',
    
    // Generic errors
    'something went wrong': 'common.something_went_wrong',
    'an error occurred': 'common.something_went_wrong',
    'failed to': 'common.operation_failed',
    'error': 'common.something_went_wrong',
    
    // Presentation errors
    'failed to load presentation': 'toasts.presentation.failed_to_load',
    'failed to create presentation': 'toasts.presentation.failed_to_create',
    'failed to save presentation': 'toasts.presentation.failed_to_save',
    'failed to delete slide': 'toasts.presentation.slide_deleted',
    
    // Career errors
    'failed to submit application': 'careers.application_submit_error',
    
    // Super admin errors
    'failed to save job posting': 'super_admin.save_job_posting_error',
    'failed to delete job posting': 'super_admin.delete_job_posting_error',
    'failed to update status': 'super_admin.update_status_error',
    
    // Institution admin errors
    'failed to add user': 'institution_admin.add_user_error',
    'failed to remove user': 'institution_admin.remove_user_error',
    'failed to update branding': 'institution_admin.update_branding_error',
    'failed to update settings': 'institution_admin.update_settings_error',
    'failed to export data': 'institution_admin.export_error',
  };

  // Check for exact matches first
  if (errorMap[lowerError]) {
    return t(errorMap[lowerError]);
  }

  // Check for partial matches (contains) - sort by length (longest first) to match more specific errors
  const sortedEntries = Object.entries(errorMap).sort((a, b) => b[0].length - a[0].length);
  for (const [key, translationKey] of sortedEntries) {
    if (lowerError.includes(key)) {
      return t(translationKey);
    }
  }

  // If no match found, return the default translated message
  return t(defaultKey);
};

