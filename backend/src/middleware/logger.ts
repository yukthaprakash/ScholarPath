import pino from 'pino';
import pinoHttp from 'pino-http';
import { Request } from 'express';
import { env } from '../config/env';

// Redacted paths to prevent any sensitive data, credentials, or PII from being logged
const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["set-cookie"]',
  '*.password',
  '*.token',
  '*.secret',
  '*.privateKey',
  '*.private_key',
  '*.apiKey',
  '*.annual_income',
  '*.annualIncome',
  '*.income',
  '*.caste',
  '*.category',
  '*.aadhaar',
  '*.certificate',
  '*.documentNumber',
  '*.dateOfBirth',
  '*.dob'
];

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
  redact: {
    paths: REDACTED_PATHS,
    censor: '[REDACTED]'
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => (req as Request).id ?? (req.headers['x-request-id'] as string) ?? 'unknown',
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      query: req.query
    }),
    res: (res) => ({
      statusCode: res.statusCode
    })
  }
});
