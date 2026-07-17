const jwt = require('jsonwebtoken');

/**
 * Middleware to verify Super Admin JWT token
 */
const verifySuperAdmin = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Access denied. No token provided.' 
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.SUPER_ADMIN_JWT_SECRET || process.env.JWT_SECRET);
      
      // Verify it's a super admin token (has superAdmin: true)
      if (!decoded.superAdmin) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied. Invalid admin token.' 
        });
      }

      req.superAdmin = decoded;
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

module.exports = { verifySuperAdmin };

