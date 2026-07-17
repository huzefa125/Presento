const User = require('../models/User');
const Institution = require('../models/Institution');
const Logger = require('../utils/logger');

/**
 * Institution Plan Service
 * Manages plan inheritance for institution users
 */

/**
 * Check if institution subscription is active
 */
const isInstitutionSubscriptionActive = (institution) => {
  if (!institution || !institution.subscription) {
    return false;
  }

  const subscription = institution.subscription;

  if (subscription.status !== 'active') {
    return false;
  }

  // Check if subscription has expired
  if (subscription.endDate) {
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    if (endDate < now) {
      return false;
    }
  }

  return true;
};

/**
 * Get effective plan for a user (checks institution plan if applicable)
 */
const getEffectivePlan = async (user) => {
  if (!user.isInstitutionUser || !user.institutionId) {
    // Not an institution user, return their own plan
    return {
      plan: user.subscription.plan,
      status: user.subscription.status,
      endDate: user.subscription.endDate,
      source: 'personal'
    };
  }

  // Check institution subscription
  const institution = await Institution.findById(user.institutionId);
  if (!institution) {
    // Institution not found, revert to original plan
    return {
      plan: user.subscription.originalPlan?.plan || 'free',
      status: user.subscription.originalPlan?.status || 'active',
      endDate: user.subscription.originalPlan?.endDate || null,
      source: 'original'
    };
  }

  const isInstitutionActive = isInstitutionSubscriptionActive(institution);

  if (isInstitutionActive) {
    // Institution is active, user gets institution plan
    return {
      plan: 'institution', // Institution users get institution plan
      status: 'active',
      endDate: institution.subscription.endDate,
      source: 'institution',
      institutionId: institution._id
    };
  } else {
    // Institution expired/cancelled, revert to original plan
    return {
      plan: user.subscription.originalPlan?.plan || 'free',
      status: user.subscription.originalPlan?.status || 'active',
      endDate: user.subscription.originalPlan?.endDate || null,
      source: 'original'
    };
  }
};

/**
 * Apply institution plan to a user (when joining institution)
 */
const applyInstitutionPlan = async (user, institution) => {
  if (!user || !institution) {
    throw new Error('User and institution are required');
  }

  // Save original plan if not already saved
  if (!user.subscription.originalPlan?.plan) {
    user.subscription.originalPlan = {
      plan: user.subscription.plan === 'institution' ? 'free' : user.subscription.plan,
      status: user.subscription.status,
      endDate: user.subscription.endDate
    };
  }

  // Apply institution plan
  const isActive = isInstitutionSubscriptionActive(institution);
  user.subscription.plan = 'institution'; // Institution users get institution plan
  user.subscription.status = isActive ? 'active' : 'expired';
  user.subscription.endDate = institution.subscription.endDate;
  user.subscription.institutionPlan = {
    institutionId: institution._id,
    inheritedFrom: 'institution',
    institutionPlanStatus: institution.subscription.status
  };
  user.institutionId = institution._id;
  user.isInstitutionUser = true;

  await user.save();
  return user;
};

/**
 * Remove institution plan from user (when leaving or institution expires)
 */
const removeInstitutionPlan = async (user) => {
  if (!user || !user.isInstitutionUser) {
    return user;
  }

  // Restore original plan
  const originalPlan = user.subscription.originalPlan;
  if (originalPlan && originalPlan.plan) {
    user.subscription.plan = originalPlan.plan;
    user.subscription.status = originalPlan.status || 'active';
    user.subscription.endDate = originalPlan.endDate;
  } else {
    // No original plan saved, default to free
    user.subscription.plan = 'free';
    user.subscription.status = 'active';
    user.subscription.endDate = null;
  }

  // Clear institution plan data
  user.subscription.institutionPlan = {
    institutionId: null,
    inheritedFrom: null,
    institutionPlanStatus: null
  };
  user.institutionId = null;
  user.isInstitutionUser = false;

  await user.save();
  return user;
};

/**
 * Update all users when institution subscription changes
 */
