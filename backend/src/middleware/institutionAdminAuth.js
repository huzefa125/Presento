const jwt = require('jsonwebtoken');
const Institution = require('../models/Institution');

/**
 * Middleware to verify Institution Admin JWT token
 */
const verifyInstitutionAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Access denied. No token provided.' 
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verify it's an institution admin token
      if (!decoded.institutionAdmin || !decoded.institutionId) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied. Invalid institution admin token.' 
        });
      }

      // Verify institution exists and is active
      const institution = await Institution.findById(decoded.institutionId);
      if (!institution) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied. Institution not found.' 
        });
      }
      
      if (!institution.isActive) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied. Institution is inactive.' 
        });
      }

      req.institution = institution;
      req.institutionId = institution._id;
      req.institutionAdmin = decoded;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid token.' 
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false,
          error: 'Token expired. Please login again.' 
        });
      }
      throw error;
    }
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Server error during authentication.' 
    });
  }
};

module.exports = { verifyInstitutionAdmin };

