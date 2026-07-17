const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth'); 

router.post('/webhook', 
    express.raw({ type: 'application/json' }), 
    (req, res, next) => {
        try {
            req.body = JSON.parse(req.body.toString());
            req.rawBody = req.body.toString();
        } catch (error) {
            return res.status(400).json({ error: 'Invalid JSON' });
        }
        next();
    },
    paymentController.handleWebhook
);

router.post('/update-expired', paymentController.updateExpired);

// Apply authentication - userId will be available after this
router.use(verifyToken);

/**
 * @swagger
 * /api/payments/create-order:
 *   post:
 *     summary: Create Razorpay order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plan
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [pro-monthly, pro-yearly, lifetime, institution]
 *     responses:
 *       200:
 *         description: Order created successfully
 *       400:
 *         description: Invalid plan
 */
router.post('/create-order', paymentController.createOrder);

/**
 * @swagger
 * /api/payments/verify-payment:
 *   post:
 *     summary: Verify Razorpay payment and update subscription
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - razorpayOrderId
 *               - razorpayPaymentId
 *               - razorpaySignature
 *               - plan
 *             properties:
 *               razorpayOrderId:
 *                 type: string
 *               razorpayPaymentId:
 *                 type: string
 *               razorpaySignature:
 *                 type: string
 *               plan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified and subscription updated
 *       400:
 *         description: Invalid payment signature
 */
router.post('/verify-payment', paymentController.verifyPayment);

/**
 * @swagger
 * /api/payments/history:
 *   get:
 *     summary: Get payment history for current user
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 payments:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/history', paymentController.getPaymentHistory);

/**
 * @swagger
 * /api/payments/subscription:
 *   get:
 *     summary: Get current user's subscription status
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 subscription:
 *                   type: object
 */
router.get('/subscription', paymentController.getSubscriptionStatus);

module.exports = router;
