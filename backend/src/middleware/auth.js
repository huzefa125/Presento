const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const User = require('../models/User');
const Institution = require('../models/Institution');
const Logger = require('../utils/logger');

/**
 * Middleware to verify JWT token (supports both regular users and institution admins)
 */
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if this is an institution admin token
    if (decoded.institutionAdmin && decoded.institutionId) {
      const institution = await Institution.findById(decoded.institutionId);
      
      if (!institution) {
        return res.status(401).json({ error: 'Invalid token. Institution not found.' });
      }
      
      // For institution admins, find or create a user record based on admin email
      // This allows them to create presentations
      // Normalize email to lowercase for consistency
      const adminEmail = institution.adminEmail?.toLowerCase().trim();
      let user = await User.findOne({ email: adminEmail });
      
      if (!user) {
        try {
          // Create a user record for the institution admin
          user = new User({
            email: adminEmail,
            displayName: institution.adminName || adminEmail.split('@')[0],
            isInstitutionUser: true,
            institutionId: institution._id,
            subscription: {
              plan: 'institution',
              status: 'active'
            }
          });
          await user.save();
        } catch (saveError) {
          // If save fails (e.g., duplicate key), try to find the user again
          // This can happen in race conditions
          if (saveError.code === 11000) {
            user = await User.findOne({ email: adminEmail });
            if (!user) {
              Logger.error('Failed to create user for institution admin', saveError);
              return res.status(500).json({ error: 'Failed to create user account.' });
            }
          } else {
            Logger.error('Error creating user for institution admin', saveError);
            return res.status(500).json({ error: 'Server error during user creation.' });
          }
        }
      }
      
      req.user = user;
      req.userId = user._id;
      req.institutionAdmin = true;
      req.institution = institution;
      return next();
    }
    
    // Regular user token
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    Logger.error('Authentication error', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    // Log the full error for debugging
    Logger.error('Unexpected authentication error', { error: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Server error during authentication.' });
  }
};

/**
 * Middleware to verify Firebase token (optional - for direct Firebase auth)
 */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid Firebase token.' });
  }
};

module.exports = { verifyToken, verifyFirebaseToken };
