/**
 * Tests for error handling middleware
 */

const { AppError, errorHandler, asyncHandler } = require('../../../src/middleware/errorHandler');

describe('Error Handler Middleware', () => {
  describe('AppError', () => {
    it('should create an AppError with default status code', () => {
      const error = new AppError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    it('should create an AppError with custom status code', () => {
      const error = new AppError('Not found', 404, 'NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });
  });

  describe('asyncHandler', () => {
    it('should catch async errors and pass to next', async () => {
      const req = {};
      const res = {};
      const next = jest.fn();
      
      const asyncFn = asyncHandler(async () => {
        throw new Error('Test error');
      });

      await asyncFn(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should pass through successful async functions', async () => {
      const req = {};
      const res = { json: jest.fn() };
      const next = jest.fn();
      
      const asyncFn = asyncHandler(async (req, res) => {
        res.json({ success: true });
      });

      await asyncFn(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ success: true });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('errorHandler', () => {
    let req, res, next;

    beforeEach(() => {
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    it('should handle AppError correctly', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Test error',
        code: 'TEST_ERROR'
      });
    });

    it('should handle Mongoose CastError', () => {
      const error = { name: 'CastError' };
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'RESOURCE_NOT_FOUND'
        })
      );
    });

    it('should handle Mongoose duplicate key error', () => {
      const error = {
        code: 11000,
        keyPattern: { email: 1 }
      };
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'DUPLICATE_ENTRY'
        })
      );
    });

    it('should handle JWT errors', () => {
      const error = { name: 'JsonWebTokenError' };
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'INVALID_TOKEN'
        })
      );
    });
  });
});

