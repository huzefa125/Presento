const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const isDevelopment = process.env.NODE_ENV !== 'production';

// Log levels: 'error' < 'warn' < 'info' < 'debug'
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// Get log level from environment, default to 'warn' in production, 'info' in development
const getLogLevel = () => {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase();
  if (envLevel && LOG_LEVELS.hasOwnProperty(envLevel)) {
    return LOG_LEVELS[envLevel];
  }
  return isDevelopment ? LOG_LEVELS.info : LOG_LEVELS.warn;
};

const currentLogLevel = getLogLevel();

class Logger {
  static formatMessage(level, message, color) {
    const timestamp = new Date().toISOString();
    const levelTag = `[${level}]`.padEnd(8);
    return `${color}${levelTag}${colors.reset} ${colors.dim}${timestamp}${colors.reset} ${message}`;
  }

  static info(message) {
    if (currentLogLevel >= LOG_LEVELS.info) {
      console.log(this.formatMessage('INFO', message, colors.cyan));
    }
  }

  static success(message) {
    // Success messages are always shown (like startup messages)
    console.log(this.formatMessage('SUCCESS', message, colors.green));
  }

  static warn(message) {
    if (currentLogLevel >= LOG_LEVELS.warn) {
      console.warn(this.formatMessage('WARN', message, colors.yellow));
    }
  }

  static error(message, error = null) {
    if (currentLogLevel >= LOG_LEVELS.error) {
      const errorMessage = error ? `${message}: ${error.message || error}` : message;
      console.error(this.formatMessage('ERROR', errorMessage, colors.red));
      if (error && isDevelopment && error.stack) {
        console.error(colors.dim + error.stack + colors.reset);
      }
    }
  }

  static debug(message) {
    if (currentLogLevel >= LOG_LEVELS.debug) {
      console.log(this.formatMessage('DEBUG', message, colors.magenta));
    }
  }

  static startup(message) {
    // Startup messages are always shown
    console.log(colors.green + colors.bright + '✓' + colors.reset + ' ' + message);
  }
}

module.exports = Logger;

