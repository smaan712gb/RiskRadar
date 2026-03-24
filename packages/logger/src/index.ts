import pino, { type Logger, type LoggerOptions } from 'pino';

export type { Logger } from 'pino';

export interface LogContext {
  tenantId?: string;
  requestId?: string;
  userId?: string;
  agentId?: string;
  [key: string]: unknown;
}

const defaultOptions: LoggerOptions = {
  level: process.env['LOG_LEVEL'] ?? 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    },
    bindings(bindings) {
      return {
        pid: bindings['pid'],
        hostname: bindings['hostname'],
        service: process.env['OTEL_SERVICE_NAME'] ?? 'riskradar',
      };
    },
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'credentials',
      'accessToken',
      'refreshToken',
      'config.credentials',
      '*.password',
      '*.secret',
      '*.apiKey',
    ],
    censor: '[REDACTED]',
  },
};

const devTransport: LoggerOptions['transport'] = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname',
  },
};

export function createLogger(name: string, context?: LogContext): Logger {
  const options: LoggerOptions = {
    ...defaultOptions,
    name,
    ...(process.env['NODE_ENV'] !== 'production' && { transport: devTransport }),
  };

  const logger = pino(options);

  if (context) {
    return logger.child(context);
  }

  return logger;
}

export function createChildLogger(parent: Logger, context: LogContext): Logger {
  return parent.child(context);
}

export const logger = createLogger('riskradar');
