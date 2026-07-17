const { AppError } = require('./errorHandler');
const { isValidEmail, isValidUrl, isValidObjectId } = require('./sanitize');

/**
 * Validation middleware factory
 * Creates middleware to validate request data
 */
const validate = (rules) => {
  return (req, res, next) => {
    const errors = [];

    // Validate body
    if (rules.body) {
      for (const [field, validators] of Object.entries(rules.body)) {
        const value = req.body?.[field];
        
        for (const validator of validators) {
          const error = validator(field, value, req.body);
          if (error) {
            errors.push(error);
            break; // Stop at first error for this field
          }
        }
      }
    }

    // Validate params
    if (rules.params) {
      for (const [field, validators] of Object.entries(rules.params)) {
        const value = req.params?.[field];
        
        for (const validator of validators) {
          const error = validator(field, value, req.params);
          if (error) {
            errors.push(error);
            break;
          }
        }
      }
    }

    // Validate query
    if (rules.query) {
      for (const [field, validators] of Object.entries(rules.query)) {
        const value = req.query?.[field];
        
        for (const validator of validators) {
          const error = validator(field, value, req.query);
          if (error) {
            errors.push(error);
            break;
          }
        }
      }
    }

    if (errors.length > 0) {
      return next(new AppError(errors.join(', '), 400, 'VALIDATION_ERROR'));
    }

    next();
  };
};

/**
 * Validator functions
 */
const validators = {
  /**
   * Required field validator
   */
  required: (field, value) => {
    if (value === undefined || value === null || value === '') {
      return `${field} is required`;
    }
    return null;
  },

  /**
   * Optional field validator (always passes, used for chaining)
   */
  optional: () => null,

  /**
   * String type validator
   */
  isString: (field, value) => {
    if (value !== undefined && typeof value !== 'string') {
      return `${field} must be a string`;
    }
    return null;
  },

  /**
   * Number type validator
   */
  isNumber: (field, value) => {
    if (value !== undefined && (typeof value !== 'number' || isNaN(value))) {
      return `${field} must be a number`;
    }
    return null;
  },

  /**
   * Integer validator
   */
  isInt: (field, value) => {
    if (value !== undefined && (!Number.isInteger(Number(value)))) {
      return `${field} must be an integer`;
    }
    return null;
  },

  /**
   * Boolean validator
   */
  isBoolean: (field, value) => {
    if (value !== undefined && typeof value !== 'boolean') {
      return `${field} must be a boolean`;
    }
    return null;
  },

  /**
   * Array validator
   */
  isArray: (field, value) => {
    if (value !== undefined && !Array.isArray(value)) {
      return `${field} must be an array`;
    }
    return null;
  },

  /**
   * Object validator
   */
  isObject: (field, value) => {
    if (value !== undefined && (typeof value !== 'object' || Array.isArray(value) || value === null)) {
      return `${field} must be an object`;
    }
    return null;
  },

  /**
   * Email validator
   */
  isEmail: (field, value) => {
    if (value !== undefined && value !== null && value !== '' && !isValidEmail(value)) {
      return `${field} must be a valid email address`;
    }
    return null;
  },

  /**
   * URL validator
   */
  isUrl: (field, value) => {
    if (value !== undefined && value !== null && value !== '' && !isValidUrl(value)) {
      return `${field} must be a valid URL`;
    }
    return null;
  },

  /**
   * MongoDB ObjectId validator
   */
  isMongoId: (field, value) => {
    if (value !== undefined && value !== null && value !== '' && !isValidObjectId(value)) {
      return `${field} must be a valid MongoDB ObjectId`;
    }
    return null;
  },

  /**
   * String length validator
   */
  length: (min, max) => {
    return (field, value) => {
      if (value !== undefined && value !== null && value !== '') {
        const len = typeof value === 'string' ? value.length : String(value).length;
        if (min !== undefined && len < min) {
          return `${field} must be at least ${min} characters`;
        }
        if (max !== undefined && len > max) {
          return `${field} must be at most ${max} characters`;
        }
      }
      return null;
    };
  },

  /**
   * Number range validator
   */
  range: (min, max) => {
    return (field, value) => {
      if (value !== undefined && value !== null && value !== '') {
        const num = Number(value);
        if (isNaN(num)) {
          return `${field} must be a number`;
        }
        if (min !== undefined && num < min) {
          return `${field} must be at least ${min}`;
        }
        if (max !== undefined && num > max) {
          return `${field} must be at most ${max}`;
        }
      }
      return null;
    };
  },

  /**
   * Enum validator
   */
  isIn: (allowedValues) => {
    return (field, value) => {
      if (value !== undefined && value !== null && value !== '' && !allowedValues.includes(value)) {
        return `${field} must be one of: ${allowedValues.join(', ')}`;
      }
      return null;
    };
  },

  /**
   * Array length validator
   */
  arrayLength: (min, max) => {
    return (field, value) => {
      if (value !== undefined && value !== null) {
        if (!Array.isArray(value)) {
          return `${field} must be an array`;
        }
        if (min !== undefined && value.length < min) {
          return `${field} must have at least ${min} items`;
        }
        if (max !== undefined && value.length > max) {
          return `${field} must have at most ${max} items`;
        }
      }
      return null;
    };
  },

  /**
   * Custom validator
   */
  custom: (fn, message) => {
    return (field, value, allData) => {
      if (value !== undefined && value !== null && value !== '') {
        if (!fn(value, allData)) {
          return message || `${field} is invalid`;
        }
      }
      return null;
    };
  }
};

/**
 * Common validation rules for reuse
 */
const commonRules = {
  email: [validators.required, validators.isEmail],
  optionalEmail: [validators.optional, validators.isEmail],
  mongoId: [validators.required, validators.isMongoId],
  optionalMongoId: [validators.optional, validators.isMongoId],
  string: (min = 1, max = 1000) => [validators.required, validators.isString, validators.length(min, max)],
  optionalString: (min = 0, max = 1000) => [validators.optional, validators.isString, validators.length(min, max)],
  number: (min, max) => [validators.required, validators.isNumber, validators.range(min, max)],
  optionalNumber: (min, max) => [validators.optional, validators.isNumber, validators.range(min, max)],
  boolean: [validators.required, validators.isBoolean],
  optionalBoolean: [validators.optional, validators.isBoolean],
  array: (min, max) => [validators.required, validators.isArray, validators.arrayLength(min, max)],
  optionalArray: (min, max) => [validators.optional, validators.isArray, validators.arrayLength(min, max)],
  url: [validators.required, validators.isUrl],
  optionalUrl: [validators.optional, validators.isUrl]
};

module.exports = {
  validate,
  validators,
  commonRules
};

