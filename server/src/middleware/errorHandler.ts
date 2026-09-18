import { Request, Response, NextFunction } from 'express';
import { reportError } from '../lib/monitoring.js';

export async function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e: any) => e.message);
    return res.status(400).json({ message: 'Validation error', errors: messages });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ message: `Duplicate value for ${field}` });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  const statusCode = err.statusCode || 500;
  // A 5xx message is whatever the failing library said -- a Mongo error, a
  // driver string, a file path. Useful in the logs, not something to hand the
  // browser in production.
  const message =
    statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  // Only genuine faults. 4xx are the client's mistake and would drown the signal.
  if (statusCode >= 500) {
    await reportError(err, { method: req.method, path: req.originalUrl });
  }
  res.status(statusCode).json({ message });
}
