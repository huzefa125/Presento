/**
 * Get effective plan for display
 * Checks if subscription has expired and returns 'free' if expired
 * Trusts backend's calculation for institution users (backend already sets plan: 'institution')
 * @param {Object} subscription - Subscription object
 * @param {Object} user - Optional full user object (for checking isInstitutionUser, institutionId)
 * @returns {string} - Effective plan ('free', 'pro', 'lifetime', 'institution')
 */
export const getEffectivePlan = (subscription, user = null) => {
  if (!subscription) {
    // If user is institution user but no subscription, check institution status
    if (user?.isInstitutionUser && user?.institutionId) {
      return 'institution';
    }
    return 'free';
  }

  // Trust backend's calculation - if backend set plan to 'institution', use it
  // Backend already calculates effective plan for institution users
  if (subscription.plan === 'institution') {
    return 'institution';
  }

  // If plan is lifetime, it doesn't expire
  if (subscription.plan === 'lifetime') {
    return subscription.plan;
  }

  // If status is expired, return free (but not for institution users - backend handles that)
  if (subscription.status === 'expired') {
    // Double-check: if user is institution user, backend should have set plan to 'institution'
    // But if backend set status to expired and plan is not institution, trust backend
    return 'free';
  }

  // Check if endDate has passed (but not for institution users - backend handles that)
  if (subscription.endDate && subscription.plan !== 'institution') {
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    if (endDate < now) {
      return 'free';
    }
  }

  // Return the actual plan (backend has already calculated effective plan for institution users)
  return subscription.plan || 'free';
};

/**
 * Get effective status for display
 * @param {Object} subscription - Subscription object
 * @returns {string} - Effective status ('active', 'expired', 'cancelled')
 */
export const getEffectiveStatus = (subscription) => {
  if (!subscription) {
    return 'active';
  }

  // If status is explicitly expired or cancelled, return it
  if (subscription.status === 'expired' || subscription.status === 'cancelled') {
    return subscription.status;
  }

  // Check if endDate has passed (but plan is not lifetime or institution)
  if (subscription.endDate && subscription.plan !== 'lifetime' && subscription.plan !== 'institution') {
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    if (endDate < now) {
      return 'expired';
    }
  }

  return subscription.status || 'active';
};

