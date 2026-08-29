import 'dotenv/config';
import type { IncomingMessage, ServerResponse } from 'http';
import app from '../server/src/app.js';
import { connectDB } from '../server/src/config/db.js';

/**
 * Vercel serverless entry point.
 *
 * `vercel.json` rewrites every `/api/*` request here, and the Express app in
 * `server/src/app.ts` still owns the routing from there. The long-lived
 * `server/src/index.ts` listener is only used for local development.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Depending on how the rewrite is resolved the function can be invoked with
  // the `/api` prefix already stripped; the Express routes are mounted under
  // `/api`, so put it back when it is missing.
  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url === '/' ? '' : req.url}`;
  }

  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection failed:', (err as Error).message);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Service unavailable — database connection failed' }));
    return;
  }

  return app(req, res);
}
