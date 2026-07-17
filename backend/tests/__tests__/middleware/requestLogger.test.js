const { requestLogger } = require('../../../src/middleware/requestLogger');
const Logger = require('../../../src/utils/logger');

jest.mock('../../../src/utils/logger');

describe('Request Logger Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'GET',
      url: '/api/test',
      originalUrl: '/api/test',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent'
      },
      connection: {
        remoteAddress: '127.0.0.1'
      }
    };

    res = {
      statusCode: 200,
      setHeader: jest.fn(),
      end: jest.fn(function(chunk, encoding) {
        this.end = jest.fn();
        if (this._originalEnd) {
          this._originalEnd.call(this, chunk, encoding);
        }
      })
    };

    next = jest.fn();
    Logger.info = jest.fn();
    Logger.warn = jest.fn();
    Logger.error = jest.fn();
  });

  it('should generate a request ID and set it in response header', () => {
    requestLogger(req, res, next);

    expect(req.requestId).toBeDefined();
    expect(typeof req.requestId).toBe('string');
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', req.requestId);
    expect(next).toHaveBeenCalled();
  });

  it('should log successful requests (2xx)', (done) => {
    res.statusCode = 200;
    const originalEnd = res.end;

    requestLogger(req, res, next);

    res.end('response', 'utf8');

    setTimeout(() => {
      expect(Logger.info).toHaveBeenCalled();
      expect(Logger.info.mock.calls[0][0]).toContain('GET');
      expect(Logger.info.mock.calls[0][0]).toContain('/api/test');
      expect(Logger.info.mock.calls[0][0]).toContain('200');
      done();
    }, 10);
  });

  it('should log client errors (4xx) as warnings', (done) => {
    res.statusCode = 404;
    requestLogger(req, res, next);

    res.end('Not Found', 'utf8');

    setTimeout(() => {
      expect(Logger.warn).toHaveBeenCalled();
      expect(Logger.warn.mock.calls[0][0]).toContain('404');
      done();
    }, 10);
  });

  it('should log server errors (5xx) as errors', (done) => {
    res.statusCode = 500;
    requestLogger(req, res, next);

    res.end('Internal Server Error', 'utf8');

    setTimeout(() => {
      expect(Logger.error).toHaveBeenCalled();
      expect(Logger.error.mock.calls[0][0]).toContain('500');
      done();
    }, 10);
  });

  it('should include user ID in logs if authenticated', (done) => {
    req.userId = 'user123';
    res.statusCode = 200;
    requestLogger(req, res, next);

    res.end('response', 'utf8');

    setTimeout(() => {
      expect(Logger.info).toHaveBeenCalled();
      const logCall = Logger.info.mock.calls[0];
      expect(logCall[0]).toContain('user123');
      done();
    }, 10);
  });

  it('should calculate response time', (done) => {
    res.statusCode = 200;
    requestLogger(req, res, next);

    setTimeout(() => {
      res.end('response', 'utf8');
      
      setTimeout(() => {
        expect(Logger.info).toHaveBeenCalled();
        expect(Logger.info.mock.calls[0][0]).toMatch(/\d+ms/);
        done();
      }, 10);
    }, 10);
  });
});

