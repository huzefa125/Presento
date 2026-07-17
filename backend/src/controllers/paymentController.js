const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { updateExpiredSubscriptions, getSubscriptionStatus } = require('../services/subscriptionService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const Logger = require('../utils/logger');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const PLAN_PRICES = {
    'pro-monthly': { amount: 19900, currency: 'INR', durationDays: 30 },
    'pro-yearly': { amount: 99900, currency: 'INR', durationDays: 365 },
    'lifetime': { amount: 499900, currency: 'INR', durationDays: null },
    'institution': { amount: 49900, currency: 'INR', durationDays: 365 },
};

/**
 * Create Razorpay order
 * @route POST /api/payments/create-order
 * @access Private
 */
const createOrder = asyncHandler(async (req, res, next) => {
    const { plan } = req.body;
    const userId = req.userId;

    if (!plan || !PLAN_PRICES[plan]) {
        throw new AppError('Invalid or missing plan selected', 400, 'VALIDATION_ERROR');
    }

    const userIdString = userId.toString();
    const planDetails = PLAN_PRICES[plan];

    const options = {
        amount: planDetails.amount,
        currency: planDetails.currency,
        receipt: `receipt_${Date.now()}_${userIdString.substring(0, 5)}`,
        notes: {
            userId: userIdString,
            plan
        }
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        plan
    });
});

/**
 * Verify Razorpay payment and update subscription
 * @route POST /api/payments/verify
 * @access Private
 */
const verifyPayment = asyncHandler(async (req, res, next) => {
    const {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        plan
    } = req.body;
    const userId = req.userId;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !plan) {
        throw new AppError('Missing payment details', 400, 'VALIDATION_ERROR');
    }

    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpaySignature;

    if (!isAuthentic) {
        throw new AppError('Invalid payment signature', 400, 'VALIDATION_ERROR');
    }

    const existingPayment = await Payment.findOne({ razorpayOrderId });
    if (existingPayment) {
        if (existingPayment.status === 'captured') {
            return res.status(200).json({ 
                success: true,
                message: 'Payment already processed', 
                subscription: null 
            });
        }
    }

    const planDetails = PLAN_PRICES[plan];
    if (!planDetails) {
        throw new AppError('Invalid plan', 400, 'VALIDATION_ERROR');
    }

    const startDate = new Date();
    let endDate = null;

    if (planDetails.durationDays) {
        endDate = new Date();
        endDate.setDate(endDate.getDate() + planDetails.durationDays);
    }

    let normalizedPlan = plan;
    let billingCycle = null;
    
    if (plan === 'pro-monthly') {
        normalizedPlan = 'pro';
        billingCycle = 'monthly';
    } else if (plan === 'pro-yearly') {
        normalizedPlan = 'pro';
        billingCycle = 'yearly';
    } else if (plan === 'lifetime') {
        billingCycle = 'lifetime';
    } else if (plan === 'institution') {
        normalizedPlan = 'institution';
        billingCycle = 'yearly';
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new AppError('User not found', 404, 'RESOURCE_NOT_FOUND');
    }

    user.subscription = {
        plan: normalizedPlan,
        status: 'active',
        startDate,
        endDate,
        billingCycle,
        razorpayCustomerId: null
    };

    await user.save();

    const payment = new Payment({
        userId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        amount: planDetails.amount / 100,
        currency: planDetails.currency,
        status: 'captured',
        plan: normalizedPlan,
        originalPlan: plan !== normalizedPlan ? plan : undefined
    });

    await payment.save();

    res.status(200).json({
        success: true,
        message: 'Payment verified and subscription updated',
        subscription: user.subscription
    });
});

/**
 * Get payment history for current user
 * @route GET /api/payments/history
 * @access Private
 */
const getPaymentHistory = asyncHandler(async (req, res, next) => {
    const userId = req.userId;

    const payments = await Payment.find({ userId })
        .sort({ createdAt: -1 })
        .select('-razorpaySignature')
        .lean();

    res.status(200).json({
        success: true,
        payments: payments.map(payment => ({
            id: payment._id,
            amount: payment.amount,
            currency: payment.currency,
            plan: payment.originalPlan || payment.plan,
            status: payment.status,
            orderId: payment.razorpayOrderId,
            paymentId: payment.razorpayPaymentId,
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt
        }))
    });
});

/**
 * Get current user's subscription status
 * @route GET /api/payments/subscription
 * @access Private
 */
const getSubscriptionStatusEndpoint = asyncHandler(async (req, res, next) => {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError('User not found', 404, 'RESOURCE_NOT_FOUND');
    }

    const subscriptionStatus = await getSubscriptionStatus(user.subscription, user);

    res.status(200).json({
        success: true,
        subscription: subscriptionStatus
    });
});

/**
 * Update expired subscriptions (Cron job endpoint)
 * @route POST /api/payments/update-expired
 * @access Private (Cron secret required)
 */
const updateExpired = asyncHandler(async (req, res, next) => {
    const secretKey = req.query.secret || req.headers['x-cron-secret'];
    const expectedSecret = process.env.CRON_SECRET_KEY || 'your-secret-cron-key-change-this';

    if (secretKey !== expectedSecret) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const result = await updateExpiredSubscriptions();

    res.status(200).json({
        success: true,
        ...result
    });
});

/**
 * Handle Razorpay webhook events
 * @route POST /api/payments/webhook
 * @access Public (Razorpay)
 */
const handleWebhook = asyncHandler(async (req, res, next) => {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
        Logger.error('Razorpay webhook secret not configured');
        return res.status(200).json({ received: true, error: 'Webhook secret not configured' });
    }

    const body = req.rawBody || JSON.stringify(req.body);
    
    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

    if (webhookSignature !== expectedSignature) {
        Logger.error('Invalid webhook signature');
        return res.status(200).json({ received: true, error: 'Invalid signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    Logger.info(`Razorpay webhook event received: ${event}`);

    switch (event) {
        case 'payment.captured':
            const paymentId = payload.payment?.entity?.id;
            Logger.info(`Payment captured via webhook: ${paymentId}`);
            
            if (paymentId) {
                const existingPayment = await Payment.findOne({ razorpayPaymentId: paymentId });
                if (!existingPayment) {
                    Logger.warn('Payment not found in database, may need manual verification');
                }
            }
            break;

        case 'payment.failed':
            const failedPaymentId = payload.payment?.entity?.id;
            Logger.warn(`Payment failed via webhook: ${failedPaymentId}`);
            
            if (failedPaymentId) {
                await Payment.findOneAndUpdate(
                    { razorpayPaymentId: failedPaymentId },
                    { 
                        status: 'failed', 
                        error: payload.payment?.entity || { message: 'Payment failed' }
                    }
                );
            }
            break;

        case 'order.paid':
            const orderId = payload.order?.entity?.id;
            Logger.info(`Order paid via webhook: ${orderId}`);
            break;

        default:
            Logger.debug(`Unhandled webhook event: ${event}`, payload);
    }

    res.status(200).json({ received: true, event });
});

module.exports = {
    createOrder,
    verifyPayment,
    getPaymentHistory,
    getSubscriptionStatus: getSubscriptionStatusEndpoint,
    updateExpired,
    handleWebhook
};