const updateInstitutionUsersPlans = async (institutionId, notifyUsers = true) => {
  try {
    const institution = await Institution.findById(institutionId);
    if (!institution) {
      Logger.warn(`Institution ${institutionId} not found for plan update`);
      return { success: false, error: 'Institution not found' };
    }

    const isActive = isInstitutionSubscriptionActive(institution);
    const users = await User.find({ 
      institutionId: institution._id,
      isInstitutionUser: true 
    });

    let updatedCount = 0;
    const updatedUsers = [];

    for (const user of users) {
      if (isActive) {
        // Institution is active, apply institution plan
        await applyInstitutionPlan(user, institution);
        updatedUsers.push(user._id);
        updatedCount++;
      } else {
        // Institution expired/cancelled, revert to original plan
        await removeInstitutionPlan(user);
        updatedUsers.push(user._id);
        updatedCount++;
      }
    }

    Logger.info(`Updated plans for ${updatedCount} users in institution ${institutionId}`);

    return {
      success: true,
      updatedCount,
      userIds: updatedUsers,
      institutionStatus: institution.subscription.status,
      isActive
    };
  } catch (error) {
    Logger.error('Error updating institution users plans', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Check and update expired institution subscriptions
 */
const checkExpiredInstitutionSubscriptions = async () => {
  try {
    const now = new Date();
    
    // Find institutions with expired subscriptions
    const expiredInstitutions = await Institution.find({
      'subscription.status': 'active',
      'subscription.endDate': { $exists: true, $lt: now }
    });

    let updatedInstitutions = 0;
    let updatedUsers = 0;

    for (const institution of expiredInstitutions) {
      // Mark institution subscription as expired
      institution.subscription.status = 'expired';
      await institution.save();
      updatedInstitutions++;

      // Update all users in this institution
      const result = await updateInstitutionUsersPlans(institution._id, false);
      if (result.success) {
        updatedUsers += result.updatedCount;
      }
    }

    Logger.info(`Checked expired subscriptions: ${updatedInstitutions} institutions expired, ${updatedUsers} users updated`);

    return {
      success: true,
      expiredInstitutions: updatedInstitutions,
      updatedUsers
    };
  } catch (error) {
    Logger.error('Error checking expired institution subscriptions', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Fix existing institution users who have 'pro' plan instead of 'institution' plan
 * This is a migration function to update users who were added before the fix
 */
const fixInstitutionUsersPlans = async () => {
  try {
    // Find all users who are institution users but have 'pro' plan
    const usersToFix = await User.find({
      isInstitutionUser: true,
      institutionId: { $exists: true, $ne: null },
      'subscription.plan': 'pro'
    });

    Logger.info(`Found ${usersToFix.length} institution users with 'pro' plan to fix`);

    let fixedCount = 0;
    const fixedUsers = [];

    for (const user of usersToFix) {
      try {
        const institution = await Institution.findById(user.institutionId);
        if (!institution) {
          Logger.warn(`Institution ${user.institutionId} not found for user ${user._id}`);
          continue;
        }

        // Save original plan if not already saved
        if (!user.subscription.originalPlan?.plan) {
          user.subscription.originalPlan = {
            plan: 'free', // Default to free if no original plan
            status: user.subscription.status,
            endDate: user.subscription.endDate
          };
        }

        // Apply institution plan
        const isActive = isInstitutionSubscriptionActive(institution);
        user.subscription.plan = 'institution';
        user.subscription.status = isActive ? 'active' : 'expired';
        user.subscription.endDate = institution.subscription.endDate;
        user.subscription.institutionPlan = {
          institutionId: institution._id,
          inheritedFrom: 'institution',
          institutionPlanStatus: institution.subscription.status
        };

        await user.save();
        fixedUsers.push(user._id);
        fixedCount++;
      } catch (error) {
        Logger.error(`Error fixing user ${user._id}`, error);
      }
    }

    Logger.info(`Fixed plans for ${fixedCount} institution users`);

    return {
      success: true,
      fixedCount,
      userIds: fixedUsers
    };
  } catch (error) {
    Logger.error('Error fixing institution users plans', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  isInstitutionSubscriptionActive,
  getEffectivePlan,
  applyInstitutionPlan,
  removeInstitutionPlan,
  updateInstitutionUsersPlans,
  checkExpiredInstitutionSubscriptions,
  fixInstitutionUsersPlans
};

