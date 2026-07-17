const { validate, validators, commonRules } = require('../../../src/middleware/validate');
const { AppError } = require('../../../src/middleware/errorHandler');

describe('Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {}
    };
    res = {};
    next = jest.fn();
  });

  describe('validate middleware', () => {
    it('should pass validation when all rules are satisfied', () => {
      req.body = {
        email: 'test@example.com',
        name: 'Test User'
      };

      const middleware = validate({
        body: {
          email: commonRules.email,
          name: commonRules.string(1, 100)
        }
      });

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should fail validation when required field is missing', () => {
      req.body = {
        name: 'Test User'
      };

      const middleware = validate({
        body: {
          email: commonRules.email,
          name: commonRules.string(1, 100)
        }
      });

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain('email is required');
    });

    it('should validate params', () => {
      req.params = {
        id: 'invalid-id'
      };

      const middleware = validate({
        params: {
          id: commonRules.mongoId
        }
      });

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.message).toContain('id must be a valid MongoDB ObjectId');
    });

    it('should validate query parameters', () => {
      req.query = {
        page: 'not-a-number'
      };

      const middleware = validate({
        query: {
          page: [validators.optional, validators.isInt]
        }
      });

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('validators', () => {
    describe('required', () => {
      it('should return error for undefined value', () => {
        const error = validators.required('field', undefined);
        expect(error).toBe('field is required');
      });

      it('should return error for null value', () => {
        const error = validators.required('field', null);
        expect(error).toBe('field is required');
      });

      it('should return error for empty string', () => {
        const error = validators.required('field', '');
        expect(error).toBe('field is required');
      });

      it('should return null for valid value', () => {
        const error = validators.required('field', 'value');
        expect(error).toBeNull();
      });
    });

    describe('isEmail', () => {
      it('should return error for invalid email', () => {
        const error = validators.isEmail('email', 'invalid-email');
        expect(error).toBe('email must be a valid email address');
      });

      it('should return null for valid email', () => {
        const error = validators.isEmail('email', 'test@example.com');
        expect(error).toBeNull();
      });

      it('should return null for undefined (optional)', () => {
        const error = validators.isEmail('email', undefined);
        expect(error).toBeNull();
      });
    });

    describe('length', () => {
      it('should return error for string shorter than min', () => {
        const lengthValidator = validators.length(5, 10);
        const error = lengthValidator('field', 'abc');
        expect(error).toBe('field must be at least 5 characters');
      });

      it('should return error for string longer than max', () => {
        const lengthValidator = validators.length(5, 10);
        const error = lengthValidator('field', 'abcdefghijklmnop');
        expect(error).toBe('field must be at most 10 characters');
      });

      it('should return null for valid length', () => {
        const lengthValidator = validators.length(5, 10);
        const error = lengthValidator('field', 'abcdef');
        expect(error).toBeNull();
      });
    });

    describe('isIn', () => {
      it('should return error for value not in allowed list', () => {
        const enumValidator = validators.isIn(['option1', 'option2']);
        const error = enumValidator('field', 'option3');
        expect(error).toBe('field must be one of: option1, option2');
      });

      it('should return null for value in allowed list', () => {
        const enumValidator = validators.isIn(['option1', 'option2']);
        const error = enumValidator('field', 'option1');
        expect(error).toBeNull();
      });
    });
  });

  describe('commonRules', () => {
    it('should validate email correctly', () => {
      const middleware = validate({
        body: {
          email: commonRules.email
        }
      });

      req.body = { email: 'test@example.com' };
      middleware(req, res, next);
      expect(next).toHaveBeenCalledWith();

      req.body = { email: 'invalid' };
      middleware(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should validate mongoId correctly', () => {
      const middleware = validate({
        params: {
          id: commonRules.mongoId
        }
      });

      req.params = { id: '507f1f77bcf86cd799439011' };
      middleware(req, res, next);
      expect(next).toHaveBeenCalledWith();

      req.params = { id: 'invalid' };
      middleware(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });
});

