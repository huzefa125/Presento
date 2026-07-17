const User = require('../models/User');
const Presentation = require('../models/Presentation');
const Slide = require('../models/Slide');
const { isSubscriptionActive } = require('../services/subscriptionService');
const Logger = require('../utils/logger');

const checkSlideLimit = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { presentationId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isFreePlan = !(await isSubscriptionActive(user.subscription, user));

        if (isFreePlan) {
            const slideCount = await Slide.countDocuments({ presentationId });

            if (slideCount >= 10) {
                return res.status(403).json({
                    error: 'Free plan limit reached. Upgrade to Pro for unlimited slides.',
                    code: 'LIMIT_REACHED'
                });
            }
        }

        next();
    } catch (error) {
        Logger.error('Check slide limit error', error);
        res.status(500).json({ error: 'Failed to check plan limits' });
    }
};

const checkAudienceLimit = async (userId, presentationId, currentCount) => {
    try {
        const user = await User.findById(userId);
        if (!user) return false;

        const isFreePlan = !(await isSubscriptionActive(user.subscription, user));

        if (isFreePlan && currentCount >= 21) {
            return false;
        }

        return true;
    } catch (error) {
        Logger.error('Check audience limit error', error);
        return false;
    }
};

module.exports = {
    checkSlideLimit,
    checkAudienceLimit
};
