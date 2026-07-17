const User = require('../models/User');
const Institution = require('../models/Institution');
const Logger = require('../utils/logger');
const { getEffectivePlan, isInstitutionSubscriptionActive } = require('./institutionPlanService');

const updateExpiredSubscriptions = async () => {
    try {
        const now = new Date();
        
        const expiredSubscriptions = await User.find({
            'subscription.status': 'active',
            'subscription.plan': { $ne: 'free' },
            'subscription.plan': { $ne: 'lifetime' },
            'subscription.endDate': { $exists: true, $lt: now }
        });

        let updatedCount = 0;

        for (const user of expiredSubscriptions) {
            user.subscription.status = 'expired';
            await user.save();
            updatedCount++;
        }

        return {
            success: true,
            updatedCount,
            message: `Updated ${updatedCount} expired subscription(s)`
        };
    } catch (error) {
        Logger.error('Error updating expired subscriptions', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Check if subscription is active (considers institution plan inheritance)
 * @param {Object} subscription - User subscription object
 * @param {Object} user - Full user object (optional, for institution plan check)
 * @returns {Promise<boolean>} - Whether subscription is active
 */
const isSubscriptionActive = async (subscription, user = null) => {
    // If user is provided and is an institution user, check institution plan
    if (user && user.isInstitutionUser && user.institutionId) {
        try {
            const effectivePlan = await getEffectivePlan(user);
            // If effective plan is 'pro', 'institution', or 'lifetime', subscription is active
            return effectivePlan.plan === 'pro' || effectivePlan.plan === 'institution' || effectivePlan.plan === 'lifetime';
        } catch (error) {
            Logger.error('Error checking institution plan', error);
            // Fall through to regular check
        }
    }

    // Regular subscription check
    if (!subscription || subscription.plan === 'free') {
        return false;
    }

    if (subscription.status !== 'active') {
        return false;
    }

    if (subscription.plan === 'lifetime' || subscription.plan === 'institution') {
        return true;
    }

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
 * Get subscription status (considers institution plan inheritance)
 * @param {Object} subscription - User subscription object
 * @param {Object} user - Full user object (optional, for institution plan check)
 * @returns {Promise<Object>} - Subscription status
 */
const getSubscriptionStatus = async (subscription, user = null) => {
    const isActive = await isSubscriptionActive(subscription, user);
    
    // Get effective plan if user is institution user
    let effectivePlan = subscription?.plan || 'free';
    let effectiveEndDate = subscription?.endDate;
    
    if (user && user.isInstitutionUser && user.institutionId) {
        try {
            const effective = await getEffectivePlan(user);
            effectivePlan = effective.plan;
            effectiveEndDate = effective.endDate;
        } catch (error) {
            Logger.error('Error getting effective plan', error);
        }
    }
    
    let daysRemaining = null;
    if (effectiveEndDate && effectivePlan !== 'lifetime') {
        const now = new Date();
        const endDate = new Date(effectiveEndDate);
        const diffTime = endDate - now;
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
        isActive,
        plan: effectivePlan,
        status: subscription?.status || 'active',
        startDate: subscription?.startDate,
        endDate: effectiveEndDate,
        daysRemaining: daysRemaining !== null ? Math.max(0, daysRemaining) : null,
        isExpired: effectiveEndDate && new Date(effectiveEndDate) < new Date(),
        isLifetime: effectivePlan === 'lifetime',
        source: user?.isInstitutionUser ? 'institution' : 'personal'
    };
};

module.exports = {
    updateExpiredSubscriptions,
    isSubscriptionActive,
    getSubscriptionStatus,
    getSubscriptionStatus
};

