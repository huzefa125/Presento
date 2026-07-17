import axios from 'axios';
import { getApiUrl } from '../utils/config';

const API_URL = getApiUrl();

/**
 * Load Razorpay SDK
 */
export const loadRazorpay = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

/**
 * Create a new payment order
 * @param {string} planId - The plan ID (e.g., 'pro-monthly', 'pro-yearly', 'lifetime')
 * @param {string} token - User's auth token
 */
export const createOrder = async (planId, token) => {
    try {
        // Validate API URL
        if (!API_URL || !API_URL.startsWith('http')) {
            console.error('Invalid API_URL:', API_URL);
            throw new Error('Invalid API configuration. Please check VITE_API_URL in your .env file.');
        }

        const requestUrl = `${API_URL}/api/payments/create-order`;
        
        // Debug log in development
        if (import.meta.env.DEV) {
            console.log('Creating order with URL:', requestUrl);
            console.log('Plan ID:', planId);
        }

        const response = await axios.post(
            requestUrl,
            { plan: planId },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                timeout: 10000 // 10 second timeout
            }
        );
        return response.data;
    } catch (error) {
        // Better error handling
        if (error.code === 'ERR_NETWORK' || error.message.includes('ERR_CONNECTION_REFUSED')) {
            console.error('Connection error:', error);
            throw new Error('Cannot connect to server. Please make sure the backend server is running on port 4000. Check your .env file has VITE_API_URL=http://localhost:4000');
        }
        if (error.code === 'ECONNREFUSED') {
            throw new Error('Backend server is not running. Please start the backend server on port 4000.');
        }
        if (error.response?.status === 401) {
            throw new Error('Authentication failed. Please login again.');
        }
        if (error.response?.status === 400) {
            throw new Error(error.response?.data?.error || 'Invalid request. Please check your plan selection.');
        }
        console.error('Create order error:', error);
        throw new Error(error.response?.data?.error || error.message || 'Failed to create order');
    }
};

/**
 * Verify payment signature
 * @param {Object} paymentData - Razorpay payment details
 * @param {string} token - User's auth token
 */
export const verifyPayment = async (paymentData, token) => {
    try {
        const response = await axios.post(
            `${API_URL}/api/payments/verify-payment`,
            paymentData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        return response.data;
    } catch (error) {
        // Better error handling
        if (error.code === 'ERR_NETWORK' || error.message.includes('ERR_CONNECTION_REFUSED')) {
            throw new Error('Cannot connect to server. Please make sure the backend server is running.');
        }
        if (error.response?.status === 401) {
            throw new Error('Authentication failed. Please login again.');
        }
        throw new Error(error.response?.data?.error || error.message || 'Payment verification failed');
    }
};
