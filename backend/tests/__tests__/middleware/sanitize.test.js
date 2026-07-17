/**
 * Tests for input sanitization middleware
 */

const { sanitizeString, sanitizeObject, isValidEmail, isValidUrl, isValidObjectId } = require('../../../src/middleware/sanitize');

describe('Sanitization Middleware', () => {
  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeString(input);
      expect(result).toBe('scriptalert("xss")/scriptHello');
    });

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert("xss")';
      const result = sanitizeString(input);
      expect(result).toBe('alert("xss")');
    });

    it('should trim whitespace', () => {
      const input = '  hello world  ';
      const result = sanitizeString(input);
      expect(result).toBe('hello world');
    });

    it('should handle non-string input', () => {
      expect(sanitizeString(123)).toBe(123);
      expect(sanitizeString(null)).toBe(null);
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize nested objects', () => {
      const input = {
        name: '<script>alert("xss")</script>',
        email: '  test@example.com  ',
        nested: {
          value: 'javascript:void(0)'
        }
      };
      const result = sanitizeObject(input);
      expect(result.name).not.toContain('<script>');
      expect(result.email).toBe('test@example.com');
      expect(result.nested.value).not.toContain('javascript:');
    });

    it('should sanitize arrays', () => {
      const input = ['<script>', '  hello  ', 'world'];
      const result = sanitizeObject(input);
      expect(result[0]).not.toContain('<script>');
      expect(result[1]).toBe('hello');
    });

    it('should preserve skip fields', () => {
      const input = {
        question: '<script>alert("xss")</script>',
        imageUrl: 'javascript:void(0)',
        normalField: '<script>test</script>'
      };
      const result = sanitizeObject(input);
      expect(result.question).toContain('<script>'); // Preserved
      expect(result.imageUrl).toContain('javascript:'); // Preserved
      expect(result.normalField).not.toContain('<script>'); // Sanitized
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
    });
  });

  describe('isValidObjectId', () => {
    it('should validate MongoDB ObjectIds', () => {
      expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
      expect(isValidObjectId('507f191e810c19729de860ea')).toBe(true);
    });

    it('should reject invalid ObjectIds', () => {
      expect(isValidObjectId('invalid')).toBe(false);
      expect(isValidObjectId('123')).toBe(false);
      expect(isValidObjectId('507f1f77bcf86cd79943901')).toBe(false); // Too short
    });
  });
});

